import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import { HeroSection } from "../../components/client/HeroSection";
import { ServicesSection } from "../../components/client/ServicesSection";
import { WorkshopsSection } from "../../components/client/WorkshopsSection";
import { TestimonialsSection } from "../../components/client/TestimonialsSection";
import { ProgressBar } from "../../components/client/ProgressBar";
import { Input, Select } from "../../components/common";
import { sheetsService, type Commission } from "../../services/sheetsService";
import { sendAdminNotificationEmail, sendClientQueueNotificationEmail } from "../../services/emailService";

/**
 * Root component for the Client domain. Handles the landing page and the multi-step commission request form.
 * @param {Object} props
 * @param {Function} props.onBack 
 * @returns {JSX.Element} 
 */
export function ClientPortal({
  onBack,
  commissions,
  onAdd,
  isLoading
}: {
  onBack: () => void;
  commissions: Commission[];
  onAdd: (newCom: Omit<Commission, "rm" | "printer" | "status" | "deadline" | "problems">) => Promise<void>;
  isLoading: boolean;
}) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", clientType: "",
    contactNumber: "",
    affiliation: "",
    isDlsuStudent: true,
    idNumber: "", program: "", college: "CCS", department: "",
    service: "", purpose: "Academic / Thesis", purposeOther: "",
    color: "Single Color", selectedColor: "", selectedColors: [] as string[], colorOther: "", filament: "PLA", expectedPickupDate: "", notes: "",
    pickupOption: "JGIC 201 Pickup (Laguna Campus)",
    driveLink: "",
    weight: 200,
    isWeightNA: false
  });
  const [mockLogs, setMockLogs] = useState<string[]>([]);

  // Capacity validation
  const activeCommissions = commissions.filter(c => c.status !== "Completed" && c.status !== "Rejected" && c.status !== "Awaiting Approval");
  const activeCount = activeCommissions.length;

  // Weekend disclaimer check: Friday (5), Saturday (6), Sunday (0)
  const isWeekend = [0, 5, 6].includes(new Date().getDay());

  // Form validation regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const idRegex = /^\d{8}$/;

  const emailError = form.email.trim() && !emailRegex.test(form.email.trim())
    ? "Please enter a valid email address."
    : "";

  const idError = form.clientType === "DLSU Student" && form.idNumber.trim() && !idRegex.test(form.idNumber.trim())
    ? "ID number must be exactly 8 digits."
    : "";

  const clientTypeError = !form.clientType.trim()
    ? "Please select a client type."
    : "";

  const phoneRegex = /^\d{11}$/;
  const contactError = form.contactNumber.trim() && !phoneRegex.test(form.contactNumber.trim())
    ? "Contact number must be exactly 11 digits."
    : "";

  const purposeOtherError = form.purpose === "Others" && !form.purposeOther.trim()
    ? "Please specify your purpose."
    : "";

  const colorOptions = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Gray", "Brown", "Transparent"];
  const materialColor = form.color === "Single Color"
    ? form.selectedColor
    : form.color === "Multi-Color"
      ? form.selectedColors.join(", ")
      : form.colorOther;

  const colorSelectionError = form.color === "Single Color" && !form.selectedColor
    ? "Please select a color."
    : form.color === "Multi-Color" && form.selectedColors.length === 0
      ? "Please select at least one color."
      : "";

  const colorOtherError = form.color === "Others" && !form.colorOther.trim()
    ? "Please specify your preferred color."
    : "";

  const needsDriveLink = form.service === "3D Printing With File";
  const driveLinkError = needsDriveLink && !form.driveLink.trim()
    ? "A Google Drive link is required for this service."
    : "";

  // Step validation check
  const isStepValid = () => {
    if (step === 1) {
      if (!form.name.trim() || !form.email.trim()) return false;
      if (emailError) return false;
      if (!form.clientType.trim()) return false;
      if (!form.contactNumber.trim() || contactError) return false;
      
      if (form.clientType === "DLSU Student") {
        if (!form.idNumber.trim() || !form.program.trim() || !form.college) return false;
        if (idError) return false;
      } else if (form.clientType === "Non-DLSU Student") {
        if (!form.program.trim() || !form.affiliation.trim()) return false;
      } else if (form.clientType === "Faculty") {
        if (!form.department.trim()) return false;
      } else if (form.clientType === "Outsider") {
        if (!form.affiliation.trim()) return false;
      }
      return true;
    }
    if (step === 2) {
      if (!form.service) return false;
      if (purposeOtherError) return false;
      return true;
    }
    if (step === 3) {
      if (!form.isWeightNA && (form.weight <= 0 || form.weight > 1000)) return false;
      if (colorSelectionError) return false;
      if (colorOtherError) return false;
      if (driveLinkError) return false;
      if (!form.expectedPickupDate) return false;
      if (!form.pickupOption) return false;
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Fetch the latest commissions directly from Google Sheets/localStorage fallback first
      const currentCommissions = await sheetsService.fetchCommissions();

      // Find the highest current numeric ID to avoid duplicates if rows are filtered or deleted
      let maxIdNum = 0;
      currentCommissions.forEach(c => {
        if (c.id && c.id.startsWith("COM-")) {
          const num = parseInt(c.id.substring(4), 10);
          if (!isNaN(num) && num > maxIdNum) {
            maxIdNum = num;
          }
        }
      });

      console.log(maxIdNum);
      const nextIdNum = maxIdNum + 1;
      const nextId = `COM-${nextIdNum.toString().padStart(3, "0")}`;

      const submittedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const newCommission = {
        id: nextId,
        client: form.name,
        clientEmail: form.email,
        clientContactNumber: form.contactNumber,
        clientType: form.clientType,
        affiliation: form.affiliation,
        isDlsuStudent: form.isDlsuStudent,
        idNumber: form.idNumber,
        program: form.program,
        college: form.college,
        department: form.department,
        service: form.service,
        purpose: form.purpose,
        purposeOther: form.purposeOther,
        color: `${form.color}${materialColor ? `: ${materialColor}` : ""}`,
        colorOther: form.colorOther,
        filament: form.filament,
        expectedPickupDate: form.expectedPickupDate,
        pickupOption: form.pickupOption,
        weight: form.weight,
        notes: form.notes,
        file: form.driveLink.trim() || "N/A (Drive link provided)",
        driveLink: form.driveLink,
        submitted: submittedDate
      };

      await onAdd(newCommission);

      // Send admin notification email
      await sendAdminNotificationEmail(
        form.name,
        form.email,
        form.clientType,
        nextId,
        form.service,
        submittedDate
      );

      // Send client queue notification email
      await sendClientQueueNotificationEmail(
        form.name,
        form.email,
        nextId,
        form.service,
        submittedDate
      );

      setMockLogs([
        `📧 Client Receipt: Confirmation email sent to ${form.email} for your "${form.service}" request.`,
        `📧 System Dispatch: Admin queue notified of new "${form.service}" commission from ${form.name}. ID: ${nextId}.`
      ]);
      setStep(5);
    } catch (error) {
      console.error("Error submitting commission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const stepsList = ["Personal Details", "Service Selection", "Commission Details", "Confirmation"];

  if (step === 0) {
    return (
      <div className="min-h-screen bg-white light">
        {/* Helper Toolbar for displaying capacity */}
        <div className="bg-gray-100 text-gray-700 py-1.5 px-4 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>FabLab Capacity: <strong>{activeCount} Active Commissions</strong> (Queue is AVAILABLE)</span>
          </div>
          {!import.meta.env.VITE_GOOGLE_SCRIPT_URL && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.setItem("fablab_commissions_v2", JSON.stringify([]));
                  window.location.reload();
                }}
                className="text-violet-600 hover:text-violet-800 font-bold underline transition text-left"
              >
                Clear Database (Simulate Empty Sheet)
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("fablab_commissions_v2");
                  window.location.reload();
                }}
                className="text-violet-600 hover:text-violet-800 font-bold underline transition text-left"
              >
                Restore Mock Data
              </button>
            </div>
          )}
        </div>


        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">F</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Animo Labs - DLSU Science Foundation Inc.</span>
          </div>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition">Back to Home</button>
        </header>
        <main>
          <HeroSection onStart={() => {
            setStep(1);
          }} />
          <ServicesSection />
          <WorkshopsSection />
          <TestimonialsSection />
        </main>
        <footer className="bg-gray-900 text-white/50 text-center py-8 text-sm">
          <p>© 2026 Animo Labs - DLSU Science Foundation Inc.. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col light">
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center">
        <button onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition">
          <ArrowLeft className="w-4 h-4" /> Cancel Request
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center py-10 px-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12">
          {step < 5 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Commission Request</h2>
              <ProgressBar step={step} steps={stepsList} />
            </div>
          )}

          {step > 0 && step < 5 && isWeekend && (
            <div className="mb-6 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-300">
              <span className="text-amber-600 font-bold">📅 Weekend Submission Notice:</span>
              <span>Commissions submitted Friday to Sunday are processed starting the following week.</span>
            </div>
          )}

          {/*Step 1*/}
          <div className="min-h-[300px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Details</h3>

                <Input label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Juan dela Cruz" required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={v => setForm({ ...form, email: v })}
                    placeholder="name@dlsu.edu.ph"
                    required
                    error={emailError}
                  />
                  <Input
                    label="Contact Number"
                    value={form.contactNumber}
                    onChange={v => setForm({ ...form, contactNumber: v.replace(/\D/g, "").slice(0, 11) })}
                    placeholder="09123456789"
                    required
                    error={contactError}
                    maxLength={11}
                    inputMode="numeric"
                    pattern="\d{11}"
                  />
                  <Select
                    label="Client Type"
                    value={form.clientType}
                    onChange={v =>
                      setForm({
                        ...form,
                        clientType: v,
                        isDlsuStudent: v === "DLSU Student",
                        affiliation: "",
                        idNumber: "",
                        program: "",
                        college: "CCS",
                        department: "",
                      })
                    }
                    options={["DLSU Student", "Non-DLSU Student", "Faculty", "Outsider"]}
                    required
                    error={clientTypeError}
                  />
                </div>

                {form.clientType === "DLSU Student" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <Input
                      label="ID Number"
                      value={form.idNumber}
                      onChange={v => setForm({ ...form, idNumber: v.replace(/\D/g, "").slice(0, 8) })}
                      placeholder="e.g. 12012345"
                      required
                      error={idError}
                      maxLength={8}
                      inputMode="numeric"
                      pattern="\d{8}"
                    />
                    <Input label="Program" value={form.program} onChange={v => setForm({ ...form, program: v })} placeholder="e.g. BSCS-ST" required />
                    <Select label="College" value={form.college} onChange={v => setForm({ ...form, college: v })} options={["CCS", "GCOE", "CLA", "COS", "RVRCOB", "BAGCED", "SOE"]} required />
                  </div>
                )}

                {form.clientType === "Non-DLSU Student" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <Input label="Program" value={form.program} onChange={v => setForm({ ...form, program: v })} placeholder="e.g. BSCS-ST" required />
                    <Input
                      label="University"
                      value={form.affiliation}
                      onChange={v => setForm({ ...form, affiliation: v })}
                      placeholder="e.g. Ateneo de Manila University"
                      required
                    />
                  </div>
                )}

                {form.clientType === "Faculty" && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
                    <Input label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} placeholder="e.g. Software Technology" required />
                  </div>
                )}

                {form.clientType === "Outsider" && (
                  <div className="animate-in fade-in duration-200">
                    <Input
                      label="Affiliation"
                      value={form.affiliation}
                      onChange={v => setForm({ ...form, affiliation: v })}
                      placeholder="e.g. Company / School / Organization"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/*Step 2*/}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Service Selection</h3>
                  <p className="text-gray-500 text-xs">Select a service to request a commission from the FabLab.</p>
                </div>

                {/* Main Active Category */}
                <div className="border border-violet-100 bg-violet-50/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-violet-600 text-white rounded-md">Active</span>
                    <h4 className="font-bold text-gray-900 text-sm">FDM 3D Printing Sub-Services</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "3D Printing With File",
                        name: "3D Printing With File",
                        desc: "Print using your own STL/OBJ design files.",
                        image: "https://images.unsplash.com/photo-1615840287214-7fe58a8f668f?w=600&auto=format&fit=crop"
                      },
                      {
                        id: "3D Printing Without File (Modelling Needed)",
                        name: "3D Printing Without File",
                        desc: "Have an idea but no 3D model? We'll model and print it.",
                        image: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=600&auto=format&fit=crop"
                      },
                      {
                        id: "Modelling Only",
                        name: "Modelling Only",
                        desc: "Need a 3D digital CAD model without physical fabrication.",
                        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop"
                      },
                      {
                        id: "Customized Keychains",
                        name: "Customized Keychains",
                        desc: "Personalized keychains customized with name/logo.",
                        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop"
                      },
                      {
                        id: "NFC Keychains",
                        name: "NFC Keychains",
                        desc: "Smart keychains with embedded programmable NFC tags.",
                        image: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=600&auto=format&fit=crop"
                      }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setForm({ ...form, service: s.id })}
                        className={`group relative overflow-hidden rounded-xl border-2 text-left transition flex flex-col h-[180px] ${form.service === s.id ? "border-violet-600 ring-2 ring-violet-400/20" : "border-gray-200 hover:border-violet-300"}`}
                      >
                        <div className="w-full h-[80px] overflow-hidden relative bg-gray-100">
                          <img
                            src={s.image}
                            alt={s.name}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-2 left-3 flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${form.service === s.id ? "border-violet-400 bg-violet-600" : "border-white bg-white/30"}`}>
                              {form.service === s.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="font-bold text-white text-xs drop-shadow-md">{s.name}</span>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                          <p className="text-gray-500 text-[11px] leading-snug">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coming Soon Category */}
                <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 opacity-60">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-gray-500 text-white rounded-md">Coming Soon</span>
                    <h4 className="font-bold text-gray-700 text-sm">Other Fabrication Services</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: "UV Printing", desc: "Full-color printing on solid objects." },
                      { name: "Laser Cutting", desc: "Precision wood and acrylic engraving." },
                      { name: "Engineering Services", desc: "Advanced electronics and PCB assembly." }
                    ].map((s, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 text-left select-none">
                        <p className="font-semibold text-gray-700 text-xs mb-1">{s.name}</p>
                        <p className="text-gray-400 text-[10px] leading-tight">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Select
                  label="Purpose of Commission"
                  value={form.purpose}
                  onChange={v => setForm({ ...form, purpose: v })}
                  options={["Academic / Thesis", "Personal Project", "Organization Event", "Research", "Others"]}
                />
                {form.purpose === "Others" && (
                  <Input
                    label="Specify Purpose"
                    value={form.purposeOther}
                    onChange={v => setForm({ ...form, purposeOther: v })}
                    placeholder="Type your purpose"
                    required
                    error={purposeOtherError}
                  />
                )}
              </div>
            )}

            {/*Step 3*/}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Commission Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Preferred Color"
                    value={form.color}
                    onChange={v => setForm({ ...form, color: v, selectedColor: "", selectedColors: [], colorOther: "" })}
                    options={["Single Color", "Multi-Color", "Others"]}
                  />
                  <Select
                    label="Filament / Material"
                    value={form.filament}
                    onChange={v => setForm({ ...form, filament: v })}
                    options={["PLA", "ABS", "PETG", "TPU", "ASA", "Not Sure"]}
                  />
                </div>
                {form.color === "Single Color" && (
                  <Select
                    label="Selected Color"
                    value={form.selectedColor}
                    onChange={v => setForm({ ...form, selectedColor: v })}
                    options={colorOptions}
                    required
                    error={colorSelectionError}
                  />
                )}

                {form.color === "Multi-Color" && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm font-medium text-gray-700">Multi-selected Color <span className="text-red-500 ml-0.5">*</span></label>
                      <span className="text-xs text-gray-500">{form.selectedColors.length}/3 selected</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {colorOptions.map(color => {
                        const isSelected = form.selectedColors.includes(color);
                        const isDisabled = !isSelected && form.selectedColors.length >= 3;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setForm({ ...form, selectedColors: form.selectedColors.filter(c => c !== color) });
                              } else if (form.selectedColors.length < 3) {
                                setForm({ ...form, selectedColors: [...form.selectedColors, color] });
                              }
                            }}
                            disabled={isDisabled}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                              isSelected
                                ? "border-violet-600 bg-violet-50 text-violet-700 ring-2 ring-violet-400/20"
                                : isDisabled
                                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50/40"
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                    {colorSelectionError && <p className="text-xs text-red-500 font-medium">{colorSelectionError}</p>}
                    {form.selectedColors.length >= 3 && (
                      <p className="text-xs text-gray-500">Maximum of 3 colors can be selected.</p>
                    )}
                  </div>
                )}

                {form.color === "Others" && (
                  <Input
                    label="Specify Color"
                    value={form.colorOther}
                    onChange={v => setForm({ ...form, colorOther: v })}
                    placeholder="e.g. Gold"
                    required
                    error={colorOtherError}
                  />
                )}
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Expected Pickup Date *</label>
                  <Input
                    type="date"
                    value={form.expectedPickupDate}
                    onChange={v => setForm({ ...form, expectedPickupDate: v })}
                    placeholder=""
                    required
                  />
                  <p className="text-xs text-amber-600/80 italic mt-0.5">
                    “Actual completion and delivery time vary depending on design complexity, print quantity, and project requirements.”
                  </p>
                </div>

                <Select
                  label="Pickup Option"
                  value={form.pickupOption}
                  onChange={v => setForm({ ...form, pickupOption: v })}
                  options={[
                    "JGIC 201 Pickup (Laguna Campus)",
                    "Animo Labs Manila Office (Br. Andrew)",
                    "Courier Service (Coordinate via mobile number)",
                  ]}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Estimated Weight (grams)</label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-500 font-medium">
                      <input
                        type="checkbox"
                        checked={form.isWeightNA}
                        onChange={e => setForm({ ...form, isWeightNA: e.target.checked, weight: e.target.checked ? 0 : 200 })}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
                      />
                      <span>Not sure / N/A</span>
                    </label>
                  </div>
                  {!form.isWeightNA ? (
                    <Input
                      type="number"
                      value={form.weight.toString()}
                      onChange={v => setForm({ ...form, weight: Number(v) })}
                      placeholder="e.g. 200"
                      required
                    />
                  ) : (
                    <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                      N/A (Weight will be estimated by Resident Maker)
                    </div>
                  )}
                </div>
                {form.weight > 1000 && !form.isWeightNA && (
                  <div className="mt-2 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold animate-in fade-in duration-300">
                    🚨 Bulk Order: If your 3D printing needs exceed 1kg (1000g), please email Domie James Jucutan directly at domie.jucutan@dlsu.edu.ph.
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Dimensions, infill percentage, specific instructions..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>

                <div className="space-y-1">
                  <Input
                    label="Google Drive Link (file upload link)"
                    value={form.driveLink}
                    onChange={v => setForm({ ...form, driveLink: v })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    required={needsDriveLink}
                    error={driveLinkError}
                  />
                  <p className="text-xs text-gray-500">
                    Please ensure sharing is set to “Anyone with the link can view”.
                  </p>
                </div>
              </div>
            )}

            {/*Step 4*/}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Review Your Request</h3>
                <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-gray-500 text-xs mb-1">Name</p><p className="font-semibold text-gray-900">{form.name || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Client Type</p><p className="font-semibold text-gray-900">{form.clientType || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Contact Number</p><p className="font-semibold text-gray-900">{form.contactNumber || "—"}</p></div>
                    {form.clientType === "Outsider" && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Affiliation</p>
                        <p className="font-semibold text-gray-900">{form.affiliation || "—"}</p>
                      </div>
                    )}
                    {form.clientType === "Non-DLSU Student" && (
                      <>
                        <div><p className="text-gray-500 text-xs mb-1">Program</p><p className="font-semibold text-gray-900">{form.program || "—"}</p></div>
                        <div><p className="text-gray-500 text-xs mb-1">University</p><p className="font-semibold text-gray-900">{form.affiliation || "—"}</p></div>
                      </>
                    )}
                    {form.clientType === "DLSU Student" && (
                      <>
                        <div><p className="text-gray-500 text-xs mb-1">ID Number</p><p className="font-semibold text-gray-900">{form.idNumber || "—"}</p></div>
                        <div><p className="text-gray-500 text-xs mb-1">Program</p><p className="font-semibold text-gray-900">{form.program || "—"} ({form.college})</p></div>
                      </>
                    )}
                    {form.clientType === "Faculty" && (
                      <div><p className="text-gray-500 text-xs mb-1">Department</p><p className="font-semibold text-gray-900">{form.department || "—"}</p></div>
                    )}
                    <div><p className="text-gray-500 text-xs mb-1">Service</p><p className="font-semibold text-gray-900">{form.service || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Purpose</p><p className="font-semibold text-gray-900">{form.purpose === "Others" ? (form.purposeOther || "—") : (form.purpose || "—")}</p></div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Material</p>
                      <p className="font-semibold text-gray-900">
                        {materialColor || form.color} ({form.filament})
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Weight</p>
                      <p className="font-semibold text-gray-900">
                        {form.isWeightNA ? "N/A" : `${form.weight} g`}
                      </p>
                    </div>
                    <div className="col-span-2"><p className="text-gray-500 text-xs mb-1">Google Drive Link</p><p className="font-semibold text-gray-900 break-all">{form.driveLink || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Expected Pickup Date</p><p className="font-semibold text-gray-900">{form.expectedPickupDate || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Pickup Option</p><p className="font-semibold text-gray-900">{form.pickupOption || "—"}</p></div>
                  </div>
                  {form.notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-sm text-gray-900">{form.notes}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100">
                  By submitting this request, you agree to the Animo Labs - DLSU Science Foundation Inc. terms of service and material costs. Your request will be reviewed, and an automated email will be sent to confirm your order.
                </div>
              </div>
            )}

            {/*Step 5 (Confirmation Page)*/}
            {step === 5 && (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Your commission request has been sent to our Resident Makers.
                </p>

                <div className="mb-8 p-5 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100 text-xs text-left space-y-3">
                  <p className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> System Dispatch Notification (Mock Logs)
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] text-blue-950">
                    {mockLogs.map((log, idx) => (
                      <p key={idx} className="flex gap-1.5">
                        <span>➔</span>
                        <span>{log}</span>
                      </p>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-blue-200 space-y-1.5 text-blue-700">
                    <p>📧 Please refer to your registered email for additional details and pricing.</p>
                    <p>📧 Support Email: <strong className="text-blue-950">domie.jucutan@dlsu.edu.ph</strong></p>
                    <p>📞 Contact Number: <strong className="text-blue-950">09209540688</strong></p>
                    <p>🌐 Facebook Page: <a href="https://www.facebook.com/animolabsph" target="_blank" rel="noopener noreferrer" className="text-blue-950 underline font-semibold hover:text-blue-900">facebook.com/animolabsph</a></p>
                  </div>
                </div>

                <button onClick={() => { setStep(0); }} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition">
                  Return to Home
                </button>
              </div>
            )}
          </div>

          {step > 0 && step < 5 && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setStep(s => s - 1)}
                className="text-gray-500 hover:text-gray-900 font-medium px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={step === 1 || isSubmitting}
              >
                Back
              </button>
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!isStepValid()}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      Submitting...
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </>
                  ) : (
                    <>
                      Submit Request <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

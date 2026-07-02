import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Upload, AlertTriangle, Mail } from "lucide-react";
import { HeroSection } from "../../components/client/HeroSection";
import { ServicesSection } from "../../components/client/ServicesSection";
import { WorkshopsSection } from "../../components/client/WorkshopsSection";
import { TestimonialsSection } from "../../components/client/TestimonialsSection";
import { ProgressBar } from "../../components/client/ProgressBar";
import { Input, Select } from "../../components/common";
import { type Commission } from "../../services/sheetsService";

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
    name: "", email: "", clientType: "Student",
    idNumber: "", program: "", college: "CCS", department: "",
    service: "", purpose: "Academic / Thesis",
    color: "Black", filament: "PLA", urgency: "Standard (3-5 days)", notes: "",
    weight: 200
  });
  const [fileName, setFileName] = useState("");
  const [mockLogs, setMockLogs] = useState<string[]>([]);

  // Capacity validation
  const activeCommissions = commissions.filter(c => c.status !== "Completed" && c.status !== "Rejected" && c.status !== "Awaiting Approval");
  const activeCount = activeCommissions.length;
  const isLabFull = activeCount >= 3;

  // Client validation
  const userActiveCount = commissions.filter(
    c => c.clientEmail?.toLowerCase() === form.email.trim().toLowerCase() && 
         c.status !== "Completed" && 
         c.status !== "Rejected"
  ).length;
  const isUserLimitReached = userActiveCount >= 3;

  // Weekend disclaimer check: Friday (5), Saturday (6), Sunday (0)
  const isWeekend = [0, 5, 6].includes(new Date().getDay());

  // Form validation regex patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const idRegex = /^\d{8}$/;

  const emailError = form.email.trim() && !emailRegex.test(form.email.trim())
    ? "Please enter a valid email address."
    : "";

  const idError = form.clientType === "Student" && form.idNumber.trim() && !idRegex.test(form.idNumber.trim())
    ? "ID number must be exactly 8 digits."
    : "";

  // Step validation check
  const isStepValid = () => {
    if (step === 1) {
      if (isUserLimitReached) return false;
      if (!form.name.trim() || !form.email.trim()) return false;
      if (emailError) return false;
      if (form.clientType === "Student") {
        if (!form.idNumber.trim() || !form.program.trim()) return false;
        if (idError) return false;
        return true;
      }
      if (form.clientType === "Faculty") {
        return !!form.department.trim();
      }
      return true;
    }
    if (step === 2) {
      return !!form.service;
    }
    if (step === 3) {
      if (form.weight <= 0 || form.weight > 1000) return false;
      if (form.service === "3D Printing W/File" && !fileName) return false;
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const nextIdNum = commissions.length + 1;
      const nextId = `COM-${nextIdNum.toString().padStart(3, "0")}`;

      const newCommission = {
        id: nextId,
        client: form.name,
        clientEmail: form.email,
        clientType: form.clientType,
        idNumber: form.idNumber,
        program: form.program,
        college: form.college,
        department: form.department,
        service: form.service,
        purpose: form.purpose,
        color: form.color,
        filament: form.filament,
        urgency: form.urgency,
        weight: form.weight,
        notes: form.notes,
        file: fileName || "None (Design Needed)",
        submitted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
      };

      await onAdd(newCommission);
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
            <span className={activeCount >= 3 ? "w-2 h-2 rounded-full bg-red-500 animate-pulse" : "w-2 h-2 rounded-full bg-green-500 animate-pulse"} />
            <span>FabLab Capacity: <strong>{activeCount} / 3 Active Commissions</strong> ({activeCount >= 3 ? "FULL" : "AVAILABLE"})</span>
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
            <span className="font-bold text-gray-900 text-lg tracking-tight">FabLab</span>
          </div>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition">Back to Home</button>
        </header>
        <main>
          <HeroSection onStart={() => {
            if (isLabFull) {
              setStep(99); // Route to Full Capacity alert page
            } else {
              setStep(1);
            }
          }} />
          <ServicesSection />
          <WorkshopsSection />
          <TestimonialsSection />
        </main>
        <footer className="bg-gray-900 text-white/50 text-center py-8 text-sm">
          <p>© 2026 Animo Labs FabLab. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Full Capacity View
  if (step === 99) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 light">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">FabLab is Full</h3>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            Sorry! The FabLab is currently at full capacity handling the maximum of 3 concurrent active commissions. 
            New submissions are temporarily paused.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 text-left mb-6 space-y-1">
            <p className="font-bold text-gray-700">How to proceed?</p>
            <p>1. Try again later once current commissions are completed.</p>
            <p>2. For bulk/partner requests, contact <strong className="text-gray-700">Domie James Jucutan</strong> at <a href="mailto:hello@animolabs.ph" className="text-violet-600 underline">hello@animolabs.ph</a>.</p>
          </div>
          <button 
            onClick={() => setStep(0)} 
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition"
          >
            Return to Home
          </button>
        </div>
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
                
                {isUserLimitReached && (
                  <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-300">
                    <p className="font-bold text-red-900 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Maximum Commissions Reached
                    </p>
                    <p>
                      You currently have {userActiveCount} active commissions in progress. 
                      The FabLab restricts clients to a maximum of 3 concurrent active commissions. 
                      Please message <strong>Domie James Jucutan</strong> or email <a href="mailto:hello@animolabs.ph" className="underline font-bold text-red-950">hello@animolabs.ph</a> to manage your active slots.
                    </p>
                  </div>
                )}

                <Input label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Juan dela Cruz" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Email Address" 
                    type="email" 
                    value={form.email} 
                    onChange={v => setForm({ ...form, email: v })} 
                    placeholder="name@dlsu.edu.ph" 
                    required 
                    error={emailError} 
                  />
                  <Select label="Client Type" value={form.clientType} onChange={v => setForm({ ...form, clientType: v })} options={["Student", "Faculty", "Outsider"]} />
                </div>
                
                {form.clientType === "Student" && (
                  <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-200">
                    <Input 
                      label="ID Number" 
                      value={form.idNumber} 
                      onChange={v => setForm({ ...form, idNumber: v })} 
                      placeholder="e.g. 12012345" 
                      required 
                      error={idError} 
                    />
                    <Input label="Program" value={form.program} onChange={v => setForm({ ...form, program: v })} placeholder="e.g. BSCS-ST" required />
                    <Select label="College" value={form.college} onChange={v => setForm({ ...form, college: v })} options={["CCS", "GCOE", "CLA", "COS", "RVRCOB", "BAGCED", "SOE"]} />
                  </div>
                )}
                
                {form.clientType === "Faculty" && (
                  <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
                    <Input label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} placeholder="e.g. Software Technology" required />
                  </div>
                )}
              </div>
            )}

            {/*Step 2*/}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Service Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {["3D Printing W/File", "3D Printing W/O File (Modelling Needed)", "Modelling Only", "Customized Keychains", "NFC Keychains"].map(s => (
                    <button
                      key={s}
                      onClick={() => setForm({ ...form, service: s })}
                      className={`p-4 rounded-xl border-2 text-left transition ${form.service === s ? "border-violet-600 bg-violet-50" : "border-gray-100 hover:border-violet-200"}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mb-2 ${form.service === s ? "border-violet-600 bg-violet-600" : "border-gray-300"}`} />
                      <p className="font-semibold text-gray-900 text-sm">{s}</p>
                    </button>
                  ))}
                </div>
                <Select label="Purpose of Commission" value={form.purpose} onChange={v => setForm({ ...form, purpose: v })} options={["Academic / Thesis", "Personal Project", "Organization Event", "Research"]} />
              </div>
            )}

            {/*Step 3*/}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Commission Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Preferred Color" value={form.color} onChange={v => setForm({ ...form, color: v })} options={["Black", "White", "Gray", "Red", "Blue", "Green", "Custom"]} />
                  <Select label="Filament / Material" value={form.filament} onChange={v => setForm({ ...form, filament: v })} options={["PLA", "ABS", "PETG", "TPU", "Not Sure"]} />
                </div>
                <Select label="Urgency" value={form.urgency} onChange={v => setForm({ ...form, urgency: v })} options={["Standard (3-5 days)", "Rush (1-2 days)", "No rush"]} />
                
                <Input 
                  label="Estimated Weight (grams)"
                  type="number"
                  value={form.weight.toString()}
                  onChange={v => setForm({ ...form, weight: Number(v) })}
                  placeholder="e.g. 200"
                  required
                />
                {form.weight > 1000 && (
                  <div className="mt-2 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold animate-in fade-in duration-300">
                    🚨 Bulk Order: If your 3D printing needs exceed 1kg (1000g), please email Domie James Jucutan directly at hello@animolabs.ph or domie.jucutan@dlsu.edu.ph.
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Dimensions, infill percentage, specific instructions..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>

                <div 
                  onClick={() => {
                    const mockFiles = ["robotic_chassis.stl", "gears_v3.stl", "phone_stand_model.obj", "fablab_keychain.stl"];
                    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
                    setFileName(randomFile);
                  }}
                  className="mt-4 p-5 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-violet-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    {fileName ? `Uploaded: ${fileName}` : "Upload STL/OBJ files"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {fileName ? "Click to upload a different mock file" : "Click to select a simulated mock file"}
                  </p>
                  {form.service === "3D Printing W/File" && !fileName && (
                    <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                      * Uploading a file is required for this service.
                    </p>
                  )}
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
                    {form.clientType === "Student" && (
                      <>
                        <div><p className="text-gray-500 text-xs mb-1">ID Number</p><p className="font-semibold text-gray-900">{form.idNumber || "—"}</p></div>
                        <div><p className="text-gray-500 text-xs mb-1">Program</p><p className="font-semibold text-gray-900">{form.program || "—"} ({form.college})</p></div>
                      </>
                    )}
                    {form.clientType === "Faculty" && (
                      <div><p className="text-gray-500 text-xs mb-1">Department</p><p className="font-semibold text-gray-900">{form.department || "—"}</p></div>
                    )}
                    <div><p className="text-gray-500 text-xs mb-1">Service</p><p className="font-semibold text-gray-900">{form.service || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Purpose</p><p className="font-semibold text-gray-900">{form.purpose || "—"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Material</p><p className="font-semibold text-gray-900">{form.color} {form.filament}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Weight</p><p className="font-semibold text-gray-900">{form.weight} g</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Uploaded File</p><p className="font-semibold text-gray-900">{fileName || "None (Design Needed)"}</p></div>
                    <div><p className="text-gray-500 text-xs mb-1">Urgency</p><p className="font-semibold text-gray-900">{form.urgency || "—"}</p></div>
                  </div>
                  {form.notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-gray-500 text-xs mb-1">Notes</p>
                      <p className="text-sm text-gray-900">{form.notes}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100">
                  By submitting this request, you agree to the Animo Labs FabLab terms of service and material costs. An RM will review your file and email you a quote.
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
                  <div className="pt-2 border-t border-blue-200 space-y-1 text-blue-700">
                    <p>📧 Please refer to your registered email for additional details and pricing.</p>
                    <p>📧 Contact <strong className="text-blue-950">domie.jucutan@dlsu.edu.ph</strong> or <strong className="text-blue-950">hello@animolabs.ph</strong> for additional concerns.</p>
                  </div>
                </div>
                
                <button onClick={() => { setStep(0); setFileName(""); }} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition">
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

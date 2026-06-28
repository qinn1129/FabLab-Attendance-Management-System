import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Upload } from "lucide-react";
import { HeroSection } from "../../components/client/HeroSection";
import { ServicesSection } from "../../components/client/ServicesSection";
import { WorkshopsSection } from "../../components/client/WorkshopsSection";
import { TestimonialsSection } from "../../components/client/TestimonialsSection";
import { ProgressBar } from "../../components/client/ProgressBar";
import { Input, Select } from "../../components/common";

/**
 * Root component for the Client domain. Handles the landing page and the multi-step commission request form.
 * @param {Object} props
 * @param {Function} props.onBack 
 * @returns {JSX.Element} 
 * this is just for commision request, the rest of the pages for clietn is in the components folders since tehy are mainly static
 */
export function ClientPortal({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", clientType: "",
    idNumber: "", program: "", college: "", department: "",
    service: "", purpose: "",
    color: "", filament: "", urgency: "", notes: ""
  });

  // TODO
  const handleSubmit = () => {
    setStep(5);
  };

  const stepsList = ["Personal Details", "Service Selection", "Commission Details", "Confirmation"];

  if (step === 0) {
    return (
      <div className="min-h-screen bg-white light">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">F</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FabLab</span>
          </div>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition">Back to Home</button>
        </header>
        <main>
          <HeroSection onStart={() => setStep(1)} />
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

          {/*Step 1*/}
          <div className="min-h-[300px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Details</h3>
                <Input label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Juan dela Cruz" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email Address" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="name@dlsu.edu.ph" required />
                  <Select label="Client Type" value={form.clientType} onChange={v => setForm({ ...form, clientType: v })} options={["Student", "Faculty", "Outsider"]} />
                </div>
                
                {form.clientType === "Student" && (
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="ID Number" value={form.idNumber} onChange={v => setForm({ ...form, idNumber: v })} placeholder="e.g. 12012345" required />
                    <Input label="Program" value={form.program} onChange={v => setForm({ ...form, program: v })} placeholder="e.g. BSCS-ST" required />
                    <Select label="College" value={form.college} onChange={v => setForm({ ...form, college: v })} options={["CCS", "GCOE", "CLA", "COS", "RVRCOB", "BAGCED", "SOE"]} />
                  </div>
                )}
                
                {form.clientType === "Faculty" && (
                  <div className="grid grid-cols-1 gap-4">
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
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Dimensions, infill percentage, specific instructions..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>
                <div className="mt-4 p-5 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer">
                  <Upload className="w-6 h-6 text-violet-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">Upload STL/OBJ files</p>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 100MB</p>
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

            {/*Step 5 (Confirmation Page*/}
            {step === 5 && (
              <div className="text-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Your commission request has been sent to our Resident Makers. We will review your file and get back to you via email within 24 hours.</p>
                <button onClick={() => setStep(0)} className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition">
                  Return to Home
                </button>
              </div>
            )}
          </div>

          {step > 0 && step < 5 && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setStep(s => s - 1)} className="text-gray-500 hover:text-gray-900 font-medium px-4 py-2 rounded-lg transition disabled:opacity-0" disabled={step === 1}>
                Back
              </button>
              {step < 4 ? (
                <button onClick={() => setStep(s => s + 1)} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2">
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-green-600/20">
                  Submit Request <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

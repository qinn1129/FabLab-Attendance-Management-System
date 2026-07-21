import React, { useState } from "react";
import { PageHeader, Input, Select, ChangePasswordForm } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { Camera } from "lucide-react";
import { resizeImageToDataUrl, MAX_PROFILE_PICTURE_BYTES } from "../../lib/imageUpload";

export function MakerProfile({
  account,
  onAccountUpdate
}: {
  account: Account;
  onAccountUpdate: (account: Account) => void;
}) {
  const [form, setForm] = useState({
    firstName: account.firstName,
    lastName: account.lastName,
    program: account.program || "",
    year: account.year || "",
    description: account.description || "",
    hobbies: account.hobbies || "",
    motto: account.motto || "",
    profilePicture: account.profilePicture || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file later
      if (!file) return;
      setPhotoError("");
      setUploadingPhoto(true);
      try {
        const dataUrl = await resizeImageToDataUrl(file);
        if (dataUrl.length > MAX_PROFILE_PICTURE_BYTES) {
          setPhotoError("Image is too large even after compression. Try a smaller photo.");
          return;
        }
        const updated = { ...form, profilePicture: dataUrl };
        setForm(updated);
        const result = await accountsService.updateAccount(account.id, { profilePicture: dataUrl });
        if (!result.success) {
          setPhotoError(result.error || "Failed to save photo.");
          return;
        }
        onAccountUpdate({ ...account, profilePicture: dataUrl });
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : "Failed to process image.");
      } finally {
        setUploadingPhoto(false);
      }
    };

   const handleSave = async () => {
     setSaving(true);
     setSaveMsg("");
     const result = await accountsService.updateAccount(account.id, form);
     setSaving(false);
     if (!result.success) {
       setSaveMsg(result.error || "Failed to save.");
       return;
     }
     setSaveMsg("Saved!");
     onAccountUpdate({ ...account, ...form });
  };

  return (
    <div className="p-6">
      <PageHeader title="My Profile" sub="Your RM account and personal information" />
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
           <div className="relative w-16 h-16 flex-shrink-0">
             {form.profilePicture ? (
               <img
                 src={form.profilePicture}
                 alt={`${form.firstName} ${form.lastName}`}
                 className="w-16 h-16 rounded-2xl object-cover border border-border"
               />
             ) : (
               <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                 {form.firstName[0]}{form.lastName[0]}
               </div>
             )}
             <label
               htmlFor="admin-profile-photo"
               className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer hover:bg-muted transition shadow-sm"
               title="Change profile picture"
             >
               <Camera className="w-3 h-3 text-foreground" />
             </label>
             <input
               id="admin-profile-photo"
               type="file"
               accept="image/*"
               onChange={handlePhotoSelect}
               className="hidden"
             />
           </div>
          <div>
            <p className="text-lg font-bold text-card-foreground">{form.firstName} {form.lastName}</p>
            <p className="text-muted-foreground text-sm">{form.program || "No program set"} · {form.year || "—"}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-600 text-xs font-medium">Active Resident Maker</span>
            </div>
          </div>
        </div>

        {uploadingPhoto && <p className="text-muted-foreground text-xs mb-3">Uploading photo...</p>}
        {photoError && <p className="text-red-500 text-xs mb-3">{photoError}</p>}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          </div>
          <Select label="Bachelor's Program" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))} options={["BS Computer Science","BS Computer Engineering","BS Electronics Engineering","BS Mechanical Engineering","BS Industrial Design","BS Information Technology","BS Biology"]} />
          <Select label="Year Level" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} options={["1st Year","2nd Year","3rd Year","4th Year","5th Year"]} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Hobbies</label>
            <input value={form.hobbies} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Motto in Life</label>
            <input value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        {saveMsg && <p className="text-emerald-600 text-sm mt-3">{saveMsg}</p>}
        <button onClick={handleSave} disabled={saving} className="mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl transition">
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <ChangePasswordForm accountId={account.id} />
      </div>
    </div>
  );
}
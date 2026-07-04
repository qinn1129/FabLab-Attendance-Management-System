import React, { useState } from "react";
import { PageHeader, Input, Select, ChangePasswordForm } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";

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
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    await accountsService.updateAccount(account.id, form);
    setSaving(false);
    setSaveMsg("Saved!");
    onAccountUpdate({ ...account, ...form });
  };

  return (
    <div className="p-6">
      <PageHeader title="My Profile" sub="Your RM account and personal information" />
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {form.firstName[0]}{form.lastName[0]}
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
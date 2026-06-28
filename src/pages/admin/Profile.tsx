import React, { useState } from "react";
import { PageHeader, Input } from "../../components/common";

/**
 * Admin Profile view.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminProfile() {
  const [form, setForm] = useState({
    firstName: "Domie James", lastName: "Jucutan",
    desc: "FabLab Coordinator.",
    hobbies: "3D Printing",
    motto: "asdasd",
  });

  // TODO 
  const handleSave = () => {
    
  };

  return (
    <div className="p-6">
      <PageHeader title="Admin Profile" sub="Your account information and bio" />
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
            {form.firstName[0]}{form.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-card-foreground">{form.firstName} {form.lastName}</p>
            <p className="text-muted-foreground text-sm">FabLab Administrator · DLSU</p>
          </div>
        </div>

        {/*Names*/}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          </div>

          {/*Desc*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          {/*Hobbies*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Hobbies</label>
            <textarea value={form.hobbies} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          {/*Motto*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Motto in Life</label>
            <input value={form.motto} onChange={e => setForm(f => ({ ...f, motto: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <button onClick={handleSave} className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition">
          Save Changes
        </button>
        
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { PageHeader, Input, Select } from "../../components/common";

/**
 * Profile view for Resident Makers.
 * Domain: Maker
 * @returns {JSX.Element}
 */
export function MakerProfile() {
  const [form, setForm] = useState({
    firstName: "Juan", lastName: "dela Cruz",
    program: "BS Computer Science", year: "3rd Year",
    desc: "Passionate about 3D printing and rapid prototyping. I love helping fellow Lasallians bring their projects to life at FabLab.",
    hobbies: "3D Printing, Guitar, Badminton, Coding",
    motto: "Fail fast, learn faster.",
  });

  // TODO
  const handleSave = () => { 
  };

  return (
    <div className="p-6">
      <PageHeader title="My Profile" sub="Your RM account and personal information" />
      <div className="bg-card rounded-xl border border-border p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {form.firstName[0]}{form.lastName.split(" ").pop()?.[0] ?? ""}
          </div>
          <div>

            {/*Display of Profile*/}
            <p className="text-lg font-bold text-card-foreground">{form.firstName} {form.lastName}</p>
            <p className="text-muted-foreground text-sm">{form.program} · {form.year}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-600 text-xs font-medium">Active Resident Maker</span>
            </div>
          </div>
        </div>

        {/*Names*/}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} />
          </div>

          {/*Program*/}
          <Select label="Bachelor's Program" value={form.program} onChange={v => setForm(f => ({ ...f, program: v }))} options={["BS Computer Science","BS Computer Engineering","BS Electronics Engineering","BS Mechanical Engineering","BS Industrial Design","BS Information Technology","BS Biology"]} />
          <Select label="Year Level" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} options={["1st Year","2nd Year","3rd Year","4th Year","5th Year"]} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          {/*Hobbies*/}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Hobbies</label>
            <input value={form.hobbies} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-400" />
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

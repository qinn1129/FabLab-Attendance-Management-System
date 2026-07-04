import React, { useState, useEffect } from "react";
import { PageHeader, StatusBadge, Input } from "../../components/common";
import { RESIDENT_MAKERS } from "../../constants/mockData";
import { cn } from "../../lib/utils";
import { accountsService, type Account } from "../../services/accountsService";

/**
 * RM Account Management view for Admins.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminRMAccounts() {
  const [tab, setTab] = useState<"list"|"requests"|"register">("list");
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", program: "", year: "" });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    const data = await accountsService.fetchAccounts();
    setAccounts(data.filter(a => a.role === "ResidentMaker"));
    setLoadingAccounts(false);
  };

  useEffect(() => { loadAccounts(); }, []);

  // hardcoded data
  const [requests] = useState([
    { id: 1, rm: "Carlos Santos", type: "Late Attendance", date: "Jun 23", reason: "Delayed due to traffic and public transport disruption.", status: "Pending" },
    { id: 2, rm: "Ana Reyes", type: "Missed Schedule", date: "Jun 20", reason: "Family emergency.", status: "Approved" },
  ]);

  const handleRegister = async () => {
    setRegError("");
    setRegSuccess("");
    const result = await accountsService.registerRM(regForm);
    if (!result.success) {
      setRegError(result.error || "Registration failed.");
      return;
    }
    setRegSuccess(result.message || "Registered successfully.");
    setRegForm({ firstName: "", lastName: "", email: "", password: "", program: "", year: "" });
    loadAccounts();
  };

  const [actionError, setActionError] = useState("");

  const handleApprove = async (id: string) => {
    setActionError("");
    const result = await accountsService.updateAccount(id, { status: "Active" });
    if (!result.success) {
      setActionError(result.error || "Failed to approve account.");
      return;
    }
    loadAccounts();
  };

  const handleDeactivate = async (id: string) => {
    setActionError("");
    const result = await accountsService.updateAccount(id, { status: "Inactive" });
    if (!result.success) {
      setActionError(result.error || "Failed to deactivate account.");
      return;
    }
    loadAccounts();
  };

  return (
    <div className="p-6">
      <PageHeader title="RM Account Management" sub="Manage Resident Maker accounts and attendance" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["list","requests","register"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            {t === "list" ? "RM List" : t === "requests" ? "Attendance Requests" : "Register New RM"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <>
        {actionError && <p className="text-red-500 text-sm mb-3">{actionError}</p>}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                {["Name","Email","Program","Year","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>

            {/*Displayin of RM Information*/}    
            <tbody>
              {loadingAccounts ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No Resident Makers yet.</td></tr>
              ) : accounts.map(rm => (
                <tr key={rm.id} className="border-b border-muted hover:bg-muted/50 transition">
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{rm.firstName} {rm.lastName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{rm.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{rm.program || "—"}</td>
                  <td className="px-4 py-3 text-center font-mono">{rm.year || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={rm.status} /></td>
                  <td className="px-4 py-3">
                    {rm.status === "Pending" ? (
                      <button onClick={() => handleApprove(rm.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Approve</button>
                    ) : rm.status === "Active" ? (
                      <button onClick={() => handleDeactivate(rm.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Deactivate</button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/*For requests*/}
      {tab === "requests" && (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">{r.rm}</span>
                    <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-medium px-2 py-0.5 rounded">{r.type}</span>
                    <span className="text-muted-foreground text-xs font-mono ml-2">{r.date}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{r.reason}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  <StatusBadge status={r.status} />
                  {r.status === "Pending" && (
                    <>
                      {/* TODO [BACKEND_HOOK]: Connect Approve/Reject handlers to a database update function */}
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">Approve</button>
                      <button className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition">Reject</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/*For register*/}
      {tab === "register" && (
        <div className="bg-card rounded-xl border border-border p-6 max-w-md">
          <h3 className="font-semibold text-foreground mb-4">Register New Resident Maker</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={regForm.firstName} onChange={v => setRegForm(f => ({ ...f, firstName: v }))} placeholder="e.g. Juan" required />
              <Input label="Last Name" value={regForm.lastName} onChange={v => setRegForm(f => ({ ...f, lastName: v }))} placeholder="e.g. dela Cruz" required />
            </div>
            <Input label="Email Address" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} placeholder="name@dlsu.edu.ph" required />
            <Input label="Temporary Password" type="password" value={regForm.password} onChange={v => setRegForm(f => ({ ...f, password: v }))} placeholder="••••••••" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Program" value={regForm.program} onChange={v => setRegForm(f => ({ ...f, program: v }))} placeholder="e.g. BSCS-ST" />
              <Input label="Year Level" value={regForm.year} onChange={v => setRegForm(f => ({ ...f, year: v }))} placeholder="e.g. 3rd Year" />
            </div>
          </div>
          {regError && <p className="text-red-500 text-sm mt-3">{regError}</p>}
          {regSuccess && <p className="text-emerald-600 text-sm mt-3">{regSuccess}</p>}
          <button onClick={handleRegister} disabled={!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
            Create RM Account
          </button>
        </div>
      )}
    </div>
  );
}

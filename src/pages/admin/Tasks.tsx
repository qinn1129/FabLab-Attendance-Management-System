import React, { useState } from "react";
import { useEffect } from "react";
import { PageHeader, Select, StatusBadge } from "../../components/common";
import { accountsService, type Account } from "../../services/accountsService";
import { cn } from "../../lib/utils";

/**
 * Task Assignment view for Admins to delegate tasks.
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminTasks() {
  const [tab, setTab] = useState<"selected" | "all">("selected");
  const [selectedRM, setSelectedRM] = useState("Juan dela Cruz");
  const [makers, setMakers] = useState<Account[]>([]);

  useEffect(() => {
    accountsService.fetchResidentMakers().then(setMakers);
  }, []);

  // hardcoded, feel free to edit the fields here for the db
  const tasks: Record<string, { id: number; task: string; deadline: string; status: string }[]> = {
    "Juan dela Cruz": [
      { id: 1, task: "Complete COM-001 (Black PLA print)", deadline: "Jun 27", status: "In Progress" },
      { id: 2, task: "Quality check COM-003 pickup", deadline: "Jun 25", status: "Pending" },
    ],
    "Ana Reyes": [
      { id: 3, task: "Design file for COM-002", deadline: "Jun 28", status: "In Progress" },
    ],
    "Miguel Bautista": [
      { id: 4, task: "Deliver COM-003 keychain", deadline: "Jun 26", status: "Completed" },
      { id: 5, task: "Prepare material inventory report", deadline: "Jun 30", status: "Pending" },
    ],
    "Carlos Santos": [
      { id: 6, task: "Monitor COM-005 ABS print (12h)", deadline: "Jun 28", status: "In Progress" },
    ],
  };

  const displayData = tab === "selected" ? { [selectedRM]: tasks[selectedRM] ?? [] } : tasks;

  return (
    <div className="p-6">

      {/*This needs to be done automatically*/}
      <PageHeader title="Task Assignment" sub="View and assign tasks to Resident Makers" />
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-5">
        {(["selected", "all"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground")}>
            {t === "selected" ? "Selected RM" : "All RMs"}
          </button>
        ))}
      </div>

      {tab === "selected" && (
        <div className="mb-4">
          <Select label="Select Resident Maker" value={selectedRM} onChange={setSelectedRM} options={makers.filter(r => r.status === "Active").map(r => `${r.firstName} ${r.lastName}`)} />
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(displayData).map(([rmName, rmTasks]) => (
          <div key={rmName} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted border-b border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-500 text-xs font-bold">{rmName.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <span className="font-semibold text-card-foreground text-sm">{rmName}</span>
              <span className="ml-auto text-xs text-muted-foreground font-mono">{rmTasks.length} task{rmTasks.length !== 1 ? "s" : ""}</span>
            </div>

            {/*RM mapping*/}
            {rmTasks.length === 0 ? (
              <p className="px-5 py-4 text-muted-foreground text-sm">No tasks assigned.</p>
            ) : (
              <div className="divide-y divide-muted">
                {rmTasks.map(t => (
                  <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", t.status === "Completed" ? "bg-emerald-400" : t.status === "In Progress" ? "bg-blue-400" : "bg-yellow-400")} />
                    <span className="flex-1 text-sm text-card-foreground">{t.task}</span>
                    <span className="text-xs font-mono text-muted-foreground">{t.deadline}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

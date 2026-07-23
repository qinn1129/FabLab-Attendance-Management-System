import React, { useState, useEffect } from "react";
import { Cpu, MapPin, RefreshCw, CheckCircle2, Clock, User } from "lucide-react";
import { PageHeader } from "../../components/common";
import { sheetsService, type Machine, type MachineReservation } from "../../services/sheetsService";
import { accountsService, type Account } from "../../services/accountsService";
import { cn } from "../../lib/utils";

/**
 * Real-time-ish status monitor for lab machines, derived from the
 * machine_reservations sheet: a machine is "In Use" if `now` falls
 * inside one of its reservation windows, otherwise "Available".
 * Domain: Admin
 * @returns {JSX.Element}
 */
export function AdminMachineStatus() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [reservations, setReservations] = useState<MachineReservation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, r, a] = await Promise.all([
        sheetsService.fetchMachines(),
        sheetsService.fetchReservations(),
        accountsService.fetchAccounts(),
      ]);
      setMachines(m);
      setReservations(r);
      setAccounts(a);
    } catch (err) {
      console.error("Error loading machine status data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const refreshTimer = setInterval(loadData, 30000); // re-sync every 30s
    const clockTimer = setInterval(() => setNow(new Date()), 1000); // live "now" for countdowns
    return () => {
      clearInterval(refreshTimer);
      clearInterval(clockTimer);
    };
  }, []);

  const getMakerName = (rmId: string): string => {
    const found = accounts.find(a => a.id === rmId);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown Maker";
  };

  const getMachineStatus = (machineId: string) => {
    const current = reservations.find(r => {
      if (r.machine_id !== machineId) return false;
      const start = new Date(r.start_time).getTime();
      const end = new Date(r.end_time).getTime();
      return now.getTime() >= start && now.getTime() < end;
    });

    if (!current) return { inUse: false as const };

    const upcomingEnd = new Date(current.end_time);
    return {
      inUse: true as const,
      reservation: current,
      makerName: getMakerName(current.rm_id),
      endsAt: upcomingEnd,
    };
  };

  const inUseCount = machines.filter(m => getMachineStatus(m.id).inUse).length;

  return (
    <div className="p-6">
      <PageHeader
        title="Machine Status Monitor"
        sub={`${machines.length - inUseCount} of ${machines.length} machines available`}
        action={
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-sm font-semibold transition"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
          Loading machine data...
        </div>
      ) : machines.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No machines registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => {
            const status = getMachineStatus(m.id);
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl border p-5 transition",
                  status.inUse
                    ? "border-orange-500/30 bg-orange-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1",
                      status.inUse
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-emerald-500/20 text-emerald-600"
                    )}
                  >
                    {status.inUse ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {status.inUse ? "In Use" : "Available"}
                  </span>
                </div>

                <h3 className="font-bold text-foreground text-sm mb-1">{m["Machine Model"]}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{m["Placement / Location Notes"]}</span>
                </div>

                {status.inUse && (
                  <div className="pt-3 border-t border-border/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <User className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="font-medium">{status.makerName}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Free at {status.endsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
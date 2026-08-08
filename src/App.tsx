import React, { useState, useEffect } from "react";
import { Home } from "./pages/Home";
import { ClientPortal } from "./pages/client/ClientPortal";
import { AdminPortal } from "./pages/admin/AdminPortal";
import { MakerPortal } from "./pages/maker/MakerPortal";
import { sheetsService, type Commission } from "./services/sheetsService";
import { DialogProvider } from "./components/common";
import { invalidateCache } from "./lib/requestCache";

/**
 * Main application entry point that handles top-level routing between the 
 * Landing Page, Client Portal, Admin Portal, and Resident Maker Portal.
 * Integrates backend synchronization for commissions.
 * @returns {JSX.Element}
 */
export default function App() {
  const [flow, setFlow] = useState<string>("home");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCommissionsData = async () => {
    setLoading(true);
    try {
      // Explicitly invalidate the cache first — this function backs the
      // "Refresh" buttons in Approvals/Tracker (via onRefresh below) as
      // well as the initial page load, so it must always get fresh data
      // rather than silently serving whatever's still in the short-lived
      // request cache. On initial mount the cache is empty anyway, so this
      // is a no-op there.
      invalidateCache("commissions");
      const data = await sheetsService.fetchCommissions();
      setCommissions(data);
    } catch (e) {
      console.error("Error loading commissions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissionsData();
  }, []);

  const handleAddCommission = async (newCom: Omit<Commission, "rm" | "printer" | "status" | "deadline" | "problems">) => {
    const added = await sheetsService.addCommission(newCom);
    setCommissions(prev => [...prev, added]);
  };

  const handleUpdateCommission = async (id: string, updates: Partial<Commission>) => {
    // Optimistic UI update
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await sheetsService.updateCommission(id, updates);
  };

  return (
    <DialogProvider>
      <div className="h-screen w-full overflow-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {flow === "home" && <Home setFlow={setFlow} />}
        {flow === "client" && (
          <ClientPortal 
            onBack={() => setFlow("home")} 
            commissions={commissions} 
            onAdd={handleAddCommission} 
            isLoading={loading} 
          />
        )}
        {flow === "admin" && (
          <AdminPortal 
            onBack={() => setFlow("home")} 
            commissions={commissions} 
            onUpdate={handleUpdateCommission} 
            onRefresh={fetchCommissionsData}
            isLoading={loading} 
          />
        )}
        {flow === "rm" && (
          <MakerPortal 
            onBack={() => setFlow("home")} 
            commissions={commissions} 
            onUpdate={handleUpdateCommission} 
            isLoading={loading} 
          />
        )}
      </div>
    </DialogProvider>
  );
}
import React, { useState } from "react";
import { Settings } from "lucide-react";
import { Input } from "../../components/common";
import { AdminLayout } from "../../layouts/AdminLayout";
import { AdminDashboard } from "./Dashboard";
import { AdminRMSchedules } from "./RMSchedules";
import { AdminApprovals } from "./Approvals";
import { AdminTracker } from "./Tracker";
import { AdminTasks } from "./Tasks";
import { AdminAnnouncements } from "./Announcements";
import { AdminModules } from "./Modules";
import { AdminRMAccounts } from "./RMAccounts";
import { AdminProfile } from "./Profile";
import { AdminFAQ } from "./FAQ";
import { type Commission } from "../../services/sheetsService";

/**
 * Root component for the Admin domain. Handles authentication state and rendering the active screen.
 * @param {Object} props
 * @param {Function} props.onBack
 * @returns {JSX.Element}
 */
export function AdminPortal({ 
  onBack, 
  commissions, 
  onUpdate, 
  isLoading 
}: { 
  onBack: () => void; 
  commissions: Commission[]; 
  onUpdate: (id: string, updates: Partial<Commission>) => Promise<void>; 
  isLoading: boolean; 
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  // TODO
  const handleLogin = () => {
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#052e16_0%,_#064e3b_60%,_#0f172a_100%)]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-gray-400 text-sm mt-1">DLSU FabLab Management System</p>
          </div>
          <div className="space-y-3 mb-5">
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="admin@dlsu.edu.ph" />
            <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
          </div>
          <button onClick={handleLogin} disabled={!email || !pass} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
            Sign In
          </button>
          <button onClick={onBack} className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm transition text-center">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case "dashboard": return <AdminDashboard commissions={commissions} />;
      case "rm-schedules": return <AdminRMSchedules />;
      case "approvals": return <AdminApprovals commissions={commissions} onUpdate={onUpdate} />;
      case "tracker": return <AdminTracker commissions={commissions} onUpdate={onUpdate} />;
      case "tasks": return <AdminTasks />;
      case "announcements": return <AdminAnnouncements />;
      case "modules": return <AdminModules />;
      case "rm-accounts": return <AdminRMAccounts />;
      case "profile": return <AdminProfile />;
      case "faq": return <AdminFAQ />;
      default: return <AdminDashboard commissions={commissions} />;
    }
  };

  return (
    <AdminLayout currentScreen={screen} setScreen={setScreen} onLogout={() => setLoggedIn(false)}>
      {renderScreen()}
    </AdminLayout>
  );
}

import React, { useState, useEffect } from "react";
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
import { accountsService, type Account } from "../../services/accountsService";
import { rememberMe } from "../../lib/rememberMe";
import { type Commission } from "../../services/sheetsService";
import { AdminServices } from "./Services";
import { AdminWorkshops } from "./Workshops";
import { AdminTestimonials } from "./Testimonials";


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
  const [account, setAccount] = useState<Account | null>(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Attempt silent auto-login from a remembered session on mount.
  useEffect(() => {
    (async () => {
      const remembered = rememberMe.get("Admin");
      if (!remembered) {
        setCheckingSession(false);
        return;
      }
      const found = await accountsService.getAccountById(remembered.id);
      if (found && found.role === "Admin" && found.status === "Active") {
        setAccount(found);
        setLoggedIn(true);
      } else {
        rememberMe.clear("Admin"); // stale/deactivated — force a real login
      }
      setCheckingSession(false);
    })();
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    setIsLoggingIn(true);
    const result = await accountsService.login(email, pass);
    setIsLoggingIn(false);

    if (!result.success || !result.user) {
      setLoginError(result.error || "Login failed.");
      return;
    }
    if (result.user.role !== "Admin") {
      setLoginError("This account is not an Admin account.");
      return;
    }

    if (remember) {
      rememberMe.save("Admin", result.user.id);
    }
    setAccount(result.user);
    setLoggedIn(true);
  };

   const handleLogout = () => {
    rememberMe.clear("Admin");
     setLoggedIn(false);
     setAccount(null);
     setEmail("");
     setPass("");
     setRemember(false);
   };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#052e16_0%,_#064e3b_60%,_#0f172a_100%)]">
        <p className="text-white/50 text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#052e16_0%,_#064e3b_60%,_#0f172a_100%)]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Portal</h2>
            <p className="text-gray-400 text-sm mt-1">Animo Labs FabLab Management System</p>
          </div>
          <div className="space-y-3 mb-5">
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="admin@animolabs.ph" />
            <Input label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          {loginError && <p className="text-red-500 text-sm mb-3">{loginError}</p>}
          <button onClick={handleLogin} disabled={!email || !pass || isLoggingIn} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition">
            {isLoggingIn ? "Signing In..." : "Sign In"}
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
      case "testimonials": return <AdminTestimonials />;
      case "announcements": return <AdminAnnouncements />;
      case "modules": return <AdminModules />;
      case "rm-accounts": return <AdminRMAccounts />;
      case "profile": return <AdminProfile account={account!} onAccountUpdate={setAccount} />;
      case "faq": return <AdminFAQ />;
      case "services": return <AdminServices />;
      case "workshops": return <AdminWorkshops />;
      default: return <AdminDashboard commissions={commissions} />;
    }
  };

  return (
    <AdminLayout
      currentScreen={screen}
      setScreen={setScreen}
      onLogout={handleLogout}
      adminName={`${account!.firstName} ${account!.lastName}`}
    >
      {renderScreen()}
    </AdminLayout>
  );
}
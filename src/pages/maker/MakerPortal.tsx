import React, { useState, useEffect } from "react";
import { Users, ArrowLeft } from "lucide-react";
import { Input } from "../../components/common";
import { MakerLayout } from "../../layouts/MakerLayout";
import { MakerDashboard } from "./Dashboard";
import { MakerAttendance } from "./Attendance";
import { MakerCommissions } from "./Commissions";
import { MakerResources } from "./Resources";
import { MakerProfile } from "./Profile";
import { accountsService, type Account } from "../../services/accountsService";
import { rememberMe } from "../../lib/rememberMe";
import { type Commission } from "../../services/sheetsService";

export function MakerPortal({
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
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [loggedIn, setLoggedIn] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [account, setAccount] = useState<Account | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", program: "", year: "" });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    (async () => {
      const remembered = rememberMe.get("ResidentMaker");
      if (!remembered) {
        setCheckingSession(false);
        return;
      }
      const found = await accountsService.getAccountById(remembered.id);
      if (found && found.role === "ResidentMaker" && found.status === "Active") {
        setAccount(found);
        setLoggedIn(true);
      } else {
        rememberMe.clear("ResidentMaker");
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
    if (result.user.role !== "ResidentMaker") {
      setLoginError("This account is not a Resident Maker account.");
      return;
    }
    if (remember) {
      rememberMe.save("ResidentMaker", result.user.id);
    }
    setAccount(result.user);
    setLoggedIn(true);
  };

  const handleRegister = async () => {
    setRegError("");
    setRegSuccess("");

    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password) {
      setRegError("Please fill in all required fields.");
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    if (regForm.password.length < 8) {
      setRegError("Password must be at least 8 characters.");
      return;
    }

    setIsRegistering(true);
    const result = await accountsService.registerRM({
      firstName: regForm.firstName,
      lastName: regForm.lastName,
      email: regForm.email,
      password: regForm.password,
      program: regForm.program,
      year: regForm.year
    });
    setIsRegistering(false);

    if (!result.success) {
      setRegError(result.error || "Registration failed.");
      return;
    }
    setRegSuccess(result.message || "Registered! An Admin will review your account shortly.");
    setRegForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", program: "", year: "" });
  };

   const handleLogout = () => {
     rememberMe.clear("ResidentMaker");
     setLoggedIn(false);
     setAccount(null);
     setEmail("");
     setPass("");
     setRemember(false);
   };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#064e3b_0%,_#065f46_60%,_#0f172a_100%)]">
        <p className="text-white/50 text-sm font-mono">Loading...</p>
      </div>
    );
  }

  if (!loggedIn) {
    if (authView === "register") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#064e3b_0%,_#065f46_60%,_#0f172a_100%)] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <button onClick={() => { setAuthView("login"); setRegError(""); setRegSuccess(""); }} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mb-4 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Register as Resident Maker</h2>
              <p className="text-gray-400 text-sm mt-1">Your account needs Admin approval before you can log in.</p>
            </div>

            {regSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm text-center">
                {regSuccess}
                <button onClick={() => setAuthView("login")} className="block w-full mt-3 text-emerald-700 font-semibold underline">
                  Return to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5 text-gray-900 [&_label]:text-gray-900">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" value={regForm.firstName} onChange={v => setRegForm(f => ({ ...f, firstName: v }))} placeholder="Juan" required />
                    <Input label="Last Name" value={regForm.lastName} onChange={v => setRegForm(f => ({ ...f, lastName: v }))} placeholder="dela Cruz" required />
                  </div>
                  <Input label="Email Address" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} placeholder="name@dlsu.edu.ph" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Program" value={regForm.program} onChange={v => setRegForm(f => ({ ...f, program: v }))} placeholder="e.g. BS CS" />
                    <Input label="Year Level" value={regForm.year} onChange={v => setRegForm(f => ({ ...f, year: v }))} placeholder="e.g. 3rd Year" />
                  </div>
                  <Input label="Password" type="password" value={regForm.password} onChange={v => setRegForm(f => ({ ...f, password: v }))} placeholder="At least 8 characters" required />
                  <Input label="Confirm Password" type="password" value={regForm.confirmPassword} onChange={v => setRegForm(f => ({ ...f, confirmPassword: v }))} placeholder="••••••••" required />
                </div>
                {regError && <p className="text-red-500 text-sm mb-3">{regError}</p>}
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition"
                >
                  {isRegistering ? "Submitting..." : "Create Account"}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,_#064e3b_0%,_#065f46_60%,_#0f172a_100%)]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Resident Maker Portal</h2>
            <p className="text-gray-400 text-sm mt-1">Animo Labs FabLab — RM Dashboard</p>
          </div>
          <div className="space-y-3 mb-5 text-gray-900 [&_label]:text-gray-900">
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@dlsu.edu.ph" />
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
          <button onClick={() => { setAuthView("register"); setLoginError(""); }} className="w-full mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition text-center">
            New here? Register as a Resident Maker
          </button>
          <button onClick={onBack} className="w-full mt-2 text-gray-400 hover:text-gray-600 text-sm transition text-center">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    const makerName = `${account!.firstName} ${account!.lastName}`;
    switch (screen) {
      case "dashboard": return <MakerDashboard commissions={commissions} account={account!} />;
      case "attendance": return <MakerAttendance account={account!} onAccountUpdate={setAccount} />;
      case "commissions": return <MakerCommissions commissions={commissions} onUpdate={onUpdate} makerName={makerName} />;
      case "resources": return <MakerResources />;
      case "profile": return <MakerProfile account={account!} onAccountUpdate={setAccount} />;
      default: return <MakerDashboard commissions={commissions} account={account!} />;
    }
  };

  return (
    <MakerLayout currentScreen={screen} setScreen={setScreen} onLogout={handleLogout} makerName={`${account!.firstName} ${account!.lastName}`}>
      {renderScreen()}
    </MakerLayout>
  );
}
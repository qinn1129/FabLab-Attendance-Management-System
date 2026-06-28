import React, { useState } from "react";
import { Home } from "./pages/Home";
import { ClientPortal } from "./pages/client/ClientPortal";
import { AdminPortal } from "./pages/admin/AdminPortal";
import { MakerPortal } from "./pages/maker/MakerPortal";

/**
 * Main application entry point that handles top-level routing between the 
 * Landing Page, Client Portal, Admin Portal, and Resident Maker Portal.
 * Take note that this is only tentative, will only be using the home page just for testing purposes only. 
 * I will leave the backend to do the proper routing here hehe. 
 * @returns {JSX.Element}
 */
export default function App() {
  const [flow, setFlow] = useState<string>("home");

  return (
    <div className="h-screen w-full overflow-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {flow === "home" && <Home setFlow={setFlow} />}
      {flow === "client" && <ClientPortal onBack={() => setFlow("home")} />}
      {flow === "admin" && <AdminPortal onBack={() => setFlow("home")} />}
      {flow === "rm" && <MakerPortal onBack={() => setFlow("home")} />}
    </div>
  );
}

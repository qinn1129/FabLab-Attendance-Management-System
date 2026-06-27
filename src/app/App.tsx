import { useState } from "react";
import HomeScreen from "./HomeScreen";
import ClientFlow from "./ClientFlow";
import AdminFlow from "./AdminFlow";
import RMFlow from "./RMFlow";

export default function App() {
  const [flow, setFlow] = useState<string>("home");

  return (
    <div className="h-screen w-full overflow-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {flow === "home" && <HomeScreen setFlow={setFlow} />}
      {flow === "client" && <ClientFlow onBack={() => setFlow("home")} />}
      {flow === "admin" && <AdminFlow onBack={() => setFlow("home")} />}
      {flow === "rm" && <RMFlow onBack={() => setFlow("home")} />}
    </div>
  );
}

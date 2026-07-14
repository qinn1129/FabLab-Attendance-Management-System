import React, { useState } from "react";
import { ChevronRight, LogOut, Clock, User, Package, Book, Home, Calendar } from "lucide-react";
import { ChatWidget } from "../components/common/ChatWidget";
import { ThemeToggle } from "../components/common";
import { cn } from "../lib/utils";

/**
 * Navigation structure for the Resident Maker Portal.
 */
export const RM_NAV = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "reservations", label: "Reservations", icon: Calendar },
  { id: "commissions", label: "My Commissions", icon: Package },
  { id: "resources", label: "Resources", icon: Book },
  { id: "profile", label: "Profile", icon: User },
];

/**
 * Props for the MakerLayout component.
 */
interface MakerLayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  setScreen: (screen: string) => void;
  onLogout: () => void;
  makerName: string;
}

/**
 * Layout wrapper for the Resident Maker portal. Includes the collapsible sidebar and chat widget.
 * @param {MakerLayoutProps} props
 * @returns {JSX.Element}
 */
export function MakerLayout({ children, currentScreen, setScreen, onLogout, makerName }: MakerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <aside className={cn("flex-shrink-0 flex flex-col transition-all duration-200 bg-sidebar border-r border-sidebar-border", sidebarOpen ? "w-52" : "w-14")}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-sm font-bold truncate">{makerName}</p>
              <p className="text-sidebar-primary text-xs font-mono">Resident Maker</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition p-1">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {RM_NAV.map(n => {
            const Icon = n.icon;
            const active = currentScreen === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                title={!sidebarOpen ? n.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all",
                  active ? "bg-sidebar-accent/50 text-sidebar-primary border-r-2 border-sidebar-primary" : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{n.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 flex flex-col gap-3">
          <ThemeToggle isSidebarOpen={sidebarOpen} />
          <button onClick={onLogout} className={cn("w-full flex items-center gap-2.5 text-sidebar-foreground/40 hover:text-red-400 transition text-sm py-1.5", !sidebarOpen && "justify-center")}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <ChatWidget accentColor="emerald" senderName={makerName} senderRole="ResidentMaker" />
    </div>
  );
}
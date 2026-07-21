import React, { useState } from "react";
import { Boxes, Presentation } from "lucide-react";
import { ChevronRight, LogOut, BarChart2, Calendar, CheckCircle, Package, Layers, Bell, Book, Users, User, HelpCircle, MessageSquareQuote } from "lucide-react";
import { ChatWidget } from "../components/common/ChatWidget";
import { ThemeToggle } from "../components/common";
import { cn } from "../lib/utils";

/**
 * Navigation structure for the Admin Portal.
 */
export const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "rm-schedules", label: "RM Schedules", icon: Calendar },
  { id: "approvals", label: "Commission Approval", icon: CheckCircle },
  { id: "tracker", label: "Commission Tracker", icon: Package },
  { id: "services", label: "Service Offerings", icon: Boxes },
  { id: "workshops", label: "Workshops", icon: Presentation },
  { id: "tasks", label: "Task Assignment", icon: Layers },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { id: "announcements", label: "Announcements & Chat", icon: Bell },
  { id: "modules", label: "Modules", icon: Book },
  { id: "rm-accounts", label: "RM Accounts", icon: Users },
  { id: "profile", label: "Admin Profile", icon: User },
  { id: "faq", label: "FAQ Management", icon: HelpCircle },
];

/**
 * Props for the AdminLayout component.
 */
interface AdminLayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  setScreen: (screen: string) => void;
  onLogout: () => void;
  adminName: string;
}

/**
 * Layout wrapper for the Admin portal. Includes the collapsible sidebar and chat widget.
 * @param {AdminLayoutProps} props
 * @returns {JSX.Element}
 */
export function AdminLayout({ children, currentScreen, setScreen, onLogout, adminName }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <aside className={cn("flex-shrink-0 flex flex-col transition-all duration-200 bg-sidebar border-r border-sidebar-border", sidebarOpen ? "w-56" : "w-14")}>
        <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-sm font-bold truncate">DLSU FabLab</p>
              <p className="text-sidebar-primary text-xs font-mono">Admin</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition p-1">
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(n => {
            const Icon = n.icon;
            const active = currentScreen === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                title={!sidebarOpen ? n.label : undefined}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all rounded-none",
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

      <ChatWidget accentColor="emerald" senderName={adminName} senderRole="Admin" />
    </div>
  );
}
import React, { useState } from "react";
import { Boxes, CpuIcon, Presentation } from "lucide-react";
import { ChevronRight, LogOut, BarChart2, Calendar, CheckCircle, Package, Layers, Bell, Book, Users, User, HelpCircle, MessageSquareQuote } from "lucide-react";
import { ChatWidget } from "../components/common/ChatWidget";
import { ThemeToggle } from "../components/common";
import { cn } from "../lib/utils";

/**
 * Navigation structure for the Admin Portal.
 * The `category` field controls which section header each item is
 * grouped under in the sidebar. Order matters: sections render in the
 * order their first item appears in this array.
 */
export const ADMIN_NAV = [
// Overview
  { id: "dashboard", label: "Dashboard", icon: BarChart2, category: "Overview" },

  // Commissions
  { id: "machines", label: "Machine Status", icon: CpuIcon, category: "Commissions" },
  { id: "approvals", label: "Commission Approval", icon: CheckCircle, category: "Commissions" },
  { id: "tracker", label: "Commission Tracker", icon: Package, category: "Commissions" },

  // Client Page
  { id: "services", label: "Service Offerings", icon: Boxes, category: "Client Page" },
  { id: "workshops", label: "Workshops", icon: Presentation, category: "Client Page" },
  { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote, category: "Client Page" },

  // Resident Makers and Profile
  { id: "rm-accounts", label: "RM Accounts", icon: Users, category: "Resident Makers and Profile" },
  { id: "tasks", label: "Manual Tasks", icon: Layers, category: "Resident Makers and Profile" },
  { id: "announcements", label: "Announcements", icon: Bell, category: "Resident Makers and Profile" },
  { id: "modules", label: "Modules", icon: Book, category: "Resident Makers and Profile" },
  { id: "faq", label: "FAQ Management", icon: HelpCircle, category: "Resident Makers and Profile" },
  { id: "profile", label: "Profile", icon: User, category: "Resident Makers and Profile" },
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
 * The sidebar nav is segmented into labelled category groups (Overview,
 * Commissions, Client Page, Resident Makers and Profile) so related pages
 * are visually clustered together, matching the requested nav mockup.
 * @param {AdminLayoutProps} props
 * @returns {JSX.Element}
 */
export function AdminLayout({ children, currentScreen, setScreen, onLogout, adminName }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Group nav items by category, preserving the order categories first
  // appear in ADMIN_NAV so the sidebar renders sections top-to-bottom
  // exactly as declared above.
  const categoryOrder: string[] = [];
  const groupedNav: Record<string, typeof ADMIN_NAV> = {};
  ADMIN_NAV.forEach(item => {
    if (!groupedNav[item.category]) {
      groupedNav[item.category] = [];
      categoryOrder.push(item.category);
    }
    groupedNav[item.category].push(item);
  });

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
        <nav className="flex-1 py-3 overflow-y-auto">
          {categoryOrder.map((category, catIdx) => (
            <div key={category} className={cn(catIdx > 0 && "mt-4")}>
              {sidebarOpen ? (
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 truncate">
                  {category}
                </p>
              ) : (
                catIdx > 0 && <div className="mx-3 mb-1.5 border-t border-sidebar-border/60" />
              )}
              <div className="space-y-0.5">
                {groupedNav[category].map(n => {
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
              </div>
            </div>
          ))}
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
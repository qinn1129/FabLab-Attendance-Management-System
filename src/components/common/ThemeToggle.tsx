import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../../lib/utils";

export function ThemeToggle({ className, isSidebarOpen = true }: { className?: string, isSidebarOpen?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-12 w-full animate-pulse bg-sidebar-accent/50 rounded-lg", className)} />;
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {isSidebarOpen && <span className="text-[10px] font-semibold text-sidebar-foreground/50 px-2 uppercase tracking-wider mb-1">Theme</span>}
      <div className={cn("flex", isSidebarOpen ? "bg-sidebar-accent/50 p-1 rounded-lg" : "flex-col gap-1 items-center")}>
        <button
          onClick={() => setTheme("light")}
          title="Light Mode"
          className={cn(
            "p-1.5 flex-1 flex justify-center items-center rounded-md transition",
            theme === "light" ? "bg-sidebar text-sidebar-foreground shadow-sm" : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
          )}
        >
          <Sun className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          title="System Preference"
          className={cn(
            "p-1.5 flex-1 flex justify-center items-center rounded-md transition",
            theme === "system" ? "bg-sidebar text-sidebar-foreground shadow-sm" : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
          )}
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          title="Dark Mode"
          className={cn(
            "p-1.5 flex-1 flex justify-center items-center rounded-md transition",
            theme === "dark" ? "bg-sidebar text-sidebar-foreground shadow-sm" : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
          )}
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

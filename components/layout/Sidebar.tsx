"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Users,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "engineer", "dealer"] },
  { href: "/projects", label: "Projects", icon: FolderOpen, roles: ["admin", "engineer", "dealer"] },
  { href: "/select", label: "New Selection", icon: Zap, roles: ["admin", "engineer", "dealer"], highlight: true },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/admin/pricing", label: "Price Lists", icon: DollarSign, roles: ["admin"] },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  engineer: "bg-blue-500",
  dealer: "bg-green-500",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { step, selectedGroup } = useSelectionStore();
  const selectionInProgress = step > 1 && !!selectedGroup;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const NavLink = ({ href, label, icon: Icon, highlight }: { href: string; label: string; icon: React.ElementType; highlight?: boolean }) => {
    const active = isActive(href);
    const isSelectLink = href === "/select";
    const inProgress = isSelectLink && selectionInProgress;
    const badgeBg = inProgress ? "bg-amber-500" : "bg-[#00A3E0]";
    const badgeText = inProgress ? "In Progress" : "New";

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-lg transition-all mx-auto",
                active
                  ? "bg-[#0057B8] text-white"
                  : highlight
                  ? "bg-[#E8F2FF] text-[#0057B8] hover:bg-[#0057B8]/10"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              {inProgress && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          active
            ? "bg-[#0057B8] text-white shadow-sm"
            : highlight
            ? "bg-[#E8F2FF] text-[#0057B8] hover:bg-[#0057B8]/10"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
        {highlight && (
          <span className={`ml-auto text-xs ${badgeBg} text-white px-1.5 py-0.5 rounded-full`}>
            {badgeText}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-200 px-4",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coolex-logo.png" alt="COOLEX" className="h-10 w-auto" />
            <div className="text-gray-400 text-xs leading-tight hidden xl:block">Selector</div>
          </div>
        )}
        {sidebarCollapsed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src="/coolex-icon.svg" alt="CX" className="w-8 h-8 object-contain" />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            sidebarCollapsed && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapse toggle for collapsed state */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!sidebarCollapsed && (
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Main</div>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {user?.role === "admin" && (
          <>
            {!sidebarCollapsed && (
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2">Admin</div>
            )}
            {sidebarCollapsed && <div className="my-2 border-t border-gray-200" />}
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User Badge */}
      <div className={cn(
        "p-3 border-t border-gray-200",
        sidebarCollapsed ? "flex flex-col items-center gap-2" : ""
      )}>
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0057B8] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user.name ?? "").split(" ").map((n: string) => n[0]).filter(Boolean).join("").slice(0, 2) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-900 text-sm font-medium truncate">{user.name}</div>
              <div className="flex items-center gap-1">
                <span className={cn("w-2 h-2 rounded-full", ROLE_COLORS[user.role] || "bg-gray-400")} />
                <span className="text-gray-400 text-xs capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors text-sm",
                sidebarCollapsed ? "justify-center w-10 h-10 rounded-lg hover:bg-gray-100" : "px-3 py-2 w-full"
              )}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && "Sign Out"}
            </button>
          </TooltipTrigger>
          {sidebarCollapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  );
}

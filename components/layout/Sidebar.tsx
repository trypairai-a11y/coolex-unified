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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/select", label: "New Selection", icon: Zap, highlight: true },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pricing", label: "Price Lists", icon: DollarSign },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500",
  engineer: "bg-[#00A3E0]",
  dealer: "bg-emerald-500",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setMobileMenuOpen } = useUIStore();
  const { step, selectedGroup } = useSelectionStore();
  const selectionInProgress = step > 1 && !!selectedGroup;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const NavLink = ({
    href,
    label,
    icon: Icon,
    highlight,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    highlight?: boolean;
  }) => {
    const active = isActive(href);
    const isSelectLink = href === "/select";
    const inProgress = isSelectLink && selectionInProgress;
    const badgeLabel = inProgress ? "Active" : "New";
    const badgeBg = inProgress ? "bg-amber-500" : "bg-[#00A3E0]";

    if (sidebarCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150 mx-auto",
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {inProgress && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
              {!active && highlight && !inProgress && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#0057B8] rounded-full" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-150",
          active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 font-normal"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        {highlight && (
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap",
            inProgress
              ? "bg-amber-50 text-amber-600"
              : "bg-blue-50 text-[#0057B8]"
          )}>
            {badgeLabel}
          </span>
        )}
      </Link>
    );
  };

  const initials = (user?.name ?? "").split(" ").map((n: string) => n[0]).filter(Boolean).join("").slice(0, 2) || "?";

  return (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300 border-r border-gray-100",
        "bg-white",
        sidebarCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo area */}
      <div className={cn(
        "flex items-center h-14 px-3 border-b border-gray-100",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coolex-logo.png" alt="COOLEX" className="h-10 w-auto mix-blend-multiply" />
            <div className="text-muted-foreground/60 text-[10px] font-semibold uppercase tracking-widest hidden xl:block leading-tight">
              Selector
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src="/coolex-icon.svg" alt="CX" className="w-7 h-7 object-contain" />
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Collapse expand for collapsed state */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {user?.role === "admin" && (
          <>
            <div className={cn("my-3 mx-1 border-t border-gray-100", sidebarCollapsed && "mx-2")} />
            {!sidebarCollapsed && (
              <div className="text-gray-400 text-[10px] font-medium uppercase tracking-widest px-2.5 pb-1">
                Admin
              </div>
            )}
            {ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className={cn("px-2 py-3 border-t border-gray-100", sidebarCollapsed ? "flex flex-col items-center gap-2" : "space-y-1")}>
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md mb-1">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-gray-800 text-xs font-medium truncate">{user.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", ROLE_COLORS[user.role] || "bg-gray-300")} />
                <span className="text-gray-400 text-[10px] capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs rounded-md",
                sidebarCollapsed
                  ? "justify-center w-8 h-8"
                  : "px-2.5 py-2 w-full"
              )}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!sidebarCollapsed && "Sign out"}
            </button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right" className="text-xs">
              Sign out
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}

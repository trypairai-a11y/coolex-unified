"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, ChevronRight, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { CommandPalette } from "@/components/layout/CommandPalette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/select": "New Selection",
  "/admin/users": "User Management",
  "/admin/pricing": "Price Lists",
};

function SelectionBreadcrumbs() {
  const { selectedGroup, selectedSeries, step } = useSelectionStore();

  const crumbs = [
    { label: "Select", href: "/select" },
    selectedGroup && { label: selectedGroup.name },
    selectedSeries && { label: selectedSeries.name },
    step >= 3 && selectedSeries && {
      label: ["Project Info", "Design Conditions", "Results", "Options", "Submittal"][step - 3],
    },
  ].filter(Boolean) as { label: string; href?: string }[];

  return (
    <div className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
          <span className={cn(
            "font-medium",
            i === crumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
          )}>
            {crumb.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const isSelectionPage = pathname === "/select";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const pageTitle = BREADCRUMB_MAP[pathname] ?? pathname.split("/").pop() ?? "Page";
  const initials = (user?.name ?? "").split(" ").map((n: string) => n[0]).filter(Boolean).join("").slice(0, 2) || "?";

  return (
    <div className="h-14 border-b bg-white flex items-center px-4 sm:px-5 gap-3 sticky top-0 z-30 shadow-[0_1px_0_var(--border)]">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden text-muted-foreground shrink-0"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Title / breadcrumb */}
      <div className="flex-1 min-w-0">
        {isSelectionPage ? (
          <SelectionBreadcrumbs />
        ) : (
          <h1 className="text-sm font-semibold text-foreground tracking-tight">{pageTitle}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPaletteOpen(true)}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 w-8 h-8 rounded-full bg-[#0057B8] flex items-center justify-center text-white text-[11px] font-bold hover:bg-[#004fa0] transition-colors ring-2 ring-transparent hover:ring-[#0057B8]/20">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-semibold text-sm">{user?.name}</div>
              <div className="text-xs text-muted-foreground font-normal mt-0.5">{user?.email}</div>
              <Badge variant="secondary" className="mt-1.5 capitalize text-xs">{user?.role}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSelectionStore } from "@/lib/stores/selection-store";
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
    step >= 3 && selectedSeries && { label: ["Project Info", "Design Conditions", "Results", "Options", "Submittal"][step - 3] },
  ].filter(Boolean) as { label: string; href?: string }[];

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
          <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : ""}>
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
  const isSelectionPage = pathname === "/select";
  const [paletteOpen, setPaletteOpen] = useState(false);

  const pageTitle = BREADCRUMB_MAP[pathname] ?? pathname.split("/").pop() ?? "Page";

  return (
    <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Breadcrumb / Title */}
      <div className="flex-1">
        {isSelectionPage ? (
          <SelectionBreadcrumbs />
        ) : (
          <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setPaletteOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#0057B8] rounded-full" />
        </Button>

        {/* Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-[#0057B8] flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity">
              {(user?.name ?? "").split(" ").map((n: string) => n[0]).filter(Boolean).join("").slice(0, 2) || "?"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground font-normal mt-0.5">{user?.email}</div>
              <Badge variant="secondary" className="mt-1 capitalize text-xs">{user?.role}</Badge>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, FolderOpen, Zap, Users, DollarSign, Search, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useAuthStore } from "@/lib/stores/auth-store";

interface CommandItem {
  label: string;
  description?: string;
  href: string;
  icon: React.ElementType;
}

const QUICK_ACTIONS: CommandItem[] = [
  { label: "Dashboard", description: "Go to dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", description: "View all projects", href: "/projects", icon: FolderOpen },
  { label: "New Selection", description: "Start a new equipment selection", href: "/select", icon: Zap },
];

const ADMIN_ACTIONS: CommandItem[] = [
  { label: "Users", description: "Manage users", href: "/admin/users", icon: Users },
  { label: "Price Lists", description: "Manage pricing", href: "/admin/pricing", icon: DollarSign },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const projects = useProjectsStore(s => s.projects);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const filteredProjects = query.trim()
    ? projects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.clientName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const actions = [
    ...QUICK_ACTIONS,
    ...(user?.role === "admin" ? ADMIN_ACTIONS : []),
  ].filter(a =>
    !query.trim() ||
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    (a.description ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search projects, actions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
            autoFocus
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border shrink-0">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {/* Quick Actions */}
          {actions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </div>
              {actions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Project search results */}
          {filteredProjects.length > 0 && (
            <div className={actions.length > 0 ? "mt-1 border-t pt-1" : ""}>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Projects
              </div>
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.clientName} · {p.country}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() && actions.length === 0 && filteredProjects.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Type to search projects or actions
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

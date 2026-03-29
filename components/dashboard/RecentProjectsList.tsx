"use client";

import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import type { ProjectStatus } from "@/types/project";

const STATUS_VARIANTS: Record<ProjectStatus, "default" | "secondary" | "success" | "warning" | "outline" | "destructive"> = {
  draft: "secondary",
  active: "default",
  submitted: "warning",
  approved: "success",
  archived: "outline",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  submitted: "Submitted",
  approved: "Approved",
  archived: "Archived",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export function RecentProjectsList() {
  const { data: projects, isLoading } = useProjects();
  const recent = projects?.slice(0, 5) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!recent.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No recent projects</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Project</th>
            <th className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Client</th>
            <th className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Engineer</th>
            <th className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Modified</th>
            <th className="text-left pb-2.5 pr-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            <th className="pb-2.5" />
          </tr>
        </thead>
        <tbody>
          {recent.map((project) => (
            <tr key={project.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors group">
              <td className="py-3 pr-4">
                <div className="font-semibold text-foreground truncate max-w-[180px] text-sm">{project.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{project.units.length} unit{project.units.length !== 1 ? "s" : ""}</div>
              </td>
              <td className="py-3 pr-4 hidden md:table-cell text-sm text-muted-foreground">{project.clientName}</td>
              <td className="py-3 pr-4 hidden lg:table-cell text-sm text-muted-foreground">{project.salesEngineer}</td>
              <td className="py-3 pr-4 hidden sm:table-cell text-sm text-muted-foreground">{formatDate(project.updatedAt)}</td>
              <td className="py-3 pr-4">
                <Badge variant={STATUS_VARIANTS[project.status]} className="text-[10px] font-semibold uppercase tracking-wide">
                  {STATUS_LABELS[project.status]}
                </Badge>
              </td>
              <td className="py-3 text-right">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

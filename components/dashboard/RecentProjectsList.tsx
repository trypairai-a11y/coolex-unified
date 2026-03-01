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
          <tr className="border-b">
            <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Project</th>
            <th className="text-left pb-3 pr-4 font-medium text-muted-foreground hidden md:table-cell">Client</th>
            <th className="text-left pb-3 pr-4 font-medium text-muted-foreground hidden lg:table-cell">Engineer</th>
            <th className="text-left pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Last Modified</th>
            <th className="text-left pb-3 pr-4 font-medium text-muted-foreground">Status</th>
            <th className="pb-3 font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {recent.map((project) => (
            <tr key={project.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="py-3 pr-4">
                <div className="font-medium text-foreground truncate max-w-[180px]">{project.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{project.units.length} unit{project.units.length !== 1 ? "s" : ""}</div>
              </td>
              <td className="py-3 pr-4 hidden md:table-cell text-muted-foreground">{project.clientName}</td>
              <td className="py-3 pr-4 hidden lg:table-cell text-muted-foreground">{project.salesEngineer}</td>
              <td className="py-3 pr-4 hidden sm:table-cell text-muted-foreground">{formatDate(project.updatedAt)}</td>
              <td className="py-3 pr-4">
                <Badge variant={STATUS_VARIANTS[project.status]}>
                  {STATUS_LABELS[project.status]}
                </Badge>
              </td>
              <td className="py-3 text-right">
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
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

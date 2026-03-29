"use client";

import { TrendingUp, FolderOpen, FileText, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { MOCK_USERS } from "@/lib/mock-data/users";

export function StatsCards({ loading = false }: { loading?: boolean }) {
  const projects = useProjectsStore(s => s.projects);

  const totalUnits = projects.reduce((sum, p) => sum + p.units.length, 0);
  const activeProjects = projects.filter(p =>
    p.status === "active" || p.status === "draft" || p.status === "submitted"
  ).length;
  const totalRevisions = projects.reduce(
    (sum, p) => sum + p.units.reduce((us, u) => us + u.revisions.length, 0),
    0
  );
  const activeDealers = MOCK_USERS.filter(u => u.role === "dealer" && u.status === "active").length;

  const STATS = [
    {
      title: "Units Selected",
      value: totalUnits,
      icon: TrendingUp,
      iconBg: "#E8F2FF",
      iconColor: "#0057B8",
      accent: "#0057B8",
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: FolderOpen,
      iconBg: "#EEF0FF",
      iconColor: "#4A6FBF",
      accent: "#4A6FBF",
    },
    {
      title: "Total Revisions",
      value: totalRevisions,
      icon: FileText,
      iconBg: "#E0F5FF",
      iconColor: "#00A3E0",
      accent: "#00A3E0",
    },
    {
      title: "Active Dealers",
      value: activeDealers,
      icon: Users,
      iconBg: "#E6FAF2",
      iconColor: "#059669",
      accent: "#059669",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="cx-card p-5">
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-9 w-14" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="cx-card p-5 group">
            {/* Top row: label + icon */}
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{ background: stat.iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
            </div>

            {/* Number */}
            <p className="cx-stat-number text-4xl" style={{ color: stat.accent }}>
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

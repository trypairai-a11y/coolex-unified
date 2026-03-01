"use client";

import { TrendingUp, FolderOpen, FileText, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      color: "bg-blue-50 text-[#0057B8]",
    },
    {
      title: "Active Projects",
      value: activeProjects,
      icon: FolderOpen,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Total Revisions",
      value: totalRevisions,
      icon: FileText,
      color: "bg-cyan-50 text-[#00A3E0]",
    },
    {
      title: "Dealers Active",
      value: activeDealers,
      icon: Users,
      color: "bg-green-50 text-green-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

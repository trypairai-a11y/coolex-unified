"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, FileText, ChevronRight, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevisionHistoryPanel } from "@/components/projects/RevisionHistoryPanel";
import { useProject } from "@/hooks/useProjects";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { PRODUCT_GROUPS } from "@/lib/mock-data/product-groups";
import { PRODUCT_SERIES } from "@/lib/mock-data/product-series";
import type { Unit } from "@/types/project";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProject(id);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [revPanelOpen, setRevPanelOpen] = useState(false);
  const { reset } = useSelectionStore();

  const handleCreateRevision = (unit: Unit) => {
    const series = PRODUCT_SERIES.find(s => s.id === unit.seriesId);
    const group = series ? PRODUCT_GROUPS.find(g => g.id === series.groupId) : undefined;

    reset();
    if (group && series && project) {
      useSelectionStore.setState({
        selectedGroup: group,
        selectedSeries: series,
        step: 3,
        revisionTargetProjectId: project.id,
        revisionTargetUnitId: unit.id,
      });
    }
    router.push("/select");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) return <div className="text-muted-foreground">Project not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Projects
        </Button>
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground text-sm">{project.clientName} · {project.country}</p>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Client", value: project.clientName },
              { label: "Sales Engineer", value: project.salesEngineer },
              { label: "Status", value: <Badge variant={project.status === "approved" ? "success" : project.status === "active" ? "default" : "secondary"} className="capitalize">{project.status}</Badge> },
              { label: "Last Modified", value: formatDate(project.updatedAt) },
              { label: "Submitted For", value: project.submittedFor },
              { label: "Country", value: project.country },
              { label: "Created", value: formatDate(project.createdAt) },
              { label: "Units", value: project.units.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Units */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Equipment Units ({project.units.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {project.units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No units in this project yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.units.map((unit: Unit) => (
                <div key={unit.id} className="rounded-lg border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{unit.tag}</span>
                        <Badge variant="outline" className="text-xs">{unit.seriesName}</Badge>
                        <Badge variant="secondary" className="text-xs">Rev. {unit.currentRevision}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{unit.reference}</div>
                      <div className="text-sm text-foreground mt-1">
                        {unit.model.modelNumber} · {unit.model.nominalTons} Tons · Qty: {unit.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#0057B8] border-[#0057B8]/30 hover:bg-[#0057B8]/5"
                        onClick={() => handleCreateRevision(unit)}
                      >
                        <GitBranch className="w-3.5 h-3.5 mr-1" />
                        Create Revision
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#0057B8]"
                        onClick={() => { setSelectedUnit(unit); setRevPanelOpen(true); }}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Revisions ({unit.revisions.length})
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RevisionHistoryPanel
        unit={selectedUnit}
        open={revPanelOpen}
        onClose={() => setRevPanelOpen(false)}
      />
    </div>
  );
}

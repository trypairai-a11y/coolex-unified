"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileText,
  ChevronRight,
  GitBranch,
  Building2,
  User,
  Globe,
  CalendarDays,
  Layers,
  Send,
  MapPin,
  MoreVertical,
  Plus,
  Pencil,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RevisionHistoryPanel } from "@/components/projects/RevisionHistoryPanel";
import { useProject } from "@/hooks/useProjects";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { PRODUCT_GROUPS } from "@/lib/mock-data/product-groups";
import { PRODUCT_SERIES } from "@/lib/mock-data/product-series";
import type { Unit } from "@/types/project";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary"; dot: string }> = {
  active: { label: "Active", variant: "default", dot: "bg-blue-500" },
  approved: { label: "Approved", variant: "success", dot: "bg-green-500" },
  draft: { label: "Draft", variant: "secondary", dot: "bg-gray-400" },
  archived: { label: "Archived", variant: "warning", dot: "bg-yellow-500" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProject(id);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [revPanelOpen, setRevPanelOpen] = useState(false);
  const { reset } = useSelectionStore();

  const handleCreateRevision = (unit: Unit) => {
    const series = PRODUCT_SERIES.find((s) => s.id === unit.seriesId);
    const group = series
      ? PRODUCT_GROUPS.find((g) => g.id === series.groupId)
      : undefined;

    reset();
    if (group && series && project) {
      useSelectionStore.setState({
        selectionBasis: "capacity",
        selectedGroup: group,
        selectedSeries: series,
        projectInfo: {
          projectId: project.id,
          projectName: project.name,
          clientName: project.clientName,
          salesEngineer: project.salesEngineer,
          submittedFor: project.submittedFor,
          country: project.country,
          unitReference: unit.reference,
          unitTag: unit.tag,
          quantity: unit.quantity,
        },
        step: 2,
        revisionTargetProjectId: project.id,
        revisionTargetUnitId: unit.id,
      });
    }
    router.push("/select");
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (!project)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <FileText className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-lg font-medium">Project not found</p>
        <p className="text-sm mt-1">This project may have been deleted or moved.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Projects
        </Button>
      </div>
    );

  const status = statusConfig[project.status] ?? statusConfig.active;

  const details = [
    { icon: Building2, label: "Client", value: project.clientName },
    { icon: User, label: "Sales Engineer", value: project.salesEngineer },
    { icon: Send, label: "Submitted For", value: project.submittedFor },
    { icon: MapPin, label: "Country", value: project.country },
    { icon: CalendarDays, label: "Created", value: formatDate(project.createdAt) },
    { icon: CalendarDays, label: "Last Modified", value: formatDate(project.updatedAt) },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="mt-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Projects
          </Button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={status.variant} className="capitalize">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5 inline-block`} />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {project.country}
              {project.clientName && (
                <>
                  <span className="text-muted-foreground/40 mx-1">|</span>
                  <Building2 className="w-3.5 h-3.5" />
                  {project.clientName}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ─── Project Details ─── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Project Details</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {label}
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">
                    {value || <span className="text-muted-foreground/50 italic font-normal">Not set</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Equipment Units ─── */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Equipment Units</h2>
            <Badge variant="secondary" className="ml-1 text-xs">
              {project.units.length}
            </Badge>
          </div>
          <Button
            size="sm"
            className="bg-[#0057B8] hover:bg-[#004494] text-white"
            onClick={() => {
              reset();
              useSelectionStore.setState({
                projectInfo: {
                  projectId: project.id,
                  projectName: project.name,
                  clientName: project.clientName,
                  salesEngineer: project.salesEngineer,
                  submittedFor: project.submittedFor,
                  country: project.country,
                  unitReference: "",
                  unitTag: "",
                  quantity: 1,
                },
                addUnitTargetProjectId: project.id,
                step: 1,
              });
              router.push("/select");
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Unit
          </Button>
        </div>

        {project.units.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 opacity-30" />
            </div>
            <p className="font-medium">No equipment units yet</p>
            <p className="text-sm mt-1 text-muted-foreground/70">
              Add your first unit to get started with this project.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                reset();
                useSelectionStore.setState({
                  projectInfo: {
                    projectId: project.id,
                    projectName: project.name,
                    clientName: project.clientName,
                    salesEngineer: project.salesEngineer,
                    submittedFor: project.submittedFor,
                    country: project.country,
                    unitReference: "",
                    unitTag: "",
                    quantity: 1,
                  },
                  addUnitTargetProjectId: project.id,
                  step: 1,
                });
                router.push("/select");
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Equipment Unit
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {project.units.map((unit: Unit) => (
              <div
                key={unit.id}
                className="px-6 py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  {/* Left: unit info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Icon box */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#0057B8]/8 border border-[#0057B8]/15 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-[#0057B8]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{unit.tag}</span>
                        <Badge variant="outline" className="text-xs font-medium">
                          {unit.seriesName}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Rev. {unit.currentRevision}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{unit.model.modelNumber}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{unit.model.nominalTons} Tons</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Qty: {unit.quantity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#0057B8] border-[#0057B8]/25 hover:bg-[#0057B8]/5 hover:border-[#0057B8]/40"
                      onClick={() => handleCreateRevision(unit)}
                    >
                      <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                      New Revision
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-[#0057B8]"
                      onClick={() => {
                        setSelectedUnit(unit);
                        setRevPanelOpen(true);
                      }}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      Revisions ({unit.revisions.length})
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RevisionHistoryPanel
        unit={selectedUnit}
        open={revPanelOpen}
        onClose={() => setRevPanelOpen(false)}
      />
    </div>
  );
}

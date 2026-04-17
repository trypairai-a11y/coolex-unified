"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Check, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useProjectsStore } from "@/lib/stores/projects-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOptions } from "@/hooks/useSelection";
import { useToast } from "@/components/ui/toast";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, round } from "@/lib/utils/unit-conversions";
import { buildOracleBOM } from "@/lib/nomenclature";
import type { SubmittalOption } from "@/types/submittal";
import type { Project, Unit, Revision, SubmittalSnapshot } from "@/types/project";

const PDFViewer = dynamic(
  () => import("@/components/submittal/SubmittalPDF").then(m => m.SubmittalPDFViewer),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-xl border">
      <div className="text-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading PDF preview...</p>
      </div>
    </div>
  )}
);

export function SubmittalPreview() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unitSelection, setUnitSelection] = useState("");
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  const {
    selectedModels,
    selectedSeries,
    selectedOptions,
    projectInfo,
    designConditions,
    navigateBack,
    revisionTargetProjectId,
    revisionTargetUnitId,
    addUnitTargetProjectId,
    reset,
  } = useSelectionStore();
  const { addProject, addUnit, addRevision, updateUnitSubmittal } = useProjectsStore();
  const { user } = useAuthStore();
  const unitSystem = useUnitStore((s) => s.unitSystem);
  const selectedModel = selectedModels[0] ?? null;
  const showPricing = user?.role !== "dealer";

  const { data: allOptions } = useOptions(selectedSeries?.id ?? null);
  const chosenOptions: SubmittalOption[] = (allOptions ?? [])
    .filter(o => selectedOptions.includes(o.id))
    .map(o => ({ id: o.id, label: o.label, priceAdderKWD: o.priceAdderKWD }));

  const handleGenerate = async () => {
    if (!selectedModel || !projectInfo || !designConditions || !selectedSeries) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));

    const now = new Date().toISOString();
    const createdBy = user?.name ?? "Unknown";

    const bPrice = Math.round(selectedModel.nominalTons * 185);
    const oTotal = chosenOptions.reduce((s, o) => s + o.priceAdderKWD, 0);
    const dPct = 5;
    const snapshot: SubmittalSnapshot = {
      designConditions,
      selectedOptions: chosenOptions,
      basePriceKWD: bPrice,
      optionsTotalKWD: oTotal,
      discountPercent: dPct,
      netTotalKWD: Math.round((bPrice + oTotal) * (1 - dPct / 100)),
      oracleBOM: buildOracleBOM(selectedModel.modelNumber, selectedSeries.id, selectedOptions).oracleBOM,
      generatedBy: createdBy,
    };

    if (revisionTargetProjectId && revisionTargetUnitId) {
      // Adding a revision to an existing unit
      const projects = useProjectsStore.getState().projects;
      const project = projects.find(p => p.id === revisionTargetProjectId);
      const unit = project?.units.find(u => u.id === revisionTargetUnitId);
      const nextRevNum = String((unit?.revisions.length ?? 0) + 1).padStart(3, "0");

      const revision: Revision = {
        id: `rev-${Date.now()}`,
        unitId: revisionTargetUnitId,
        revisionNumber: nextRevNum,
        createdAt: now,
        createdBy,
        changeSummary: `Rev. ${nextRevNum} - ${selectedModel.modelNumber}`,
        status: "issued",
      };

      addRevision(revisionTargetProjectId, revisionTargetUnitId, revision);
      updateUnitSubmittal(revisionTargetProjectId, revisionTargetUnitId, snapshot);
      setSaving(false);
      setSaved(true);
      showToast(`Revision ${nextRevNum} saved - opening project...`, "success");
      await new Promise(r => setTimeout(r, 2000));
      reset();
      router.push(`/projects/${revisionTargetProjectId}`);
    } else if (addUnitTargetProjectId) {
      // Adding a new unit to an existing project
      const unitId = `unit-${Date.now()}`;

      const revision: Revision = {
        id: `rev-${Date.now()}`,
        unitId,
        revisionNumber: "001",
        createdAt: now,
        createdBy,
        changeSummary: `Initial selection - ${selectedModel.modelNumber}`,
        status: "issued",
      };

      const unit: Unit = {
        id: unitId,
        projectId: addUnitTargetProjectId,
        tag: projectInfo.unitTag || "",
        reference: projectInfo.unitReference || "",
        seriesId: selectedSeries.id,
        seriesName: selectedSeries.name,
        model: selectedModel,
        quantity: Number(projectInfo.quantity ?? 1),
        revisions: [revision],
        currentRevision: "001",
        submittalData: snapshot,
      };

      addUnit(addUnitTargetProjectId, unit);
      setSaving(false);
      setSaved(true);
      showToast("New unit added to project - opening project...", "success");
      await new Promise(r => setTimeout(r, 2000));
      reset();
      router.push(`/projects/${addUnitTargetProjectId}`);
    } else {
      // Creating a new project
      const projectId = `proj-${Date.now()}`;
      const unitId = `unit-${Date.now()}`;

      const revision: Revision = {
        id: `rev-${Date.now()}`,
        unitId,
        revisionNumber: "001",
        createdAt: now,
        createdBy,
        changeSummary: `Initial selection - ${selectedModel.modelNumber}`,
        status: "issued",
      };

      const unit: Unit = {
        id: unitId,
        projectId,
        tag: projectInfo.unitTag || "",
        reference: projectInfo.unitReference || "",
        seriesId: selectedSeries.id,
        seriesName: selectedSeries.name,
        model: selectedModel,
        quantity: Number(projectInfo.quantity ?? 1),
        revisions: [revision],
        currentRevision: "001",
        submittalData: snapshot,
      };

      const project: Project = {
        id: projectId,
        name: projectInfo.projectName,
        clientName: projectInfo.clientName ?? "",
        salesEngineer: projectInfo.salesEngineer ?? "",
        submittedFor: projectInfo.submittedFor ?? "",
        country: projectInfo.country ?? "",
        status: "active",
        createdAt: now,
        updatedAt: now,
        units: [unit],
      };

      addProject(project);
      setSaving(false);
      setSaved(true);
      showToast("Submittal Rev.001 saved - opening project...", "success");
      await new Promise(r => setTimeout(r, 2000));
      reset();
      router.push(`/projects/${projectId}`);
    }
  };

  if (!selectedModel || !projectInfo || !designConditions) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Missing selection data. Please start from Step 1.</p>
      </div>
    );
  }

  const basePriceKWD = Math.round((selectedModel.nominalTons) * 185);
  const optionsTotal = chosenOptions.reduce((s, o) => s + o.priceAdderKWD, 0);
  const discountPct = 5;
  const netTotal = Math.round((basePriceKWD + optionsTotal) * (1 - discountPct / 100));
  const oracleBOM = selectedSeries ? buildOracleBOM(selectedModel.modelNumber, selectedSeries.id, selectedOptions).oracleBOM : selectedModel.modelNumber;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigateBack(6)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Options
          </Button>
          <div>
            <h2 className="text-xl font-bold">Submittal Preview</h2>
            <p className="text-muted-foreground text-sm">{projectInfo.projectName}</p>
          </div>
        </div>
        <p className="text-sm font-mono font-semibold text-[#0057B8]">{oracleBOM}</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Model", value: selectedModel.modelNumber, mono: true },
          { label: "Total Capacity", value: unitSystem === "metric"
            ? `${round(btuhToKw(selectedModel.totalCapacityBtuh), 1)} kW`
            : `${(selectedModel.totalCapacityBtuh / 1000).toFixed(0)}k Btu/h` },
          { label: "Options Selected", value: `${chosenOptions.length} items` },
        ].map(item => (
          <div key={item.label} className="bg-card border rounded-lg p-3">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className={`font-semibold mt-0.5 ${item.mono ? "font-mono text-sm" : "text-sm"}`}>{item.value}</div>
          </div>
        ))}
      </div>


      {/* PDF Preview */}
      <div className="rounded-xl border overflow-hidden mb-6 bg-gray-50">
        <PDFViewer
          model={selectedModel}
          projectInfo={projectInfo}
          designConditions={designConditions}
          selectedOptions={chosenOptions}
          basePriceKWD={basePriceKWD}
          optionsTotalKWD={optionsTotal}
          discountPercent={discountPct}
          netTotalKWD={netTotal}
          showPricing={showPricing}
          revisionNumber="001"
          generatedBy={user?.name ?? ""}
          oracleBOM={oracleBOM}
          unitSystem={unitSystem}
        />
      </div>

      <Separator className="my-6" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {saved ? (
            <Badge variant="success" className="gap-1">
              <Check className="w-3 h-3" /> Saved - opening project...
            </Badge>
          ) : (
            "Generate to save this submittal and auto-increment revision"
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={saving || saved}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90 gap-2"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Submittal Generated</>
          ) : (
            <><Download className="w-4 h-4" /> Generate Submittal</>
          )}
        </Button>
      </div>

      {ToastComponent}
    </div>
  );
}

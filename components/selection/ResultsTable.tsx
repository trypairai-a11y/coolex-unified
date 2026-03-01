"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useModels } from "@/hooks/useSelection";
import type { Model } from "@/types/product";

type SortKey = keyof Pick<Model, "totalCapacityBtuh" | "sensibleCapacityBtuh" | "powerKW" | "eer" | "airflowCFM" | "matchPercent">;

function formatBtuh(v: number) {
  return `${(v / 1000).toFixed(0)}k`;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <AlertCircle className="w-10 h-10 text-destructive/60" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ResultsTable() {
  const { selectedSeries, designConditions, selectedModel, setSelectedModel, navigateBack } = useSelectionStore();
  const [sortKey, setSortKey] = useState<SortKey>("matchPercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const capacityBtuh = (designConditions as { requiredCoolingCapacityBtuh?: number })?.requiredCoolingCapacityBtuh ?? null;
  const { data: models, isLoading, isError } = useModels(selectedSeries?.id ?? null, capacityBtuh);

  const sorted = [...(models ?? [])].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5 text-[#0057B8]" /> : <ChevronUp className="w-3.5 h-3.5 text-[#0057B8]" />;
  };

  const TH = ({ label, sortable, sk }: { label: string; sortable?: SortKey; sk?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap ${sortable ? "cursor-pointer hover:text-foreground select-none" : ""}`}
      onClick={() => sortable && handleSort(sortable)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortable && <SortIcon k={sortable} />}
      </div>
    </th>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(4)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Model Results</h2>
          <p className="text-muted-foreground text-sm">
            {selectedSeries?.name} — {capacityBtuh ? `${(capacityBtuh / 1000).toFixed(0)}k Btu/h requested` : ""}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load model results" />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {sorted.map((model) => {
              const isSelected = selectedModel?.id === model.id;
              return (
                <div
                  key={model.id}
                  className={`rounded-xl border p-4 transition-colors ${isSelected ? "border-[#0057B8] bg-blue-50" : "bg-card"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold text-sm">{model.modelNumber}</span>
                    <Badge variant={model.matchPercent >= 95 ? "success" : model.matchPercent >= 80 ? "warning" : "outline"}>
                      {model.matchPercent}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-muted-foreground">Capacity</div>
                      <div className="font-medium">{formatBtuh(model.totalCapacityBtuh)} Btu/h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Power</div>
                      <div className="font-medium">{model.powerKW} kW</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">EER</div>
                      <div className="font-medium text-[#00A3E0]">{model.eer}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Airflow</div>
                      <div className="font-medium">{model.airflowCFM.toLocaleString()} CFM</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full ${isSelected ? "bg-[#0057B8] text-white" : ""}`}
                    onClick={() => setSelectedModel(model)}
                  >
                    {isSelected ? "Selected ✓" : "Select"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <TH label="Model" />
                    <TH label="Match %" sortable="matchPercent" />
                    <TH label="Total Cap." sortable="totalCapacityBtuh" />
                    <TH label="Sensible Cap." sortable="sensibleCapacityBtuh" />
                    <TH label="Power (kW)" sortable="powerKW" />
                    <TH label="EER" sortable="eer" />
                    <TH label="Airflow (CFM)" sortable="airflowCFM" />
                    <TH label="Leaving DB/WB" />
                    <TH label="Compressors" />
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((model) => {
                    const isSelected = selectedModel?.id === model.id;
                    const isHovered = hoveredRow === model.id;
                    return (
                      <tr
                        key={model.id}
                        className={`border-t transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-l-2 border-l-[#0057B8]"
                            : isHovered
                            ? "bg-muted/30"
                            : ""
                        }`}
                        onMouseEnter={() => setHoveredRow(model.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-foreground text-xs">{model.modelNumber}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={model.matchPercent >= 95 ? "success" : model.matchPercent >= 80 ? "warning" : "outline"}
                          >
                            {model.matchPercent}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatBtuh(model.totalCapacityBtuh)} Btu/h</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatBtuh(model.sensibleCapacityBtuh)} Btu/h</td>
                        <td className="px-4 py-3 text-foreground">{model.powerKW}</td>
                        <td className="px-4 py-3">
                          <span className="text-[#00A3E0] font-semibold">{model.eer}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{model.airflowCFM.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{model.leavingDBF}°F / {model.leavingWBF}°F</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{model.compressorCount}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => setSelectedModel(model)}
                            className={isSelected ? "bg-[#0057B8] text-white" : ""}
                          >
                            {isSelected ? "Selected ✓" : "Select"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end mt-6">
        <Button
          disabled={!selectedModel}
          onClick={() => selectedModel && useSelectionStore.getState().setStep(6)}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue with {selectedModel?.modelNumber ?? "Model"} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

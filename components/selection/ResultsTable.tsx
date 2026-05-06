"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useModels } from "@/hooks/useSelection";
import { NomenclatureInline } from "@/components/selection/NomenclatureBreakdown";
import type { Model } from "@/types/product";
import { UnitToggle } from "@/components/selection/UnitToggle";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, btuhToTons, fToC, cfmToM3h, gpmToLps, lpsToGpm, kpaToFtWg, round } from "@/lib/utils/unit-conversions";

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
  const { selectedSeries, designConditions, selectedModels, toggleModelSelection, navigateBack, selectionBasis, projectInfo } = useSelectionStore();
  const [sortKey, setSortKey] = useState<SortKey>("matchPercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const unitSystem = useUnitStore((s) => s.unitSystem);
  const isMetric = unitSystem === "metric";
  const isChiller = selectedSeries?.isChiller ?? false;
  const isCCU = selectedSeries?.isCCU ?? false;
  const isCrac = selectedSeries?.groupId === "crac";
  const isPackagedExclSPU = selectedSeries?.groupId === "pac" && selectedSeries?.id !== "spu";
  const isSplit = selectedSeries?.groupId === "split";

  const dc = designConditions as Record<string, number> | null;
  const capacityBtuh = dc?.requiredCoolingCapacityBtuh ?? null;
  const airflowCFM = dc?.requiredAirflowCFM ?? null;
  const ewtF = dc?.enteringWaterTempF ?? null;
  const lwtF = dc?.leavingWaterTempF ?? null;
  const flowGPM = dc?.waterFlowRateGPM ?? null;
  const sstF = dc?.saturatedSuctionTempF ?? null;
  const ambientF = dc?.ambientTempF ?? null;
  const sctF = ambientF != null ? ambientF + 25 : null;
  const basis = selectionBasis ?? 'capacity';
  const showMewApproval =
    projectInfo?.country === "Kuwait" &&
    ambientF === 118 &&
    (isChiller || isCrac || isPackagedExclSPU || isSplit);
  const evapConditions = {
    enteringDBF: dc?.enteringDBF,
    enteringWBF: dc?.enteringWBF,
    espInWG: dc?.espInWG,
    leavingWaterTempF: dc?.leavingWaterTempF,
    ambientTempF: dc?.ambientTempF,
    saturatedSuctionTempF: dc?.saturatedSuctionTempF,
  };
  const { data: models, isLoading, isError } = useModels(selectedSeries?.id ?? null, capacityBtuh, basis, airflowCFM, evapConditions);

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigateBack(4)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Model Results</h2>
            <p className="text-muted-foreground text-sm">
              {selectedSeries?.name} - {basis === 'airflow' && airflowCFM
                ? isMetric
                  ? `${round(cfmToM3h(airflowCFM), 0).toLocaleString()} m³/h requested`
                  : `${airflowCFM.toLocaleString()} CFM requested`
                : capacityBtuh
                  ? isMetric
                    ? `${round(btuhToKw(capacityBtuh), 1)} kW requested`
                    : `${(capacityBtuh / 1000).toFixed(0)}k Btu/h requested`
                  : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {showMewApproval && (
            <Image
              src="/images/mew-logo.png"
              alt="Kuwait Ministry of Electricity & Water"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          )}
          <UnitToggle />
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
              const isSelected = selectedModels.some(m => m.id === model.id);
              return (
                <div
                  key={model.id}
                  className={`rounded-xl border p-4 transition-colors ${isSelected ? "border-[#0057B8] bg-blue-50" : "bg-card"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-mono font-bold text-sm">{model.modelNumber}</span>
                      <div className="mt-1">
                        <NomenclatureInline modelNumber={model.modelNumber} seriesId={selectedSeries?.id ?? ""} />
                      </div>
                    </div>
                    <Badge variant={model.matchPercent >= 95 ? "success" : model.matchPercent >= 80 ? "warning" : "outline"}>
                      {model.matchPercent}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-muted-foreground">Capacity</div>
                      <div className="font-medium">
                        {isMetric ? `${round(btuhToKw(model.totalCapacityBtuh), 1)} kW` : `${formatBtuh(model.totalCapacityBtuh)} Btu/h`}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Power</div>
                      <div className="font-medium">{round(model.powerKW, 1).toFixed(1)} kW</div>
                    </div>
                    {!isCCU && (
                      <div>
                        <div className="text-muted-foreground">{isChiller || isMetric ? "COP" : "EER"}</div>
                        <div className="font-medium">{isChiller || isMetric ? round(model.eer / 3.412, 2) : model.eer}</div>
                      </div>
                    )}
                    {isChiller ? (
                      <>
                        <div>
                          <div className="text-muted-foreground">Water In/Out</div>
                          <div className="font-medium">
                            {ewtF != null && lwtF != null
                              ? isMetric
                                ? `${round(fToC(ewtF), 1)} / ${round(fToC(lwtF), 1)} °C`
                                : `${ewtF} / ${lwtF} °F`
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Flow</div>
                          <div className="font-medium">
                            {model.matrixWaterFlowLPS != null
                              ? isMetric
                                ? `${model.matrixWaterFlowLPS.toFixed(1)} L/s`
                                : `${lpsToGpm(model.matrixWaterFlowLPS).toFixed(1)} GPM`
                              : flowGPM != null
                                ? isMetric
                                  ? `${round(gpmToLps(flowGPM), 1)} L/s`
                                  : `${flowGPM.toLocaleString()} GPM`
                                : "—"}
                          </div>
                        </div>
                        {model.matrixWaterPressureDropKPa != null && (
                          <div>
                            <div className="text-muted-foreground">WPD</div>
                            <div className="font-medium">
                              {isMetric
                                ? `${model.matrixWaterPressureDropKPa.toFixed(1)} kPa`
                                : `${kpaToFtWg(model.matrixWaterPressureDropKPa).toFixed(1)} ft.wg`}
                            </div>
                          </div>
                        )}
                      </>
                    ) : isCCU ? (
                      <>
                        <div>
                          <div className="text-muted-foreground">Evap. Temp</div>
                          <div className="font-medium">
                            {sstF != null
                              ? isMetric
                                ? `${round(fToC(sstF), 1)} °C`
                                : `${sstF} °F`
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Cond. Temp</div>
                          <div className="font-medium">
                            {model.matrixCondensingTempF != null
                              ? isMetric
                                ? `${round(fToC(model.matrixCondensingTempF), 1)} °C`
                                : `${model.matrixCondensingTempF.toFixed(1)} °F`
                              : sctF != null
                                ? isMetric
                                  ? `${round(fToC(sctF), 1)} °C`
                                  : `${sctF} °F`
                                : "—"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="text-muted-foreground">Airflow</div>
                        <div className="font-medium">
                          {isMetric ? `${round(cfmToM3h(model.airflowCFM), 0).toLocaleString()} m³/h` : `${model.airflowCFM.toLocaleString()} CFM`}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full ${isSelected ? "bg-[#0057B8] text-white" : ""}`}
                    onClick={() => toggleModelSelection(model)}
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
                    <th className="px-4 py-3"></th>
                    <TH label="Model" />
                    <TH label="Match %" sortable="matchPercent" />
                    <TH label="Total Cap." sortable="totalCapacityBtuh" />
                    <TH label="Tons" sortable="totalCapacityBtuh" />
                    {isChiller ? (
                      <>
                        <TH label={isMetric ? "Water In/Out (°C)" : "Water In/Out (°F)"} />
                        <TH label={isMetric ? "Flow (L/s)" : "Flow (GPM)"} />
                        <TH label={isMetric ? "WPD (kPa)" : "WPD (ft.wg)"} />
                      </>
                    ) : isCCU ? (
                      <>
                        <TH label={isMetric ? "Evap. Temp (°C)" : "Evap. Temp (°F)"} />
                        <TH label={isMetric ? "Cond. Temp (°C)" : "Cond. Temp (°F)"} />
                      </>
                    ) : (
                      <TH label="Sensible Cap." sortable="sensibleCapacityBtuh" />
                    )}
                    <TH label="Power (kW)" sortable="powerKW" />
                    {!isCCU && <TH label={isChiller || isMetric ? "COP" : "EER"} sortable="eer" />}
                    {!isChiller && !isCCU && (
                      <>
                        <TH label={isMetric ? "Airflow (m³/h)" : "Airflow (CFM)"} sortable="airflowCFM" />
                        <TH label="Leaving DB/WB" />
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((model) => {
                    const isSelected = selectedModels.some(m => m.id === model.id);
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
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleModelSelection(model)}
                            className={isSelected ? "bg-[#0057B8] text-white" : ""}
                          >
                            {isSelected ? "Selected ✓" : "Select"}
                          </Button>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-foreground text-xs">{model.modelNumber}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={model.matchPercent >= 95 ? "success" : model.matchPercent >= 80 ? "warning" : "outline"}
                          >
                            {model.matchPercent}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-black">
                          {isMetric ? `${round(btuhToKw(model.totalCapacityBtuh), 1)} kW` : `${formatBtuh(model.totalCapacityBtuh)} Btu/h`}
                        </td>
                        <td className="px-4 py-3 text-black">
                          {round(btuhToTons(model.totalCapacityBtuh), 1)} TR
                        </td>
                        {isChiller ? (
                          <>
                            <td className="px-4 py-3 text-black text-xs">
                              {ewtF != null && lwtF != null
                                ? isMetric
                                  ? `${round(fToC(ewtF), 1)} / ${round(fToC(lwtF), 1)}`
                                  : `${ewtF} / ${lwtF}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-black">
                              {model.matrixWaterFlowLPS != null
                                ? isMetric
                                  ? model.matrixWaterFlowLPS.toFixed(1)
                                  : lpsToGpm(model.matrixWaterFlowLPS).toFixed(1)
                                : flowGPM != null
                                  ? isMetric
                                    ? round(gpmToLps(flowGPM), 1)
                                    : flowGPM.toLocaleString()
                                  : "—"}
                            </td>
                            <td className="px-4 py-3 text-black">
                              {model.matrixWaterPressureDropKPa != null
                                ? isMetric
                                  ? model.matrixWaterPressureDropKPa.toFixed(1)
                                  : kpaToFtWg(model.matrixWaterPressureDropKPa).toFixed(1)
                                : "—"}
                            </td>
                          </>
                        ) : isCCU ? (
                          <>
                            <td className="px-4 py-3 text-black">
                              {sstF != null
                                ? isMetric
                                  ? round(fToC(sstF), 1)
                                  : sstF
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-black">
                              {model.matrixCondensingTempF != null
                                ? isMetric
                                  ? round(fToC(model.matrixCondensingTempF), 1)
                                  : model.matrixCondensingTempF.toFixed(1)
                                : sctF != null
                                  ? isMetric
                                    ? round(fToC(sctF), 1)
                                    : sctF
                                  : "—"}
                            </td>
                          </>
                        ) : (
                          <td className="px-4 py-3 text-black">
                            {isMetric ? `${round(btuhToKw(model.sensibleCapacityBtuh), 1)} kW` : `${formatBtuh(model.sensibleCapacityBtuh)} Btu/h`}
                          </td>
                        )}
                        <td className="px-4 py-3 text-black">{round(model.powerKW, 1).toFixed(1)}</td>
                        {!isCCU && (
                          <td className="px-4 py-3">
                            <span className="text-black">{isChiller || isMetric ? round(model.eer / 3.412, 2) : model.eer}</span>
                          </td>
                        )}
                        {!isChiller && !isCCU && (
                          <>
                            <td className="px-4 py-3 text-black">
                              {isMetric ? round(cfmToM3h(model.airflowCFM), 0).toLocaleString() : model.airflowCFM.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-black text-xs">
                              {isMetric
                                ? `${round(fToC(model.leavingDBF), 1)}°C / ${round(fToC(model.leavingWBF), 1)}°C`
                                : `${model.leavingDBF}°F / ${model.leavingWBF}°F`}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      <div className="flex justify-between items-center gap-4 mt-6">
        {showMewApproval ? (
          <div className="rounded-lg border border-[#B8D4F0] bg-[#F0F7FF] px-4 py-3">
            <p className="text-xs sm:text-sm font-medium text-[#0057B8] leading-snug">
              Total Cooling Capacities Shown are Gross Rated as per MEW Approval
            </p>
          </div>
        ) : <div />}
        <Button
          disabled={selectedModels.length === 0}
          onClick={() => useSelectionStore.getState().setStep(6)}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue with {selectedModels[0]?.modelNumber} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

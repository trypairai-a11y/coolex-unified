"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Home, Sun, Sparkles, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, fToC, cfmToM3h, round } from "@/lib/utils/unit-conversions";
import type { VRFIndoorType } from "@/types/selection";

const INDOOR_SPEC_PROFILE: Record<
  VRFIndoorType,
  { prefix: string; eer: number; sensibleRatio: number; cfmPerKbtuh: number; leavingDBF: number; leavingWBF: number }
> = {
  "ducted-split-low-static": { prefix: "DSL", eer: 11.5, sensibleRatio: 0.75, cfmPerKbtuh: 35, leavingDBF: 56, leavingWBF: 54 },
  "ducted-split-high-static": { prefix: "DSH", eer: 11.0, sensibleRatio: 0.75, cfmPerKbtuh: 34, leavingDBF: 56, leavingWBF: 54 },
  "ducted-split-inverter": { prefix: "DSI", eer: 12.5, sensibleRatio: 0.76, cfmPerKbtuh: 36, leavingDBF: 55, leavingWBF: 53 },
  cassette: { prefix: "CAS", eer: 11.2, sensibleRatio: 0.74, cfmPerKbtuh: 33, leavingDBF: 57, leavingWBF: 55 },
  "wall-mounted": { prefix: "WAL", eer: 11.6, sensibleRatio: 0.72, cfmPerKbtuh: 32, leavingDBF: 58, leavingWBF: 56 },
};

function computeIndoorSpecs(indoorType: VRFIndoorType, capacityKbtuh: number) {
  const p = INDOOR_SPEC_PROFILE[indoorType];
  const totalBtuh = capacityKbtuh * 1000;
  const sensibleBtuh = totalBtuh * p.sensibleRatio;
  const powerKW = round(totalBtuh / p.eer / 1000, 2);
  const airflowCFM = Math.round(capacityKbtuh * p.cfmPerKbtuh * 10) * 10;
  return {
    modelNumber: `${p.prefix}-${String(capacityKbtuh).padStart(3, "0")}`,
    matchPercent: 100,
    totalBtuh,
    sensibleBtuh,
    powerKW,
    eer: p.eer,
    airflowCFM,
    leavingDBF: p.leavingDBF,
    leavingWBF: p.leavingWBF,
  };
}

const INDOOR_TYPES: {
  value: VRFIndoorType;
  label: string;
  description: string;
  icon?: React.ElementType;
  image?: string;
  accent: string;
  bg: string;
  capacities: number[];
}[] = [
  {
    value: "ducted-split-low-static",
    label: "Ducted Split (Low Static)",
    description: "Concealed indoor for short duct runs",
    image: "/images/vrf-ducted-split.png",
    accent: "#0057B8",
    bg: "#EBF3FF",
    capacities: [18, 24, 30, 36],
  },
  {
    value: "ducted-split-high-static",
    label: "Ducted Split (High Static)",
    description: "Concealed indoor for long duct runs",
    image: "/images/vrf-ducted-split.png",
    accent: "#0057B8",
    bg: "#EBF3FF",
    capacities: [16, 18, 24, 30, 36, 42, 48, 60],
  },
  {
    value: "ducted-split-inverter",
    label: "Ducted Split Inverter",
    description: "Variable-capacity ducted indoor",
    image: "/images/vrf-ducted-split-inverter.png",
    accent: "#7C3AED",
    bg: "#F3EBFF",
    capacities: [12, 16, 18, 22, 24, 30, 36, 42, 48, 60],
  },
  {
    value: "cassette",
    label: "Cassette",
    description: "Ceiling-recessed 4-way grille",
    image: "/images/vrf-cassette.png",
    accent: "#0F766E",
    bg: "#E6F7F4",
    capacities: [18, 24, 36, 48],
  },
  {
    value: "wall-mounted",
    label: "Wall Mounted",
    description: "Surface-mount on the wall",
    image: "/images/vrf-wall-mounted.png",
    accent: "#B45309",
    bg: "#FEF4E6",
    capacities: [12, 18, 24, 30],
  },
];

type VRFView = "indoor" | "outdoor";

export function VRFDesignConditions() {
  const { vrfLayout, setVRFRoomIndoorType, setVRFRoomCapacity, confirmVRFDesign, navigateBack } = useSelectionStore();
  const unitSystem = useUnitStore((s) => s.unitSystem);
  const isMetric = unitSystem === "metric";
  const [view, setView] = useState<VRFView>("indoor");

  if (!vrfLayout) {
    return (
      <div className="text-sm text-muted-foreground">
        No VRF layout defined yet. Go back and define floors and rooms first.
      </div>
    );
  }

  const allRooms = vrfLayout.floors.flatMap((f) => f.rooms);
  const allConfigured = allRooms.length > 0 && allRooms.every((r) => !!r.indoorType && !!r.capacity);
  const configuredCount = allRooms.filter((r) => !!r.indoorType && !!r.capacity).length;
  const totalCapacityKbtuh = allRooms.reduce((sum, r) => sum + (r.capacity ?? 0), 0);
  const totalCapacityTons = totalCapacityKbtuh / 12;
  const OUTDOOR_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48];
  const recommendedOutdoorTons = OUTDOOR_SIZES.find((s) => s >= totalCapacityTons) ?? OUTDOOR_SIZES[OUTDOOR_SIZES.length - 1];
  const combinationRatio = recommendedOutdoorTons > 0 ? (totalCapacityTons / recommendedOutdoorTons) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (view === "outdoor") {
              setView("indoor");
            } else {
              navigateBack(3);
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Indoor / Outdoor Design</h2>
          <p className="text-muted-foreground text-sm">
            {view === "indoor" ? (
              <>
                Pick the indoor unit type and capacity for each room.{" "}
                <span className="font-medium text-[#0057B8]">
                  {configuredCount} / {allRooms.length} rooms configured
                </span>
              </>
            ) : (
              <>
                Review the outdoor system sizing based on total indoor load.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="inline-flex p-1 rounded-xl bg-[#F0F4FB] border border-[#E2E8F4] mb-6">
        <button
          type="button"
          onClick={() => setView("indoor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === "indoor"
              ? "bg-white text-[#0057B8] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[#64748B] hover:text-[#0D1626]"
          }`}
        >
          <Home className="w-4 h-4" strokeWidth={2} />
          Indoor Units
        </button>
        <button
          type="button"
          onClick={() => allConfigured && setView("outdoor")}
          disabled={!allConfigured}
          title={!allConfigured ? "Finish configuring all indoor units first" : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            view === "outdoor"
              ? "bg-white text-[#B45309] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : !allConfigured
              ? "text-[#B8C2D4] cursor-not-allowed"
              : "text-[#64748B] hover:text-[#0D1626]"
          }`}
        >
          <Sun className="w-4 h-4" strokeWidth={2} />
          Outdoor Unit
        </button>
      </div>

      {view === "outdoor" ? (
        <OutdoorPanel
          totalCapacityKbtuh={totalCapacityKbtuh}
          totalCapacityTons={totalCapacityTons}
          recommendedOutdoorTons={recommendedOutdoorTons}
          combinationRatio={combinationRatio}
          indoorCount={allRooms.length}
          isMetric={isMetric}
        />
      ) : (
      <div className="space-y-6">
        {vrfLayout.floors.map((floor) => (
          <div key={floor.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8]">
                Floor {floor.number}
              </span>
              <div className="flex-1 h-px bg-[#E2E8F4]" />
            </div>

            {floor.rooms.map((room) => {
              const selectedType = INDOOR_TYPES.find((t) => t.value === room.indoorType);

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-[#F0F4FB] flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0057B8] bg-[#EBF3FF] px-2 py-0.5 rounded-md">
                      {floor.number}.{room.number}
                    </span>
                    <h3 className="text-sm font-semibold text-[#0D1626]">
                      {room.name} <span className="text-muted-foreground font-normal">— what is the type of indoor?</span>
                    </h3>
                  </div>

                  <div className="px-5 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-5">
                    <div className="flex flex-col gap-2">
                      {INDOOR_TYPES.map(({ value, label, description, icon: Icon, image, accent, bg }) => {
                        const selected = room.indoorType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setVRFRoomIndoorType(room.id, value)}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none ${
                              selected
                                ? "shadow-[0_0_0_3px_rgba(0,87,184,0.1)]"
                                : "border-[#E2E8F4] bg-white hover:border-[#B8D4F0] hover:bg-[#F8FBFF]"
                            }`}
                            style={
                              selected
                                ? { borderColor: accent, backgroundColor: bg }
                                : undefined
                            }
                          >
                            <div
                              className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl transition-all duration-150 overflow-hidden"
                              style={
                                image
                                  ? { backgroundColor: bg }
                                  : selected
                                  ? { backgroundColor: accent, color: "white" }
                                  : { backgroundColor: bg, color: accent }
                              }
                            >
                              {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={image} alt={label} className="w-8 h-8 object-contain" />
                              ) : Icon ? (
                                <Icon className="w-5 h-5" strokeWidth={1.75} />
                              ) : null}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className="text-[12px] font-semibold leading-tight"
                                style={{ color: selected ? accent : "#0D1626" }}
                              >
                                {label}
                              </p>
                            </div>

                            <div
                              className="w-4 h-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                              style={
                                selected
                                  ? { borderColor: accent, backgroundColor: accent }
                                  : { borderColor: "#CBD5E1", backgroundColor: "white" }
                              }
                            >
                              {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-[#E2E8F4] bg-[#F8FBFF] p-5">
                      {selectedType ? (() => {
                        const s = room.capacity && room.indoorType
                          ? computeIndoorSpecs(room.indoorType, room.capacity)
                          : null;
                        const specs: { label: string; value: string }[] = [
                          { label: "Model", value: s ? s.modelNumber : "—" },
                          {
                            label: "Total Cap.",
                            value: s
                              ? isMetric
                                ? `${round(btuhToKw(s.totalBtuh), 1)} kW`
                                : `${(s.totalBtuh / 1000).toFixed(0)}k Btu/h`
                              : "—",
                          },
                          {
                            label: "Sensible Cap.",
                            value: s
                              ? isMetric
                                ? `${round(btuhToKw(s.sensibleBtuh), 1)} kW`
                                : `${(s.sensibleBtuh / 1000).toFixed(0)}k Btu/h`
                              : "—",
                          },
                          { label: "Power", value: s ? `${s.powerKW} kW` : "—" },
                          {
                            label: "Airflow",
                            value: s
                              ? isMetric
                                ? `${round(cfmToM3h(s.airflowCFM), 0).toLocaleString()} m³/h`
                                : `${s.airflowCFM.toLocaleString()} CFM`
                              : "—",
                          },
                          {
                            label: "Leaving DB/WB",
                            value: s
                              ? isMetric
                                ? `${round(fToC(s.leavingDBF), 1)}°C / ${round(fToC(s.leavingWBF), 1)}°C`
                                : `${s.leavingDBF}°F / ${s.leavingWBF}°F`
                              : "—",
                          },
                        ];
                        return (
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8] mb-0.5">
                                {selectedType.label}
                              </p>
                              <p className="text-xs text-[#8894AB]">{selectedType.description}</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                              <div className="rounded-lg border-2 border-[#0057B8]/30 bg-white p-3 min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0057B8] truncate">
                                  Capacity <span className="text-destructive">*</span>
                                  <span className="text-[#8894AB] ml-1">(kBTU/h)</span>
                                </p>
                                <Select
                                  value={room.capacity ? String(room.capacity) : undefined}
                                  onValueChange={(v) => setVRFRoomCapacity(room.id, parseInt(v, 10))}
                                >
                                  <SelectTrigger
                                    id={`capacity-${room.id}`}
                                    className="mt-1 h-7 px-2 py-0 text-[13px] font-semibold bg-white border-[#B8D4F0] text-[#0D1626]"
                                  >
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedType.capacities.map((c) => (
                                      <SelectItem key={c} value={String(c)}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {specs.map((sp) => (
                                <div
                                  key={sp.label}
                                  className="rounded-lg border border-[#E2E8F4] bg-white p-3 min-w-0"
                                >
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB] truncate">
                                    {sp.label}
                                  </p>
                                  <p className="text-[13px] font-semibold text-[#0D1626] mt-1 truncate">
                                    {sp.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="h-full min-h-[140px] flex items-center justify-center text-center">
                          <p className="text-xs text-[#8894AB] max-w-[220px] leading-snug">
                            Select an indoor unit type on the left to configure its capacity.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      )}

      <div className="flex justify-end pt-6">
        <Button
          type="button"
          onClick={() => {
            if (view === "indoor") {
              setView("outdoor");
            } else {
              confirmVRFDesign();
            }
          }}
          disabled={!allConfigured}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function OutdoorPanel({
  totalCapacityKbtuh,
  totalCapacityTons,
  recommendedOutdoorTons,
  combinationRatio,
  indoorCount,
  isMetric,
}: {
  totalCapacityKbtuh: number;
  totalCapacityTons: number;
  recommendedOutdoorTons: number;
  combinationRatio: number;
  indoorCount: number;
  isMetric: boolean;
}) {
  const OUTDOOR_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48];
  const [selectionMode, setSelectionMode] = useState<"auto" | "manual">("auto");
  const [manualTons, setManualTons] = useState<number>(recommendedOutdoorTons);

  const effectiveTons = selectionMode === "auto" ? recommendedOutdoorTons : manualTons;
  const effectiveCombinationRatio =
    effectiveTons > 0 ? (totalCapacityTons / effectiveTons) * 100 : 0;
  const outdoorModel = `VRF-OU-${String(effectiveTons).padStart(3, "0")}`;
  const totalCapacityDisplay = isMetric
    ? `${round(btuhToKw(totalCapacityKbtuh * 1000), 1)} kW`
    : `${totalCapacityKbtuh.toFixed(0)} kBTU/h`;
  const effectiveCapacityDisplay = isMetric
    ? `${round(btuhToKw(effectiveTons * 12000), 1)} kW`
    : `${(effectiveTons * 12).toFixed(0)} kBTU/h`;
  const totalEer = Math.max(8, 11.8 - Math.abs(effectiveCombinationRatio - 100) * 0.02);
  const totalCop = totalEer / 3.412;
  const eerDisplayValue = isMetric ? totalCop.toFixed(2) : totalEer.toFixed(1);
  const eerDisplayUnit = isMetric ? "COP (W/W)" : "Btu/Wh";
  // suppress unused-var lint for prop we now derive locally
  void combinationRatio;

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 rounded-xl bg-[#F0F4FB] border border-[#E2E8F4]">
        <button
          type="button"
          onClick={() => setSelectionMode("auto")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            selectionMode === "auto"
              ? "bg-white text-[#B45309] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[#64748B] hover:text-[#0D1626]"
          }`}
        >
          <Sparkles className="w-4 h-4" strokeWidth={2} />
          Auto Selection
        </button>
        <button
          type="button"
          onClick={() => setSelectionMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            selectionMode === "manual"
              ? "bg-white text-[#B45309] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[#64748B] hover:text-[#0D1626]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
          Manual Selection
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-[#F0F4FB] flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#FEF4E6] text-[#B45309]">
            <Sun className="w-4 h-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#B45309]">Outdoor Condensing Unit</p>
            <h3 className="text-sm font-semibold text-[#0D1626]">
              {selectionMode === "auto"
                ? `Auto-sized from ${indoorCount} indoor unit${indoorCount === 1 ? "" : "s"}`
                : `Manually selected · ${indoorCount} indoor unit${indoorCount === 1 ? "" : "s"} connected`}
            </h3>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg border border-[#E2E8F4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">Total Indoor Load</p>
              <p className="text-[14px] font-bold text-[#0D1626] mt-1">{totalCapacityDisplay}</p>
              <p className="text-[11px] text-[#8894AB] mt-0.5">{round(totalCapacityTons, 1)} tons</p>
            </div>
            <div className="rounded-lg border-2 border-[#B45309]/30 bg-[#FEF8F0] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#B45309]">
                {selectionMode === "auto" ? "Recommended ODU" : "Selected ODU"}
              </p>
              <p className="text-[14px] font-bold text-[#0D1626] mt-1">{outdoorModel}</p>
              <p className="text-[11px] text-[#B45309] mt-0.5">{effectiveCapacityDisplay}</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">Combination Ratio</p>
              <p className="text-[14px] font-bold text-[#0D1626] mt-1">{effectiveCombinationRatio.toFixed(0)}%</p>
              <p className="text-[11px] text-[#8894AB] mt-0.5">
                {effectiveCombinationRatio > 130
                  ? "Over-connected"
                  : effectiveCombinationRatio < 50
                  ? "Under-connected"
                  : "Within range"}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E8F4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">Indoor Units</p>
              <p className="text-[14px] font-bold text-[#0D1626] mt-1">{indoorCount}</p>
              <p className="text-[11px] text-[#8894AB] mt-0.5">connected</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F4] bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">Total EER</p>
              <p className="text-[14px] font-bold text-[#0D1626] mt-1">{eerDisplayValue}</p>
              <p className="text-[11px] text-[#8894AB] mt-0.5">{eerDisplayUnit}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F0F4FB]">
            <div className="max-w-md">
              <Label className="text-xs font-semibold text-[#0D1626]">Outdoor Unit Model</Label>
              <Select
                value={String(effectiveTons)}
                onValueChange={(v) => setManualTons(parseInt(v, 10))}
                disabled={selectionMode === "auto"}
              >
                <SelectTrigger className="mt-1.5 bg-white border-[#B8D4F0] disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTDOOR_SIZES.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      VRF-OU-{String(t).padStart(3, "0")} · {t} tons
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-[#8894AB] mt-2 leading-snug">
                {selectionMode === "auto"
                  ? "Auto-sized to the smallest outdoor unit that covers the total indoor capacity. Switch to Manual to override."
                  : "Pick any outdoor unit size. Useful when you need headroom for future expansion or a specific model."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

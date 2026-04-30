"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Wrench,
  Zap,
  Snowflake,
  Cpu,
  Wind,
  ChevronDown,
  Sun,
  Home,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useOptions } from "@/hooks/useSelection";
import type { EquipmentOption } from "@/lib/mock-data/options";
import { PerformanceDataPanel } from "@/components/selection/PerformanceDataPanel";
import type { VRFIndoorType } from "@/types/selection";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; description: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  construction: {
    label: "Construction Options",
    description: "Structural and protective accessories",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  electrical: {
    label: "Electrical Options",
    description: "Power and electrical accessories",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  refrigeration: {
    label: "Refrigeration Options",
    description: "Refrigerant circuit accessories",
    icon: Snowflake,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  "air-side": {
    label: "Air Side Options",
    description: "Filtration, drive, and airflow accessories",
    icon: Wind,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  controls: {
    label: "Controls & BAS",
    description: "Building automation and monitoring",
    icon: Cpu,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
};

const INDOOR_PREFIX: Record<VRFIndoorType, string> = {
  "ducted-split-low-static": "DSL",
  "ducted-split-high-static": "DSH",
  "ducted-split-inverter": "DSI",
  cassette: "CAS",
  "wall-mounted": "WAL",
};

const INDOOR_NAME: Record<VRFIndoorType, string> = {
  "ducted-split-low-static": "Ducted Split — Low Static",
  "ducted-split-high-static": "Ducted Split — High Static",
  "ducted-split-inverter": "Ducted Split — Inverter",
  cassette: "Cassette",
  "wall-mounted": "Wall-Mounted",
};

export function OptionsConfigurator() {
  const {
    selectedGroup,
    selectedSeries,
    selectedModels,
    selectedOptions,
    designConditions,
    toggleOption,
    setStep,
    navigateBack,
  } = useSelectionStore();

  const isVRF = selectedGroup?.id === "vrf";
  const isChiller = selectedGroup?.id === "chiller";
  const optionsSeriesId = isVRF ? "vrf" : selectedSeries?.id ?? null;
  const { data: options, isLoading, isError } = useOptions(optionsSeriesId);

  const primaryModel = selectedModels[0] ?? null;
  const dc = designConditions as Record<string, number> | null;
  const designLwtF = dc?.leavingWaterTempF ?? null;
  const designAmbientF = dc?.ambientTempF ?? null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(5)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Options & Accessories</h2>
          <p className="text-muted-foreground text-sm">
            {isVRF
              ? "Configure options for the outdoor unit and each indoor unit"
              : `${selectedModels.map((m) => m.modelNumber).join(", ")} — Select additional options`}
          </p>
        </div>
      </div>

      {!isVRF && !isChiller && primaryModel && (
        <div className="mb-6">
          <PerformanceDataPanel
            model={primaryModel}
            designLcwtF={designLwtF}
            designAmbientF={designAmbientF}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <AlertCircle className="w-8 h-8 text-destructive/60" />
          <p className="text-sm">Failed to load options</p>
        </div>
      ) : isVRF ? (
        <VRFOptionsLayout options={options ?? []} />
      ) : (
        <FlatOptionsLayout
          options={options ?? []}
          selectedOptions={selectedOptions}
          onToggle={toggleOption}
        />
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={() => setStep(7)} className="bg-[#0057B8] hover:bg-[#0057B8]/90">
          Preview Submittal <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Non-VRF: flat list of options grouped by category (existing behavior).
   ────────────────────────────────────────────────────────────────────────── */
function FlatOptionsLayout({
  options,
  selectedOptions,
  onToggle,
}: {
  options: EquipmentOption[];
  selectedOptions: string[];
  onToggle: (id: string) => void;
}) {
  const grouped = options.reduce<Record<string, EquipmentOption[]>>((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});

  const selectedCount = selectedOptions.length;

  return (
    <div className="space-y-5">
      {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
        const catOptions = grouped[cat] ?? [];
        if (!catOptions.length) return null;
        const catSelectedCount = catOptions.filter((o) =>
          selectedOptions.includes(o.id),
        ).length;
        const Icon = config.icon;

        return (
          <div
            key={cat}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg ${config.bgColor}`}
              >
                <Icon className={`w-[18px] h-[18px] ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                  {catSelectedCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[11px] px-1.5 py-0 h-5 bg-[#0057B8]/10 text-[#0057B8] border-0"
                    >
                      {catSelectedCount} selected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>

            <div className="divide-y divide-border/40">
              {catOptions.map((opt) => {
                const isChecked = selectedOptions.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                      isChecked ? "bg-[#0057B8]/[0.04]" : "hover:bg-muted/30"
                    }`}
                    onClick={() => onToggle(opt.id)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggle(opt.id)}
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium ${
                          isChecked ? "text-[#0057B8]" : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#0057B8]/20 bg-[#0057B8]/[0.04]">
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">
              {selectedCount} option{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   VRF: per-unit option configuration. One card for the outdoor unit,
   one collapsible card per indoor unit (grouped by floor).
   ────────────────────────────────────────────────────────────────────────── */
function VRFOptionsLayout({ options }: { options: EquipmentOption[] }) {
  const {
    vrfLayout,
    selectedModels,
    vrfOptionsByUnit,
    toggleVRFUnitOption,
    applyVRFIndoorOptionsToAll,
  } = useSelectionStore();

  const oduOptions = options.filter((o) => o.vrfTarget === "odu");
  const iduOptions = options.filter((o) => o.vrfTarget === "idu");

  const oduModelNumber = selectedModels[0]?.modelNumber ?? "VRF Outdoor Unit";
  const oduTons = selectedModels[0]?.nominalTons ?? null;

  const indoorRooms =
    vrfLayout?.floors.flatMap((f) =>
      f.rooms
        .filter((r) => !!r.indoorType && !!r.capacity)
        .map((r) => ({
          roomId: r.id,
          roomName: r.name,
          roomNumber: r.number,
          floorId: f.id,
          floorNumber: f.number,
          indoorType: r.indoorType as VRFIndoorType,
          capacityKbtuh: r.capacity as number,
        })),
    ) ?? [];

  const indoorRoomIds = indoorRooms.map((r) => r.roomId);

  const oduSelected = vrfOptionsByUnit["odu"] ?? [];

  if (!vrfLayout || indoorRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <AlertCircle className="w-8 h-8 text-amber-500/70" />
        <p className="text-sm">No VRF layout configured. Go back to the design step.</p>
      </div>
    );
  }

  const grandTotal =
    oduSelected.length +
    indoorRoomIds.reduce(
      (sum, id) => sum + (vrfOptionsByUnit[id]?.length ?? 0),
      0,
    );

  return (
    <div className="space-y-6">
      {/* Outdoor unit */}
      <UnitOptionsCard
        accent="#B45309"
        bg="#FEF4E6"
        icon={Sun}
        eyebrow="Outdoor Unit"
        title={oduModelNumber}
        subtitle={oduTons ? `${oduTons} tons capacity` : undefined}
        options={oduOptions}
        selected={oduSelected}
        onToggle={(optId) => toggleVRFUnitOption("odu", optId)}
        defaultOpen
      />

      {/* Indoor units */}
      <IndoorUnitsSection
        indoorRooms={indoorRooms}
        iduOptions={iduOptions}
        vrfOptionsByUnit={vrfOptionsByUnit}
        onToggle={toggleVRFUnitOption}
        onApplyToAll={(sourceRoomId) =>
          applyVRFIndoorOptionsToAll(sourceRoomId, indoorRoomIds)
        }
      />

      {/* Grand-total footer */}
      {grandTotal > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#0057B8]/20 bg-[#0057B8]/[0.04]">
          <Check className="w-4 h-4 text-[#0057B8]" />
          <span className="text-sm font-semibold text-foreground">
            {grandTotal} option{grandTotal !== 1 ? "s" : ""} selected across the system
          </span>
        </div>
      )}
    </div>
  );
}

interface IndoorRoomMeta {
  roomId: string;
  roomName: string;
  roomNumber: number;
  floorId: string;
  floorNumber: number;
  indoorType: VRFIndoorType;
  capacityKbtuh: number;
}

function IndoorUnitsSection({
  indoorRooms,
  iduOptions,
  vrfOptionsByUnit,
  onToggle,
  onApplyToAll,
}: {
  indoorRooms: IndoorRoomMeta[];
  iduOptions: EquipmentOption[];
  vrfOptionsByUnit: Record<string, string[]>;
  onToggle: (unitKey: string, optionId: string) => void;
  onApplyToAll: (sourceRoomId: string) => void;
}) {
  const [applyJustFired, setApplyJustFired] = useState(false);

  // Default the "apply from" picker to the first indoor unit that has options selected,
  // so the most common intent (configure one room, copy to all) is one click.
  const firstWithSelections =
    indoorRooms.find((r) => (vrfOptionsByUnit[r.roomId]?.length ?? 0) > 0)?.roomId ??
    indoorRooms[0]?.roomId ??
    "";
  const [applySource, setApplySource] = useState(firstWithSelections);

  const sourceCount = (vrfOptionsByUnit[applySource]?.length ?? 0);

  // Group rooms by floor preserving original order
  const byFloor = new Map<string, IndoorRoomMeta[]>();
  for (const r of indoorRooms) {
    if (!byFloor.has(r.floorId)) byFloor.set(r.floorId, []);
    byFloor.get(r.floorId)!.push(r);
  }
  const floors = Array.from(byFloor.entries()).map(([floorId, rooms]) => ({
    floorId,
    floorNumber: rooms[0].floorNumber,
    rooms,
  }));

  const handleApply = () => {
    if (!applySource || sourceCount === 0) return;
    onApplyToAll(applySource);
    setApplyJustFired(true);
    setTimeout(() => setApplyJustFired(false), 1800);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-[#0057B8]" />
          <h3 className="text-sm font-bold text-foreground">
            Indoor Units{" "}
            <span className="text-muted-foreground font-normal">
              · {indoorRooms.length}
            </span>
          </h3>
        </div>

        {indoorRooms.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Apply options from
            </span>
            <Select value={applySource} onValueChange={setApplySource}>
              <SelectTrigger className="h-9 text-xs min-w-[180px] bg-white border-[#B8D4F0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {indoorRooms.map((r) => {
                  const count = vrfOptionsByUnit[r.roomId]?.length ?? 0;
                  return (
                    <SelectItem key={r.roomId} value={r.roomId}>
                      {r.roomName} · {count} selected
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleApply}
              disabled={sourceCount === 0}
              className="h-9 text-xs gap-1.5"
            >
              {applyJustFired ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Applied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Apply to all
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {floors.map((f) => (
          <div key={f.floorId} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8]">
                Floor {f.floorNumber}
              </span>
              <div className="flex-1 h-px bg-[#E2E8F4]" />
            </div>

            {f.rooms.map((r) => {
              const modelNumber = `${INDOOR_PREFIX[r.indoorType]}-${String(
                r.capacityKbtuh,
              ).padStart(3, "0")}`;
              const selected = vrfOptionsByUnit[r.roomId] ?? [];
              return (
                <UnitOptionsCard
                  key={r.roomId}
                  accent="#0057B8"
                  bg="#EBF3FF"
                  icon={Home}
                  eyebrow={`${r.roomName} · ${INDOOR_NAME[r.indoorType]}`}
                  title={modelNumber}
                  subtitle={`${r.capacityKbtuh} kBTU/h`}
                  options={iduOptions}
                  selected={selected}
                  onToggle={(optId) => onToggle(r.roomId, optId)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitOptionsCard({
  accent,
  bg,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  accent: string;
  bg: string;
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  subtitle?: string;
  options: EquipmentOption[];
  selected: string[];
  onToggle: (optionId: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const selectedCount = options.filter((o) => selected.includes(o.id)).length;

  const grouped = options.reduce<Record<string, EquipmentOption[]>>((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});

  return (
    <div
      className="rounded-2xl border bg-card overflow-hidden transition-shadow"
      style={{ borderColor: `${accent}33` }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/20"
      >
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{ backgroundColor: bg, color: accent }}
        >
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold tracking-[0.12em] uppercase truncate"
            style={{ color: accent }}
          >
            {eyebrow}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-sm font-bold text-foreground font-mono truncate">{title}</h3>
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate">· {subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedCount > 0 ? (
            <Badge
              variant="secondary"
              className="text-[11px] px-2 py-0 h-5 border-0"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              {selectedCount} selected
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">No options</span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-border/60">
          {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
            const catOptions = grouped[cat] ?? [];
            if (!catOptions.length) return null;
            const CatIcon = config.icon;
            return (
              <div key={cat} className="border-b border-border/40 last:border-b-0">
                <div className="flex items-center gap-2.5 px-5 py-2.5 bg-muted/15">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-md ${config.bgColor}`}
                  >
                    <CatIcon className={`w-3.5 h-3.5 ${config.color}`} />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {config.label}
                  </span>
                </div>
                <div className="divide-y divide-border/40">
                  {catOptions.map((opt) => {
                    const isChecked = selected.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                          isChecked ? "bg-[#0057B8]/[0.04]" : "hover:bg-muted/30"
                        }`}
                        onClick={() => onToggle(opt.id)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => onToggle(opt.id)}
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isChecked ? "text-[#0057B8]" : "text-foreground"
                            }`}
                          >
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

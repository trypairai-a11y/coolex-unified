"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  Info,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/components/selection/UnitToggle";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, round } from "@/lib/utils/unit-conversions";
import { VRF_OUTDOOR_SIZES, synthesizeVRFOutdoorModel } from "@/lib/utils/vrf";
import type { VRFIndoorType } from "@/types/selection";

const INDOOR_IMAGE: Record<VRFIndoorType, string> = {
  "ducted-split-low-static": "/images/vrf-ducted-split.png",
  "ducted-split-high-static": "/images/vrf-ducted-split.png",
  "ducted-split-inverter": "/images/vrf-ducted-split-inverter.png",
  cassette: "/images/vrf-cassette.png",
  "wall-mounted": "/images/vrf-wall-mounted.png",
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

const INDOOR_EER: Record<VRFIndoorType, number> = {
  "ducted-split-low-static": 11.5,
  "ducted-split-high-static": 11.0,
  "ducted-split-inverter": 12.5,
  cassette: 11.2,
  "wall-mounted": 11.6,
};

const PIPE_COLOR = "#0057B8";
const PIPE_STROKE = 2.75;
const FLOW_COLOR = "#7FBAFF";
const FLOW_STROKE = 3.5;

const ODU_W = 120;
const ODU_IMG_H = 104;
const ODU_LABEL_H = 52;
const ODU_BLOCK_H = ODU_IMG_H + ODU_LABEL_H;

const INDOOR_IMG_W = 96;
const INDOOR_IMG_H = 72;
const INDOOR_LABEL_H = 52;
const INDOOR_BLOCK_H = INDOOR_IMG_H + INDOOR_LABEL_H;

const HORIZ_PAD = 70;
const TOP_PAD = 24;
const BOTTOM_PAD = 40;

// Trunk sits on the left, ODU centered above it.
const TRUNK_X = HORIZ_PAD + ODU_W / 2;

const DEFAULT_MAIN_TRUNK_FT = 20;
const DEFAULT_FLOOR_GAP_FT = 14;
const DEFAULT_BRANCH_SEG_FT = 8;

// Visual scale — pixels per foot. Kept small so long trunks don't explode the canvas.
const V_PX_PER_FT = 4.5;
const H_PX_PER_FT = 11;
// Minimums leave enough clearance around each card so the branch line is visible
// between siblings (cards are centered vertically on the branch).
const MIN_V_PX = 90;
const MIN_H_PX = 140;

function vPx(ft: number) {
  return Math.max(MIN_V_PX, ft * V_PX_PER_FT);
}
function hPx(ft: number) {
  return Math.max(MIN_H_PX, ft * H_PX_PER_FT);
}

function ftToMeters(ft: number) {
  return ft * 0.3048;
}
function mToFt(m: number) {
  return m / 0.3048;
}
function formatLen(ft: number, isMetric: boolean) {
  if (isMetric) return `${ftToMeters(ft).toFixed(1)} m`;
  return `${ft.toFixed(1)} ft`;
}

function useLengthState<T extends string>(keys: T[], defaultFt: number) {
  const [map, setMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(keys.map((k) => [k, defaultFt]))
  );
  useEffect(() => {
    setMap((prev) => {
      const next: Record<string, number> = {};
      for (const k of keys) next[k] = prev[k] ?? defaultFt;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join("|"), defaultFt]);
  const setOne = (k: string, v: number) =>
    setMap((prev) => ({ ...prev, [k]: Math.max(0.5, v) }));
  return [map, setOne, setMap] as const;
}

interface FlattenedRoom {
  key: string;
  floorId: string;
  floorNumber: number;
  floorIndex: number;
  roomIndex: number; // index within the floor
  id: string;
  number: number;
  name: string;
  indoorType: VRFIndoorType;
  capacityKbtuh: number;
}

interface FloorLayout {
  floorId: string;
  floorNumber: number;
  floorIndex: number;
  y: number; // branch line y — also the vertical center of every card on this floor
  rooms: (FlattenedRoom & { x: number; cardTop: number })[];
  branchEndX: number;
}

export function VRFSystemDiagram() {
  const { vrfLayout, navigateBack, setStep, toggleModelSelection, selectedModels } =
    useSelectionStore();
  const unitSystem = useUnitStore((s) => s.unitSystem);
  const isMetric = unitSystem === "metric";

  const allRooms: FlattenedRoom[] = useMemo(() => {
    if (!vrfLayout) return [];
    const out: FlattenedRoom[] = [];
    vrfLayout.floors.forEach((f, fi) => {
      f.rooms.forEach((r, ri) => {
        if (!r.indoorType || !r.capacity) return;
        out.push({
          key: r.id,
          floorId: f.id,
          floorNumber: f.number,
          floorIndex: fi,
          roomIndex: ri,
          id: r.id,
          number: r.number,
          name: r.name,
          indoorType: r.indoorType,
          capacityKbtuh: r.capacity,
        });
      });
    });
    return out;
  }, [vrfLayout]);

  const totalKbtuh = allRooms.reduce((s, r) => s + r.capacityKbtuh, 0);
  const totalTons = totalKbtuh / 12;
  const oduTons =
    VRF_OUTDOOR_SIZES.find((s) => s >= totalTons) ?? VRF_OUTDOOR_SIZES[VRF_OUTDOOR_SIZES.length - 1];
  const oduModel = `VRF-OU-${String(oduTons).padStart(3, "0")}`;

  // Re-hydrate selectedModels if the ODU sizing changes (e.g. user went back
  // and added a room). Initial hydration happens in confirmVRFDesign so the
  // submittal step always has a model.
  useEffect(() => {
    if (allRooms.length === 0) return;
    const synth = synthesizeVRFOutdoorModel(oduTons);
    const current = selectedModels[0];
    if (!current || current.id !== synth.id) {
      toggleModelSelection(synth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oduTons, allRooms.length]);

  // Group by floor, preserving order
  const floorsData = useMemo(() => {
    const byFloor = new Map<string, FlattenedRoom[]>();
    const floorMeta = new Map<string, { number: number; index: number }>();
    allRooms.forEach((r) => {
      if (!byFloor.has(r.floorId)) {
        byFloor.set(r.floorId, []);
        floorMeta.set(r.floorId, { number: r.floorNumber, index: r.floorIndex });
      }
      byFloor.get(r.floorId)!.push(r);
    });
    const floors = [...byFloor.entries()].map(([floorId, rooms]) => ({
      floorId,
      floorNumber: floorMeta.get(floorId)!.number,
      floorIndex: floorMeta.get(floorId)!.index,
      rooms,
    }));
    floors.sort((a, b) => a.floorIndex - b.floorIndex);
    return floors;
  }, [allRooms]);

  // Pipe length state
  const [mainTrunkFt, setMainTrunkFt] = useState(DEFAULT_MAIN_TRUNK_FT);
  const floorSegKeys = floorsData.slice(1).map((f) => f.floorId);
  const [floorSegFt, setFloorSeg, setFloorSegAll] = useLengthState(
    floorSegKeys,
    DEFAULT_FLOOR_GAP_FT
  );

  // Every indoor unit has a horizontal branch segment: the first connects to the
  // trunk; subsequent ones connect to the previous sibling.
  const branchSegKeys = floorsData.flatMap((f) => f.rooms.map((r) => r.id));
  const [branchFt, setBranchFt, setBranchAll] = useLengthState(
    branchSegKeys,
    DEFAULT_BRANCH_SEG_FT
  );

  const resetLengths = () => {
    setMainTrunkFt(DEFAULT_MAIN_TRUNK_FT);
    setFloorSegAll((prev) => {
      const next: Record<string, number> = {};
      for (const k of Object.keys(prev)) next[k] = DEFAULT_FLOOR_GAP_FT;
      return next;
    });
    setBranchAll((prev) => {
      const next: Record<string, number> = {};
      for (const k of Object.keys(prev)) next[k] = DEFAULT_BRANCH_SEG_FT;
      return next;
    });
  };

  // Geometry — derived from live ft state so the diagram grows/shrinks as lengths change.
  const mainTrunkPx = vPx(mainTrunkFt);

  // Right-extension from trunk needed to fit every floor's branch + last unit.
  const widestExtentPx = useMemo(() => {
    return Math.max(
      ODU_W / 2 + 8, // ODU half-width sits to the right of trunk
      ...floorsData.map((f) => {
        const segSum = f.rooms
          .map((r) => hPx(branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT))
          .reduce((a, b) => a + b, 0);
        return segSum + INDOOR_IMG_W / 2;
      })
    );
  }, [floorsData, branchFt]);

  const canvasW = TRUNK_X + widestExtentPx + HORIZ_PAD;

  const floorLayouts: FloorLayout[] = useMemo(() => {
    const layouts: FloorLayout[] = [];
    // First floor branch sits below ODU. Cards are vertically centered on the branch,
    // so the visible trunk run from ODU bottom to firstBranchY equals mainTrunkPx
    // plus half a card so the first card doesn't crowd the ODU.
    let y = TOP_PAD + ODU_BLOCK_H + INDOOR_BLOCK_H / 2 + mainTrunkPx;
    floorsData.forEach((f, i) => {
      if (i > 0) {
        const prev = layouts[i - 1];
        const gapPx = vPx(floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT);
        // Leave gapPx of clear trunk between the bottom of the previous floor's
        // cards and the top of this floor's cards.
        y = prev.y + INDOOR_BLOCK_H + gapPx;
      }
      const segPxs = f.rooms.map((r) => hPx(branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT));
      let cursorX = TRUNK_X;
      const rooms = f.rooms.map((r, idx) => {
        cursorX += segPxs[idx];
        return {
          ...r,
          x: cursorX,
          cardTop: y - INDOOR_BLOCK_H / 2,
        };
      });
      layouts.push({
        floorId: f.floorId,
        floorNumber: f.floorNumber,
        floorIndex: f.floorIndex,
        y,
        rooms,
        branchEndX: cursorX,
      });
    });
    return layouts;
  }, [floorsData, mainTrunkPx, floorSegFt, branchFt]);

  const lastFloor = floorLayouts[floorLayouts.length - 1];
  const canvasH =
    (lastFloor
      ? lastFloor.y + INDOOR_BLOCK_H / 2
      : TOP_PAD + ODU_BLOCK_H) + BOTTOM_PAD;

  // Totals
  const totalPipeFt =
    mainTrunkFt +
    Object.values(floorSegFt).reduce((a, b) => a + b, 0) +
    Object.values(branchFt).reduce((a, b) => a + b, 0);

  if (!vrfLayout || allRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <p className="text-sm">No indoor units configured. Go back and complete the design step.</p>
        <Button variant="outline" size="sm" onClick={() => navigateBack(4)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Design
        </Button>
      </div>
    );
  }

  const oduBottomY = TOP_PAD + ODU_BLOCK_H;
  const firstBranchY = floorLayouts[0].y;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigateBack(4)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">System Layout</h2>
            <p className="text-muted-foreground text-sm">
              One outdoor unit ({oduModel}) serving {allRooms.length} indoor unit
              {allRooms.length === 1 ? "" : "s"} ·{" "}
              {isMetric ? `${round(btuhToKw(totalKbtuh * 1000), 1)} kW` : `${totalKbtuh} kBTU/h`}{" "}
              total cooling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetLengths}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset lengths
          </Button>
          <UnitToggle />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SummaryCard label="Outdoor Unit" value={oduModel} sub={`${oduTons} tons`} accent="#B45309" />
        <SummaryCard
          label="Indoor Units"
          value={String(allRooms.length)}
          sub={`across ${floorsData.length} floor${floorsData.length === 1 ? "" : "s"}`}
        />
        <SummaryCard
          label="Total Indoor Load"
          value={
            isMetric
              ? `${round(btuhToKw(totalKbtuh * 1000), 1)} kW`
              : `${totalKbtuh.toFixed(0)} kBTU/h`
          }
          sub={`${round(totalTons, 1)} tons`}
        />
        <SummaryCard
          label="Total Pipe Length"
          value={formatLen(totalPipeFt, isMetric)}
          sub="sum of all segments"
          accent={PIPE_COLOR}
        />
      </div>

      {/* Legend & how-to */}
      <div className="flex items-center gap-x-5 gap-y-2 mb-3 flex-wrap text-[11px] text-[#4A5568]">
        <LegendSwatch color="#FEF4E6" border="#B4530966" label="Outdoor unit (on roof)" />
        <LegendSwatch color="#EBF3FF" border="#0057B866" label="Indoor unit (in a room)" />
        <span className="inline-flex items-center gap-1.5">
          <span className="relative w-6 h-[3px] rounded-full bg-[#0057B8]">
            <span
              className="absolute inset-0 rounded-full pipe-flow"
              style={{
                background: `linear-gradient(90deg, transparent 0 35%, ${FLOW_COLOR} 45% 55%, transparent 65% 100%)`,
              }}
            />
          </span>
          Refrigerant piping
        </span>
        <span className="inline-flex items-center gap-1.5 ml-auto bg-[#EBF3FF] border border-[#B8D4F0] rounded-full px-2.5 py-1 text-[#0057B8] font-medium">
          <Info className="w-3.5 h-3.5" />
          Drag any length label to resize the pipe — or click it to type a value
        </span>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border border-[#E2E8F4] bg-[#F8FBFF] p-4 overflow-auto">
        <div
          className="relative mx-auto"
          style={{ width: canvasW, height: canvasH, minWidth: canvasW }}
        >
          {/* Pipes SVG */}
          <svg
            width={canvasW}
            height={canvasH}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="pipe-dot"
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="5"
                orient="auto"
              >
                <circle cx="5" cy="5" r="3" fill={PIPE_COLOR} />
              </marker>
            </defs>

            {/* Main trunk: from bottom of ODU down to the first floor's branch line. */}
            <Pipe
              x1={TRUNK_X}
              y1={oduBottomY}
              x2={TRUNK_X}
              y2={firstBranchY}
            />

            {/* Trunk between floors: from previous floor's branch line straight down
                to the next floor's branch line. The trunk runs entirely to the left
                of every card, so it's always visible as one continuous line. */}
            {floorLayouts.slice(1).map((f, i) => {
              const prev = floorLayouts[i];
              return (
                <Pipe
                  key={`trunk-${f.floorId}`}
                  x1={TRUNK_X}
                  y1={prev.y}
                  x2={TRUNK_X}
                  y2={f.y}
                />
              );
            })}

            {/* Per-floor horizontal branches — one continuous line from the trunk
                to the last indoor unit on the floor. Each card sits along this line. */}
            {floorLayouts.map((f) => (
              <g key={`floor-${f.floorId}`}>
                <Pipe
                  x1={TRUNK_X}
                  y1={f.y}
                  x2={f.branchEndX}
                  y2={f.y}
                />
                {/* Junction dot where trunk meets branch */}
                <circle cx={TRUNK_X} cy={f.y} r={4} fill={PIPE_COLOR} />
              </g>
            ))}
          </svg>

          {/* ODU card */}
          <UnitCard
            top={TOP_PAD}
            left={TRUNK_X - ODU_W / 2}
            width={ODU_W}
            imageH={ODU_IMG_H}
            labelH={ODU_LABEL_H}
            image="/images/vrf.png"
            title={oduModel}
            subtitle="Outdoor Unit"
            power={`${oduTons} tons capacity`}
            accent="#B45309"
            bg="#FEF4E6"
          />

          {/* Indoor cards */}
          {floorLayouts.flatMap((f) =>
            f.rooms.map((r) => {
              const eer = INDOOR_EER[r.indoorType];
              const power = round((r.capacityKbtuh * 1000) / eer / 1000, 1);
              const modelName = `${INDOOR_PREFIX[r.indoorType]}-${String(r.capacityKbtuh).padStart(3, "0")}`;
              const capDisplay = isMetric
                ? `${round(btuhToKw(r.capacityKbtuh * 1000), 1)} kW`
                : `${r.capacityKbtuh} kBTU/h`;
              return (
                <UnitCard
                  key={`card-${r.id}`}
                  top={r.cardTop}
                  left={r.x - INDOOR_IMG_W / 2}
                  width={INDOOR_IMG_W}
                  imageH={INDOOR_IMG_H}
                  labelH={INDOOR_LABEL_H}
                  image={INDOOR_IMAGE[r.indoorType]}
                  title={modelName}
                  subtitle={`${INDOOR_NAME[r.indoorType]} · ${capDisplay}`}
                  tag={`${r.name} · Floor ${f.floorNumber}`}
                  accent="#0057B8"
                  bg="#EBF3FF"
                  power={`Uses ${power} kW`}
                />
              );
            })
          )}

          {/* Editable length labels */}
          {/* Main trunk label — sits along the vertical trunk between ODU and floor 1 */}
          <PipeLabel
            cx={TRUNK_X}
            cy={(oduBottomY + firstBranchY) / 2}
            valueFt={mainTrunkFt}
            onChange={setMainTrunkFt}
            isMetric={isMetric}
            orientation="vertical"
            anchor="left"
          />

          {/* Between-floor trunk labels — placed midway along the trunk between adjacent floors */}
          {floorLayouts.slice(1).map((f, i) => {
            const prev = floorLayouts[i];
            return (
              <PipeLabel
                key={`lbl-trunk-${f.floorId}`}
                cx={TRUNK_X}
                cy={(prev.y + f.y) / 2}
                valueFt={floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT}
                onChange={(v) => setFloorSeg(f.floorId, v)}
                isMetric={isMetric}
                orientation="vertical"
                anchor="left"
              />
            );
          })}

          {/* Branch segment labels — one per indoor unit. The first connects from
              trunk to that unit; subsequent ones connect prev sibling to this unit. */}
          {floorLayouts.flatMap((f) =>
            f.rooms.map((r, idx) => {
              const prevX = idx === 0 ? TRUNK_X : f.rooms[idx - 1].x;
              return (
                <PipeLabel
                  key={`lbl-branch-${r.id}`}
                  cx={(prevX + r.x) / 2}
                  cy={f.y}
                  valueFt={branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT}
                  onChange={(v) => setBranchFt(r.id, v)}
                  isMetric={isMetric}
                  orientation="horizontal"
                />
              );
            })
          )}

          {/* Floor ribbon labels — placed just left of trunk at each branch line */}
          {floorLayouts.map((f) => (
            <div
              key={`floor-ribbon-${f.floorId}`}
              className="absolute text-[10px] font-bold tracking-[0.14em] uppercase text-[#0057B8] bg-white border border-[#B8D4F0] rounded-md px-2 py-0.5 shadow-sm"
              style={{ top: f.y - 10, left: 8 }}
            >
              Floor {f.floorNumber}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        Tip: the blue pipes show refrigerant flowing from the outdoor unit down to each room.
        Use <strong>Reset lengths</strong> to start over.
      </p>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => setStep(6)}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue with {oduModel} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function Pipe({
  x1,
  y1,
  x2,
  y2,
  flowFrom,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** For horizontal branch lines: x coordinate from which flow emanates outward in both directions. */
  flowFrom?: number;
}) {
  // Solid base — always rendered in a single stroke.
  const base = (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={PIPE_COLOR}
      strokeWidth={PIPE_STROKE}
    />
  );

  // Flow overlay — animated dashed stroke. Direction follows x1/y1 → x2/y2.
  // For branch lines we split into two halves so flow radiates outward from the trunk.
  const flow =
    flowFrom !== undefined && y1 === y2 ? (
      <>
        <line
          x1={flowFrom}
          y1={y1}
          x2={x1}
          y2={y2}
          stroke={FLOW_COLOR}
          strokeWidth={FLOW_STROKE}
          className="pipe-flow"
        />
        <line
          x1={flowFrom}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={FLOW_COLOR}
          strokeWidth={FLOW_STROKE}
          className="pipe-flow"
        />
      </>
    ) : (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={FLOW_COLOR}
        strokeWidth={FLOW_STROKE}
        className="pipe-flow"
      />
    );

  return (
    <>
      {base}
      {flow}
    </>
  );
}

function LegendSwatch({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-3.5 h-3.5 rounded-[3px] border"
        style={{ backgroundColor: color, borderColor: border }}
      />
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent = "#0D1626",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F4] bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">{label}</p>
      <p className="text-[15px] font-bold mt-1 truncate" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#8894AB] mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function UnitCard({
  top,
  left,
  width,
  imageH,
  labelH,
  image,
  title,
  subtitle,
  tag,
  accent,
  bg,
  power,
}: {
  top: number;
  left: number;
  width: number;
  imageH: number;
  labelH: number;
  image: string;
  title: string;
  subtitle: string;
  tag?: string;
  accent: string;
  bg: string;
  power?: string;
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ top, left, width }}
    >
      <div
        className="flex items-center justify-center rounded-xl border"
        style={{
          width,
          height: imageH,
          backgroundColor: bg,
          borderColor: `${accent}33`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="object-contain"
          style={{ maxWidth: width - 12, maxHeight: imageH - 8 }}
        />
      </div>
      <div
        className="w-full text-center mt-1 px-1"
        style={{ height: labelH }}
      >
        <p
          className="text-[11px] font-bold leading-tight truncate"
          style={{ color: accent }}
        >
          {title}
        </p>
        <p className="text-[10px] text-[#64748B] leading-tight truncate">{subtitle}</p>
        {power && (
          <p className="text-[9px] text-[#8894AB] leading-tight truncate">{power}</p>
        )}
        {tag && (
          <p className="text-[9px] text-[#8894AB] leading-tight truncate">{tag}</p>
        )}
      </div>
    </div>
  );
}

function PipeLabel({
  cx,
  cy,
  valueFt,
  onChange,
  isMetric,
  orientation,
  anchor = "center",
}: {
  cx: number;
  cy: number;
  valueFt: number;
  onChange: (ft: number) => void;
  isMetric: boolean;
  orientation: "vertical" | "horizontal";
  anchor?: "center" | "left";
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = formatLen(valueFt, isMetric);
  const width = 82;
  const height = 24;

  const left =
    anchor === "left"
      ? cx + 6
      : orientation === "vertical"
      ? cx - width - 8
      : cx - width / 2;
  const top = cy - height / 2;

  const startEdit = () => {
    const v = isMetric ? ftToMeters(valueFt) : valueFt;
    setDraft(v.toFixed(1));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!Number.isNaN(parsed) && parsed > 0) {
      onChange(isMetric ? mToFt(parsed) : parsed);
    }
    setEditing(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Primary button only; ignore right-click etc.
    if (e.button !== 0) return;
    e.preventDefault();
    const startClient = orientation === "vertical" ? e.clientY : e.clientX;
    const startFt = valueFt;
    const pxPerFt = orientation === "vertical" ? V_PX_PER_FT : H_PX_PER_FT;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const current = orientation === "vertical" ? ev.clientY : ev.clientX;
      const deltaPx = current - startClient;
      if (!moved && Math.abs(deltaPx) > 3) {
        moved = true;
        setDragging(true);
      }
      if (moved) {
        const nextFt = Math.max(0.5, startFt + deltaPx / pxPerFt);
        onChange(Math.round(nextFt * 2) / 2); // snap to 0.5 ft
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved) startEdit();
      setDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const cursorClass =
    orientation === "vertical" ? "cursor-ns-resize" : "cursor-ew-resize";

  return (
    <div
      className="absolute select-none"
      style={{ left, top, width, height, pointerEvents: "auto" }}
    >
      {editing ? (
        <div className="flex items-center gap-0.5 bg-white border border-[#0057B8] rounded shadow-sm h-full px-1">
          <input
            ref={inputRef}
            type="number"
            step="0.5"
            min="0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full text-[11px] font-semibold text-[#0057B8] bg-transparent outline-none"
          />
          <span className="text-[10px] text-[#8894AB] pr-0.5">{isMetric ? "m" : "ft"}</span>
        </div>
      ) : (
        <button
          type="button"
          onPointerDown={handlePointerDown}
          className={`w-full h-full flex items-center justify-center gap-1 rounded-md bg-white border text-[11px] font-semibold text-[#0057B8] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${cursorClass} ${
            dragging
              ? "border-[#0057B8] bg-[#EBF3FF] ring-2 ring-[#0057B8]/20"
              : "border-[#B8D4F0] hover:border-[#0057B8] hover:bg-[#EBF3FF]"
          }`}
          title="Drag to resize — or click to type an exact length"
        >
          {orientation === "vertical" ? (
            <ArrowUpDown className="w-3 h-3 text-[#7FA5D4]" />
          ) : (
            <ArrowLeftRight className="w-3 h-3 text-[#7FA5D4]" />
          )}
          {display}
        </button>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  Check,
  Download,
  Info,
  Move,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/components/selection/UnitToggle";
import { cn } from "@/lib/utils";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, round } from "@/lib/utils/unit-conversions";
import {
  pickVRFOutdoorCombination,
  synthesizeVRFOutdoorModels,
  vrfCombinedCapacityKbtuh,
  vrfModuleLoadSplitKbtuh,
  vrfOutdoorUnitsFromCodes,
} from "@/lib/utils/vrf";
import { evaluateVRFPiping } from "@/lib/utils/vrf-piping";
import type { PipeSize } from "@/lib/utils/vrf-piping";
import { VRFPipingCompliance } from "@/components/selection/VRFPipingCompliance";
import { getVRFIndoorModelNumber } from "@/lib/mock-data/vrf-indoor";
import type {
  VRFCanvasPos,
  VRFCustomPipe,
  VRFIndoorType,
  VRFPipeEndpoint,
  VRFUnitId,
} from "@/types/selection";
import { floorRooms } from "@/types/selection";

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

const PIPE_COLOR = "#0057B8";
const PIPE_STROKE = 2.75;
const FLOW_COLOR = "#7FBAFF";
const FLOW_STROKE = 3.5;

const ODU_W = 120;
const ODU_IMG_H = 104;
const ODU_LABEL_H = 52;
const ODU_BLOCK_H = ODU_IMG_H + ODU_LABEL_H;
// Clear space between two manifolded outdoor modules, and the drop from their
// card bottoms to the header that joins them onto the single trunk.
const ODU_GAP = 28;
const ODU_HEADER_DROP = 26;

// Outdoor branch joints are lettered M, N, O in the piping guide — one per
// module tied into the header past the first, so three cover the four-module max.
const OUTDOOR_JOINT_TAGS = ["M", "N", "O"];

const INDOOR_IMG_W = 96;
const INDOOR_IMG_H = 72;
const INDOOR_LABEL_H = 52;
const INDOOR_BLOCK_H = INDOOR_IMG_H + INDOOR_LABEL_H;

const HORIZ_PAD = 70;
const TOP_PAD = 24;
const BOTTOM_PAD = 40;

// The canvas only scrolls into positive coordinates, so a unit released above
// y=0 would be clipped out of reach. Drags clamp to this floor instead.
const MIN_UNIT_Y = 0;

const EMPTY_LEN_MAP: Readonly<Record<string, number>> = Object.freeze({});

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

// Distance from a unit's anchor to the refnet marker on its outgoing branch —
// the center of the clear band between two side-by-side cards.
const JOINT_GAP_OFFSET_PX = INDOOR_IMG_W / 2 + (MIN_H_PX - INDOOR_IMG_W) / 2;

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

/** Compact suction · liquid outer-diameter label for a pipe segment. Diameters
 *  come from the piping guide's sizing tables (always mm, per Section 4.4) and
 *  are independent of the imperial/metric length toggle. */
function formatDiameter(size: PipeSize | undefined): string | null {
  if (!size) return null;
  const trim = (mm: number) => mm.toFixed(2).replace(/\.?0+$/, "");
  const suction = size.gasMm != null ? trim(size.gasMm) : null;
  const liq = size.liquidMm != null ? trim(size.liquidMm) : null;
  if (suction == null && liq == null) return null;
  return `⌀ S ${suction ?? "—"} · L ${liq ?? "—"} mm`;
}

/** Custom-pipe length follows the on-canvas distance between the two unit anchors.
 *  Manhattan rather than Euclidean: refrigerant pipes route along axes (vertical
 *  riser + horizontal run), and we want it to match the rest of the diagram which
 *  uses different px-per-ft for V vs H. */
function computeManhattanFt(a: VRFCanvasPos, b: VRFCanvasPos): number {
  const dxFt = Math.abs(b.x - a.x) / H_PX_PER_FT;
  const dyFt = Math.abs(b.y - a.y) / V_PX_PER_FT;
  return Math.round((dxFt + dyFt) * 2) / 2; // snap to 0.5 ft
}

/** Walk `dist` px along a polyline from its first point and return where you land.
 *  Used to park a refnet marker on the pipe just clear of the card it branches at,
 *  following the same right-angle route the pipe itself takes. Falls back to the
 *  last point when the polyline is shorter than `dist`. */
function pointAlongPolyline(pts: VRFCanvasPos[], dist: number): VRFCanvasPos {
  let remaining = dist;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) continue;
    if (remaining <= len) {
      const t = remaining / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= len;
  }
  return pts[pts.length - 1];
}

/** Migrate legacy unit-only pipes (fromUnitId/toUnitId) to the endpoint model. */
function pipeEndpoints(p: VRFCustomPipe): { from: VRFPipeEndpoint; to: VRFPipeEndpoint } {
  const from = p.from ?? { kind: "unit" as const, unitId: p.fromUnitId! };
  const to = p.to ?? { kind: "unit" as const, unitId: p.toUnitId! };
  return { from, to };
}

interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Closest point on segment `s` to point `p`, plus the squared distance to it. */
function closestOnSeg(p: VRFCanvasPos, s: Seg): { point: VRFCanvasPos; distSq: number } {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.x1) * dx + (p.y - s.y1) * dy) / lenSq));
  const point = { x: s.x1 + t * dx, y: s.y1 + t * dy };
  const ddx = p.x - point.x;
  const ddy = p.y - point.y;
  return { point, distSq: ddx * ddx + ddy * ddy };
}

// Click within this many px of a pipe line snaps onto it. Generous enough that a
// pipe stays an easy target at the ~2px stroke it's drawn with.
const PIPE_SNAP_PX = 20;

// Click within this many px of a unit's anchor binds the endpoint to that unit
// rather than pinning a free point. Wider than PIPE_SNAP_PX and checked first,
// so a click aimed at a unit doesn't get captured by the branch pipe running
// into it — that would leave an endpoint that looks attached but can't follow
// the unit when it's dragged.
const UNIT_SNAP_PX = 28;

// Vertical gap between a zone ribbon and the top of its leftmost card.
const ZONE_RIBBON_OFFSET_Y = 24;

interface FlattenedRoom {
  key: string;
  floorId: string;
  floorNumber: number;
  floorIndex: number;
  roomIndex: number; // index within the floor
  zoneId: string | null; // null for legacy layouts persisted before zones existed
  zoneNumber: number;
  zoneName: string;
  id: string;
  number: number;
  name: string;
  indoorType: VRFIndoorType;
  capacityKbtuh: number;
}

/** A zone ribbon: one label per zone that has at least one live room on a floor. */
interface ZoneRibbon {
  zoneId: string;
  zoneNumber: number;
  zoneName: string;
  floorId: string;
  /** Auto position — top-left, just above the zone's leftmost card. */
  auto: VRFCanvasPos;
}

interface FloorLayout {
  floorId: string;
  floorNumber: number;
  floorIndex: number;
  y: number; // branch line y — also the vertical center of every card on this floor
  rooms: (FlattenedRoom & { x: number; cardTop: number })[];
  branchEndX: number;
}

/** One physical trunk segment (main trunk or an inter-floor riser). */
interface TrunkSeg {
  id: string;
  ft: number;
  setFt: (v: number) => void;
  yTop: number;
  yBot: number;
}

/** A run of one or more trunk segments rendered as a single continuous pipe.
 *  Consecutive segments merge into one run when the floor junction between them
 *  has no live branch, so an empty floor doesn't split the riser into two pipes. */
interface TrunkRun {
  segs: TrunkSeg[];
  yTop: number;
  yBot: number;
}

export function VRFSystemDiagram() {
  const {
    vrfLayout,
    navigateBack,
    setStep,
    setVRFMainTrunkFt,
    setVRFFloorSegFt,
    setVRFBranchFt,
    setVRFUnitPosition,
    setVRFLabelPosition,
    addVRFCustomPipe,
    removeVRFCustomPipe,
    deleteVRFAutoPipe,
    restoreAllVRFAutoPipes,
    resetVRFLayout,
  } = useSelectionStore();
  const unitSystem = useUnitStore((s) => s.unitSystem);
  const isMetric = unitSystem === "metric";

  // Custom-pipe authoring state. The start endpoint can be a unit or a free
  // point picked anywhere on the canvas (including off an existing pipe line).
  const [addPipeMode, setAddPipeMode] = useState(false);
  const [pendingPipeStart, setPendingPipeStart] = useState<VRFPipeEndpoint | null>(null);
  // Live pointer position (canvas coords) while sketching a pipe — drives the
  // dashed preview line from the chosen start anchor to the cursor.
  const [pipePointer, setPipePointer] = useState<VRFCanvasPos | null>(null);
  // Live drag preview — keyed map so a single drag can move multiple selected
  // units simultaneously. null when nothing is being dragged.
  const [dragPreview, setDragPreview] = useState<Map<VRFUnitId, VRFCanvasPos> | null>(null);
  // Live ribbon drag — only one label moves at a time.
  const [labelDrag, setLabelDrag] = useState<{ id: string; pos: VRFCanvasPos } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Multi-select state. `selectedIds` are the units currently highlighted; a
  // grab on any of them drags the whole set. `marquee` is the live selection
  // rectangle drawn while the user is sweeping the canvas.
  const [selectedIds, setSelectedIds] = useState<Set<VRFUnitId>>(() => new Set());
  const [marquee, setMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Layout edits auto-persist to localStorage via the store's persist
  // middleware; the Save button just flushes state and confirms to the user.
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(() => {
    // Every layout edit is already written to localStorage by the store's
    // persist middleware, so there is nothing to flush here — just flash a
    // short-lived confirmation so the user knows their work is saved.
    setJustSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 2000);
  }, []);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const exitAddPipeMode = useCallback(() => {
    setAddPipeMode(false);
    setPendingPipeStart(null);
    setPipePointer(null);
  }, []);

  /** Double-clicking a unit starts a pipe from it — the shortcut for entering
   *  add-pipe mode and picking the start anchor in one gesture. The next click
   *  (unit, pipe, or empty canvas) closes the run. */
  const startPipeFromUnit = useCallback((id: VRFUnitId) => {
    setSelectedIds(new Set());
    setAddPipeMode(true);
    setPendingPipeStart({ kind: "unit", unitId: id });
    setPipePointer(null);
  }, []);

  // Esc cancels add-pipe mode.
  useEffect(() => {
    if (!addPipeMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitAddPipeMode();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addPipeMode, exitAddPipeMode]);

  // Esc clears the multi-selection.
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIds(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds.size]);

  const allRooms: FlattenedRoom[] = useMemo(() => {
    if (!vrfLayout) return [];
    const out: FlattenedRoom[] = [];
    vrfLayout.floors.forEach((f, fi) => {
      // Walk zone-by-zone so each room keeps the zone it belongs to. Legacy
      // layouts (rooms directly on the floor) get a single synthetic zone with
      // no id, which suppresses their ribbon.
      const zones = f.zones ?? [
        { id: "", number: 1, name: "", rooms: floorRooms(f) },
      ];
      let ri = 0;
      zones.forEach((z) => {
        z.rooms.forEach((r) => {
          if (!r.indoorType || !r.capacity) return;
          out.push({
            key: r.id,
            floorId: f.id,
            floorNumber: f.number,
            floorIndex: fi,
            roomIndex: ri++,
            zoneId: z.id || null,
            zoneNumber: z.number,
            zoneName: z.name,
            id: r.id,
            number: r.number,
            name: r.name,
            indoorType: r.indoorType,
            capacityKbtuh: r.capacity,
          });
        });
      });
    });
    return out;
  }, [vrfLayout]);

  const totalKbtuh = allRooms.reduce((s, r) => s + r.capacityKbtuh, 0);
  const totalTons = totalKbtuh / 12;
  // The design step persists the chosen module(s) on the layout; fall back to
  // auto-sizing if the user jumped straight here. Multiple modules manifold into one
  // system: they share the trunk, and each carries a share of the indoor load in
  // proportion to its capacity.
  const oduUnits = useMemo(() => {
    const stored = vrfOutdoorUnitsFromCodes(vrfLayout?.outdoorCodes ?? []);
    return stored.length > 0 ? stored : pickVRFOutdoorCombination(totalKbtuh);
  }, [vrfLayout?.outdoorCodes, totalKbtuh]);
  const isCombinedOdu = oduUnits.length > 1;
  const oduGroupW = oduUnits.length * ODU_W + (oduUnits.length - 1) * ODU_GAP;
  // The trunk leaves the header carrying the whole system, so piping sizes off
  // the combined capacity rather than any one module's.
  const oduTons = vrfCombinedCapacityKbtuh(oduUnits) / 12;
  const oduModel = oduUnits.map((u) => u.modelNumber).join(" + ");
  const oduModuleLoads = vrfModuleLoadSplitKbtuh(totalKbtuh, oduUnits);

  // Re-hydrate selectedModels if the ODU sizing changes (e.g. user went back
  // and added a room). Initial hydration happens in confirmVRFDesign so the
  // submittal step always has a model.
  useEffect(() => {
    if (allRooms.length === 0) return;
    const synth = synthesizeVRFOutdoorModels(oduUnits);
    const current = useSelectionStore.getState().selectedModels;
    const same =
      current.length === synth.length && synth.every((m, i) => current[i]?.id === m.id);
    if (!same) useSelectionStore.setState({ selectedModels: synth });
  }, [oduUnits, allRooms.length]);

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

  // Pipe lengths are persisted on `vrfLayout` so they survive the wizard session
  // and carry through to new revisions. Defaults apply only when the field is
  // unset (initial design or after Reset lengths).
  const mainTrunkFt = vrfLayout?.mainTrunkFt ?? DEFAULT_MAIN_TRUNK_FT;
  const floorSegFt = vrfLayout?.floorSegFtById ?? EMPTY_LEN_MAP;
  const branchFt = vrfLayout?.branchFtById ?? EMPTY_LEN_MAP;

  const setMainTrunkFt = (v: number) => setVRFMainTrunkFt(Math.max(0.5, v));
  const setFloorSeg = (floorId: string, v: number) =>
    setVRFFloorSegFt(floorId, Math.max(0.5, v));
  const setBranchFtFor = (roomId: string, v: number) =>
    setVRFBranchFt(roomId, Math.max(0.5, v));
  const resetLayout = () => {
    resetVRFLayout();
    exitAddPipeMode();
  };

  const unitPositions = vrfLayout?.unitPositions;
  const customPipes = useMemo<VRFCustomPipe[]>(
    () => vrfLayout?.customPipes ?? [],
    [vrfLayout?.customPipes]
  );

  // Auto-pipe id helpers — keep ID generation co-located with the deletion check
  // so renderers and length-totals stay in sync.
  const MAIN_TRUNK_ID = "auto-trunk-main";
  const trunkSegId = (floorId: string) => `auto-trunk-floor-${floorId}`;
  const branchSegId = (roomId: string) => `auto-branch-${roomId}`;

  const deletedAuto = useMemo(
    () => new Set(vrfLayout?.deletedAutoPipeIds ?? []),
    [vrfLayout?.deletedAutoPipeIds]
  );
  const isDeleted = useCallback((id: string) => deletedAuto.has(id), [deletedAuto]);

  // Geometry — derived from live ft state so the diagram grows/shrinks as lengths change.
  const mainTrunkPx = vPx(mainTrunkFt);

  // ODU position drives the whole layout: the trunk riser and the entire branch
  // network anchor to `dynamicTrunkX`, so dragging the ODU slides everything as a
  // group and the riser never detaches from the branches. Computed here (before
  // `floorLayouts`) straight from the drag/stored/auto sources — it depends only
  // on the ODU, not the indoor layout, which keeps the dependency graph acyclic.
  // Clamped so the system can't be dragged left past its home position (off the
  // canvas); rightward drags grow the canvas instead.
  const oduPreview = dragPreview?.get("odu");
  const { dynamicTrunkX, oduTopLeftLive, oduBottomLive } = useMemo(() => {
    const rawOduX = oduPreview?.x ?? unitPositions?.odu?.x ?? TRUNK_X - ODU_W / 2;
    const rawOduY = oduPreview?.y ?? unitPositions?.odu?.y ?? TOP_PAD;
    const trunkX = Math.max(TRUNK_X, rawOduX + ODU_W / 2);
    const tl = { x: trunkX - ODU_W / 2, y: Math.max(MIN_UNIT_Y, rawOduY) };
    return {
      dynamicTrunkX: trunkX,
      oduTopLeftLive: tl,
      // With a manifolded bank the trunk starts below the header that joins them, so
      // the header has clear space between the card bottoms and the riser.
      oduBottomLive: tl.y + ODU_BLOCK_H + (isCombinedOdu ? ODU_HEADER_DROP : 0),
    };
  }, [oduPreview, unitPositions?.odu, isCombinedOdu]);

  // Right-extension from trunk needed to fit every floor's branch + last unit.
  const widestExtentPx = useMemo(() => {
    return Math.max(
      // The outdoor group hangs to the right of the trunk, which is centered on
      // its first module.
      oduGroupW - ODU_W / 2 + 8,
      ...floorsData.map((f) => {
        const segSum = f.rooms
          .map((r) => hPx(branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT))
          .reduce((a, b) => a + b, 0);
        return segSum + INDOOR_IMG_W / 2;
      })
    );
  }, [floorsData, branchFt, oduGroupW]);

  // Anchored at the live trunk x so the canvas grows to the right as the system
  // is dragged rightward (and stays put when clamped at its left-edge home).
  const canvasW = dynamicTrunkX + widestExtentPx + HORIZ_PAD;

  const floorLayouts: FloorLayout[] = useMemo(() => {
    const layouts: FloorLayout[] = [];
    // First floor branch sits below ODU. Cards are vertically centered on the branch,
    // so the visible trunk run from ODU bottom to firstBranchY equals mainTrunkPx
    // plus half a card so the first card doesn't crowd the ODU.
    let y =
      TOP_PAD +
      ODU_BLOCK_H +
      (isCombinedOdu ? ODU_HEADER_DROP : 0) +
      INDOOR_BLOCK_H / 2 +
      mainTrunkPx;
    floorsData.forEach((f, i) => {
      if (i > 0) {
        const prev = layouts[i - 1];
        const gapPx = vPx(floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT);
        // Leave gapPx of clear trunk between the bottom of the previous floor's
        // cards and the top of this floor's cards.
        y = prev.y + INDOOR_BLOCK_H + gapPx;
      }
      const segPxs = f.rooms.map((r) => hPx(branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT));
      // Branch row starts at the live trunk x so the whole network follows the ODU.
      let cursorX = dynamicTrunkX;
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
  }, [floorsData, mainTrunkPx, floorSegFt, branchFt, dynamicTrunkX, isCombinedOdu]);

  const lastFloor = floorLayouts[floorLayouts.length - 1];
  const canvasH =
    (lastFloor
      ? lastFloor.y + INDOOR_BLOCK_H / 2
      : TOP_PAD + ODU_BLOCK_H + (isCombinedOdu ? ODU_HEADER_DROP : 0)) + BOTTOM_PAD;

  // Auto top-left positions for every unit. The override layer (drag) is applied
  // in `getUnitTopLeft` so resolution always picks the freshest source.
  const autoTopLeft = useMemo(() => {
    const m = new Map<VRFUnitId, VRFCanvasPos>();
    m.set("odu", { x: TRUNK_X - ODU_W / 2, y: TOP_PAD });
    floorLayouts.forEach((f) =>
      f.rooms.forEach((r) =>
        m.set(r.id, { x: r.x - INDOOR_IMG_W / 2, y: r.cardTop })
      )
    );
    return m;
  }, [floorLayouts]);

  const getUnitTopLeft = useCallback(
    (id: VRFUnitId): VRFCanvasPos => {
      const auto = autoTopLeft.get(id) ?? { x: 0, y: 0 };
      // The ODU drags freely; its live (clamped) position is derived above and
      // also anchors the trunk + branch network, so they move together.
      if (id === "odu") {
        return oduTopLeftLive;
      }
      // Indoor units move freely in both axes. While dragging, follow the live
      // pointer. Once released, horizontal position is driven by the branch length
      // (auto.x, which also responds to label edits and sibling shifts) and the
      // vertical position honors a stored override so a unit can be lifted or
      // dropped off its floor's branch line. Either way the branch pipe rebends to
      // a right angle to reach it, so segments stay axis-aligned (90°).
      const preview = dragPreview?.get(id);
      if (preview) return { x: preview.x, y: Math.max(MIN_UNIT_Y, preview.y) };
      const stored = unitPositions?.[id];
      if (stored) return { x: auto.x, y: Math.max(MIN_UNIT_Y, stored.y) };
      return auto;
    },
    [dragPreview, unitPositions, autoTopLeft, oduTopLeftLive]
  );

  // Zone ribbons — one per zone that still has live rooms on a floor. The auto
  // position sits just above the zone's leftmost card and follows it as the card
  // moves, until the user drags the ribbon somewhere of their own.
  const zoneRibbons: ZoneRibbon[] = useMemo(() => {
    const byZone = new Map<string, ZoneRibbon>();
    floorLayouts.forEach((f) =>
      f.rooms.forEach((r) => {
        if (!r.zoneId) return;
        const tl = getUnitTopLeft(r.id);
        const existing = byZone.get(r.zoneId);
        if (!existing) {
          byZone.set(r.zoneId, {
            zoneId: r.zoneId,
            zoneNumber: r.zoneNumber,
            zoneName: r.zoneName,
            floorId: r.floorId,
            auto: { x: tl.x, y: tl.y - ZONE_RIBBON_OFFSET_Y },
          });
        } else {
          existing.auto = {
            x: Math.min(existing.auto.x, tl.x),
            y: Math.min(existing.auto.y, tl.y - ZONE_RIBBON_OFFSET_Y),
          };
        }
      })
    );
    return [...byZone.values()];
  }, [floorLayouts, getUnitTopLeft]);

  // Ribbon drag — same commit-on-release shape as unit drags, but positions live
  // in `labelPositions` so they survive the session and clear on Reset layout.
  const labelPositions = vrfLayout?.labelPositions;
  // Floor ribbons store an absolute canvas position — their anchor never moves.
  // Zone ribbons (`relative`) store an offset from `auto` instead, so a dragged
  // ribbon keeps the spacing the user chose while still following its cards.
  const getLabelPos = useCallback(
    (labelId: string, auto: VRFCanvasPos, relative = false): VRFCanvasPos => {
      if (labelDrag?.id === labelId) return labelDrag.pos;
      const stored = labelPositions?.[labelId];
      if (!stored) return auto;
      return relative ? { x: auto.x + stored.x, y: auto.y + stored.y } : stored;
    },
    [labelDrag, labelPositions]
  );

  const beginLabelDrag = useCallback(
    (labelId: string, auto: VRFCanvasPos, e: React.PointerEvent, relative = false) => {
      if (addPipeMode) return;
      e.stopPropagation();
      e.preventDefault();
      const start = getLabelPos(labelId, auto, relative);
      const originX = e.clientX;
      const originY = e.clientY;
      let last = start;
      const onMove = (ev: PointerEvent) => {
        last = {
          x: Math.max(0, start.x + (ev.clientX - originX)),
          y: Math.max(0, start.y + (ev.clientY - originY)),
        };
        setLabelDrag({ id: labelId, pos: last });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setLabelDrag(null);
        setVRFLabelPosition(
          labelId,
          relative ? { x: last.x - auto.x, y: last.y - auto.y } : last
        );
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [addPipeMode, getLabelPos, setVRFLabelPosition]
  );

  /** Anchor used as a pipe endpoint. ODU attaches at the bottom of its card; indoor units at the card center. */
  const getUnitAnchor = useCallback(
    (id: VRFUnitId): VRFCanvasPos => {
      const tl = getUnitTopLeft(id);
      if (id === "odu") {
        return { x: tl.x + ODU_W / 2, y: tl.y + ODU_BLOCK_H };
      }
      return {
        x: tl.x + INDOOR_IMG_W / 2,
        y: tl.y + INDOOR_BLOCK_H / 2,
      };
    },
    [getUnitTopLeft]
  );

  /** Canvas position of any pipe endpoint — unit anchor or pinned free point. */
  const resolveEndpoint = useCallback(
    (ep: VRFPipeEndpoint): VRFCanvasPos =>
      ep.kind === "unit" ? getUnitAnchor(ep.unitId) : { x: ep.x, y: ep.y },
    [getUnitAnchor]
  );

  // Live-derived geometry for custom pipes. Length tracks the actual distance
  // between unit anchors, so dragging either endpoint updates the number on the
  // pipe label and the total in the summary strip in real time.
  const liveCustomPipes = useMemo(
    () =>
      customPipes.map((p) => {
        const { from, to } = pipeEndpoints(p);
        const fromAnchor = resolveEndpoint(from);
        const toAnchor = resolveEndpoint(to);
        // Right-angle (Manhattan) routing with a single elbow. Put the vertical leg
        // *into* whichever endpoint is a unit so dragging that unit up/down bends
        // the pipe right at the unit — the horizontal run stays put and an L forms
        // to reach it, instead of the whole run sliding vertically. `base` carries
        // the horizontal leg; `pivot` carries the vertical leg landing into it.
        // When both (or neither) endpoints are units, bend into `to` by default.
        // For same-x or same-y anchors the elbow collapses onto the line and it
        // renders as a straight segment.
        const bendIntoTo = to.kind === "unit" || from.kind !== "unit";
        const base = bendIntoTo ? fromAnchor : toAnchor;
        const pivot = bendIntoTo ? toAnchor : fromAnchor;
        const elbow = { x: pivot.x, y: base.y };
        return {
          ...p,
          base,
          pivot,
          elbow,
          liveFt: computeManhattanFt(fromAnchor, toAnchor),
        };
      }),
    // resolveEndpoint depends on dragPreview, so this recomputes during drags.
    [customPipes, resolveEndpoint]
  );

  // Every visible pipe segment, in canvas coords — used to snap add-pipe clicks
  // onto an existing line so "click the pipe" lands exactly on it. Mirrors the
  // geometry rendered in the SVG below.
  const pipeSegments = useMemo<Seg[]>(() => {
    const segs: Seg[] = [];
    if (floorLayouts.length === 0) return segs;
    const firstY = floorLayouts[0].y;
    if (!isDeleted(MAIN_TRUNK_ID)) {
      segs.push({ x1: dynamicTrunkX, y1: oduBottomLive, x2: dynamicTrunkX, y2: firstY });
    }
    floorLayouts.slice(1).forEach((f, i) => {
      if (isDeleted(trunkSegId(f.floorId))) return;
      segs.push({ x1: dynamicTrunkX, y1: floorLayouts[i].y, x2: dynamicTrunkX, y2: f.y });
    });
    floorLayouts.forEach((f) => {
      f.rooms.forEach((r, idx) => {
        if (isDeleted(branchSegId(r.id))) return;
        const from =
          idx === 0 ? { x: dynamicTrunkX, y: f.y } : getUnitAnchor(f.rooms[idx - 1].id);
        const to = getUnitAnchor(r.id);
        // Manhattan branch: horizontal leg then vertical leg.
        segs.push({ x1: from.x, y1: from.y, x2: to.x, y2: from.y });
        segs.push({ x1: to.x, y1: from.y, x2: to.x, y2: to.y });
      });
    });
    liveCustomPipes.forEach((p) => {
      segs.push({ x1: p.base.x, y1: p.base.y, x2: p.elbow.x, y2: p.elbow.y });
      segs.push({ x1: p.elbow.x, y1: p.elbow.y, x2: p.pivot.x, y2: p.pivot.y });
    });
    return segs;
  }, [floorLayouts, dynamicTrunkX, oduBottomLive, getUnitAnchor, liveCustomPipes, isDeleted]);

  /** Refnet (branch joint) markers — one wherever the refrigerant path splits.
   *  Two kinds exist in this layout:
   *
   *  - Trunk taps: a floor's branch leaves the riser at (trunkX, f.y).
   *  - Branch pass-throughs: branches daisy-chain unit to unit, so wherever the
   *    run carries on past a unit to the next one, that unit's position is also a
   *    split — part of the flow drops into it, the rest continues.
   *
   *  Tagged RN-01.. in traversal order (floor by floor, then outward along each
   *  branch), matching the order `evaluateVRFPiping` counts joints in when it
   *  adds equivalent length. */
  const refnetJoints = useMemo(() => {
    const joints: { id: string; pos: VRFCanvasPos; tag: string }[] = [];
    const push = (id: string, pos: VRFCanvasPos) =>
      joints.push({ id, pos, tag: `RN-${String(joints.length + 1).padStart(2, "0")}` });

    floorLayouts.forEach((f) => {
      // Trunk tap — only live while this floor still has its first branch segment.
      if (f.rooms[0] && !isDeleted(branchSegId(f.rooms[0].id))) {
        push(`joint-trunk-${f.floorId}`, { x: dynamicTrunkX, y: f.y });
      }
      f.rooms.forEach((r, idx) => {
        const next = f.rooms[idx + 1];
        // The split at `r` only exists if the run actually continues past it.
        if (!next || isDeleted(branchSegId(next.id))) return;
        const from = getUnitAnchor(r.id);
        const to = getUnitAnchor(next.id);
        // Same right-angle route the branch is drawn with: horizontal, then vertical.
        const route = [from, { x: to.x, y: from.y }, to];
        const routeLen =
          Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
        // Park it in the clear band between this card and the next, so neither the
        // glyph nor its RN tag is hidden behind a card (cards are HTML drawn over
        // this SVG). At the minimum sibling spacing that band is MIN_H_PX wide less
        // the two half-cards; aim at its center, but never past the midpoint of a
        // hop shorter than that.
        const offset = Math.min(JOINT_GAP_OFFSET_PX, routeLen / 2);
        push(`joint-branch-${r.id}`, pointAlongPolyline(route, offset));
      });
    });
    return joints;
  }, [floorLayouts, dynamicTrunkX, getUnitAnchor, isDeleted]);

  /** Snap a raw canvas click to a nearby unit anchor, else onto the nearest pipe
   *  line, else leave it as a free point. Units win over pipes so an endpoint the
   *  user aimed at a unit stays bound to it and tracks the unit when it's dragged. */
  const snapToPipe = useCallback(
    (pos: VRFCanvasPos): VRFPipeEndpoint => {
      // Unit anchors first, within the wider radius.
      let bestUnit: VRFUnitId | null = null;
      let bestUnitDistSq = UNIT_SNAP_PX * UNIT_SNAP_PX;
      const unitIds: VRFUnitId[] = [
        "odu",
        ...floorLayouts.flatMap((f) => f.rooms.map((r) => r.id)),
      ];
      for (const uid of unitIds) {
        const a = getUnitAnchor(uid);
        const d = (a.x - pos.x) ** 2 + (a.y - pos.y) ** 2;
        if (d <= bestUnitDistSq) {
          bestUnitDistSq = d;
          bestUnit = uid;
        }
      }
      if (bestUnit) return { kind: "unit", unitId: bestUnit };

      let best: VRFCanvasPos | null = null;
      let bestDistSq = PIPE_SNAP_PX * PIPE_SNAP_PX;
      for (const s of pipeSegments) {
        const { point, distSq } = closestOnSeg(pos, s);
        if (distSq <= bestDistSq) {
          bestDistSq = distSq;
          best = point;
        }
      }
      const at = best ?? pos;
      return { kind: "point", x: Math.round(at.x), y: Math.round(at.y) };
    },
    [pipeSegments, floorLayouts, getUnitAnchor]
  );

  // Totals — auto pipe lengths (excluding any segment the user has hidden) plus
  // every custom pipe drawn on top of the suggestion.
  const totalPipeFt =
    (isDeleted(MAIN_TRUNK_ID) ? 0 : mainTrunkFt) +
    Object.entries(floorSegFt).reduce(
      (a, [floorId, ft]) => a + (isDeleted(trunkSegId(floorId)) ? 0 : ft),
      0
    ) +
    Object.entries(branchFt).reduce(
      (a, [roomId, ft]) => a + (isDeleted(branchSegId(roomId)) ? 0 : ft),
      0
    ) +
    liveCustomPipes.reduce((a, p) => a + p.liveFt, 0);

  // Run the layout through the VRF piping-guide rule engine. Deleted auto-pipes
  // contribute zero length so the compliance numbers track the visible diagram.
  const customPipesFt = liveCustomPipes.reduce((a, p) => a + p.liveFt, 0);
  const pipingResult = useMemo(
    () =>
      evaluateVRFPiping({
        mainTrunkFt: isDeleted(MAIN_TRUNK_ID) ? 0 : mainTrunkFt,
        oduTons,
        oduAbove: true, // outdoor unit sits on the roof, above the indoor units
        customPipesFt,
        floors: floorsData.map((f, fi) => ({
          segFromAboveFt:
            fi === 0 || isDeleted(trunkSegId(f.floorId))
              ? 0
              : floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT,
          rooms: f.rooms.map((r) => ({
            id: r.id,
            name: r.name,
            capacityKbtuh: r.capacityKbtuh,
            branchFt: isDeleted(branchSegId(r.id))
              ? 0
              : branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT,
          })),
        })),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [floorsData, branchFt, floorSegFt, mainTrunkFt, oduTons, customPipesFt, deletedAuto]
  );

  // Per-room auxiliary pipe diameters and the shared main-pipe (trunk) diameter,
  // keyed for the on-canvas length labels so each segment shows its size.
  const mainPipeSize = pipingResult.sizing.mainPipe;
  // One kit covers the system — the guide sizes it off total indoor capacity,
  // not per joint — so it's shown once in the legend rather than on each marker.
  const branchJointKit = pipingResult.sizing.branchJointKit;
  const auxSizeById = useMemo(() => {
    const m = new Map<string, PipeSize>();
    pipingResult.sizing.auxiliary.forEach((a) => m.set(a.id, a.size));
    return m;
  }, [pipingResult.sizing.auxiliary]);

  const handleAddPipeAnchor = useCallback(
    (endpoint: VRFPipeEndpoint) => {
      if (!pendingPipeStart) {
        setPendingPipeStart(endpoint);
        return;
      }
      // Clicking the same unit again clears the in-progress start.
      if (
        pendingPipeStart.kind === "unit" &&
        endpoint.kind === "unit" &&
        pendingPipeStart.unitId === endpoint.unitId
      ) {
        setPendingPipeStart(null);
        return;
      }
      // Two distinct anchors → create the pipe and exit the mode.
      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Seed the stored length from the actual on-canvas distance so the value
      // matches the visual from the moment the pipe is drawn. The label
      // continues to live-track this distance in render.
      const initialFt = computeManhattanFt(
        resolveEndpoint(pendingPipeStart),
        resolveEndpoint(endpoint)
      );
      addVRFCustomPipe({
        id: newId,
        from: pendingPipeStart,
        to: endpoint,
        lengthFt: initialFt,
      });
      exitAddPipeMode();
    },
    [pendingPipeStart, addVRFCustomPipe, exitAddPipeMode, resolveEndpoint]
  );

  /** A click on the canvas (empty space or a pipe line) while in add-pipe mode.
   *  Snaps to the nearest pipe when close, else pins a free point. */
  const handleCanvasClickInAddMode = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      handleAddPipeAnchor(snapToPipe({ x: clientX - rect.left, y: clientY - rect.top }));
    },
    [handleAddPipeAnchor, snapToPipe]
  );

  /** Begin a unit-card drag. In add-pipe mode we treat clicks as anchor selections instead.
   *  When the grabbed unit is part of an existing multi-selection, the whole set drags
   *  together by the same delta; otherwise the drag is single-unit and the selection
   *  is cleared so it doesn't visually persist after a stray click. */
  const beginUnitDrag = useCallback(
    (id: VRFUnitId, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("input,button,a,select,textarea")) return;

      e.preventDefault();
      const startClientX = e.clientX;
      const startClientY = e.clientY;

      // Build the set of unit ids that move with this drag, plus their starting
      // top-left positions. Closing over `selectedIds` snapshots the selection
      // at drag-start so toggling during the drag would have no effect.
      const dragIds = selectedIds.has(id) ? new Set(selectedIds) : new Set<VRFUnitId>([id]);
      const startTLs = new Map<VRFUnitId, VRFCanvasPos>();
      dragIds.forEach((uid) => startTLs.set(uid, getUnitTopLeft(uid)));

      let moved = false;
      let lastPositions = new Map<VRFUnitId, VRFCanvasPos>();

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startClientX;
        const dy = ev.clientY - startClientY;
        if (!moved && Math.hypot(dx, dy) > 4) moved = true;
        if (moved) {
          const next = new Map<VRFUnitId, VRFCanvasPos>();
          startTLs.forEach((tl, uid) => {
            next.set(uid, { x: tl.x + dx, y: tl.y + dy });
          });
          lastPositions = next;
          setDragPreview(next);
        }
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (moved) {
          // Commit the drag. The ODU floats freely, so persist its absolute
          // position. Indoor units are locked to their floor's branch row, so
          // instead of an absolute override we translate the horizontal move into
          // that unit's branch length — this keeps the printed length in sync with
          // the on-canvas distance (matching custom pipes) and lets downstream
          // siblings shift along with it, instead of leaving a stretched line
          // whose label still reads the old value.
          const centerX = (uid: VRFUnitId) => {
            const tl = lastPositions.get(uid);
            const halfW = uid === "odu" ? ODU_W / 2 : INDOOR_IMG_W / 2;
            return tl ? tl.x + halfW : getUnitAnchor(uid).x;
          };
          const oduTL = lastPositions.get("odu");
          const trunkX = oduTL
            ? Math.max(TRUNK_X, oduTL.x + ODU_W / 2)
            : dynamicTrunkX;
          lastPositions.forEach((pos, uid) => {
            if (uid === "odu") {
              // Persist the clamped position so it can't be left-of-home.
              setVRFUnitPosition(uid, {
                x: trunkX - ODU_W / 2,
                y: Math.max(MIN_UNIT_Y, pos.y),
              });
              return;
            }
            // Locate the unit on its floor to find its branch's upstream anchor
            // (the trunk for the first unit, otherwise the previous sibling).
            for (const f of floorLayouts) {
              const idx = f.rooms.findIndex((r) => r.id === uid);
              if (idx === -1) continue;
              const fromX = idx === 0 ? trunkX : centerX(f.rooms[idx - 1].id);
              const gapFt = (centerX(uid) - fromX) / H_PX_PER_FT;
              setVRFBranchFt(uid, Math.max(0.5, gapFt));
              // Persist the vertical drop so the unit stays where it was released.
              // X is driven by the branch length above (getUnitTopLeft reads only
              // the stored Y for indoor units), so the stored x is just a snapshot.
              setVRFUnitPosition(uid, { x: pos.x, y: Math.max(MIN_UNIT_Y, pos.y) });
              break;
            }
          });
          setDragPreview(null);
        } else {
          setDragPreview(null);
          // Treat as a click. In add-pipe mode register the anchor; otherwise
          // collapse the selection to just this unit (or clear if already alone).
          if (addPipeMode) {
            handleAddPipeAnchor({ kind: "unit", unitId: id });
          } else {
            setSelectedIds((prev) => {
              if (prev.size === 1 && prev.has(id)) return new Set();
              return new Set([id]);
            });
          }
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      addPipeMode,
      selectedIds,
      getUnitTopLeft,
      getUnitAnchor,
      handleAddPipeAnchor,
      setVRFUnitPosition,
      setVRFBranchFt,
      floorLayouts,
      dynamicTrunkX,
    ]
  );

  /** Pointer-down on empty canvas starts a marquee selection. Clicks that land
   *  on a unit, label, or any other interactive child are ignored here because
   *  `e.target !== e.currentTarget`. */
  const beginMarquee = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (e.target !== e.currentTarget) return;
      // In add-pipe mode a click on empty canvas or a pipe line drops an anchor
      // (snapped onto the pipe when close) rather than starting a marquee.
      if (addPipeMode) {
        handleCanvasClickInAddMode(e.clientX, e.clientY);
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      // A bare click without drag clears the existing selection.
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        if (!moved && Math.hypot(x - startX, y - startY) > 4) moved = true;
        if (moved) setMarquee({ x1: startX, y1: startY, x2: x, y2: y });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (moved) {
          // Commit selection from current marquee bounds.
          setMarquee((m) => {
            if (!m) return null;
            const left = Math.min(m.x1, m.x2);
            const right = Math.max(m.x1, m.x2);
            const top = Math.min(m.y1, m.y2);
            const bottom = Math.max(m.y1, m.y2);
            const ids = new Set<VRFUnitId>();
            const oduTL = getUnitTopLeft("odu");
            if (
              oduTL.x < right &&
              oduTL.x + ODU_W > left &&
              oduTL.y < bottom &&
              oduTL.y + ODU_BLOCK_H > top
            ) {
              ids.add("odu");
            }
            floorLayouts.forEach((f) =>
              f.rooms.forEach((r) => {
                const tl = getUnitTopLeft(r.id);
                if (
                  tl.x < right &&
                  tl.x + INDOOR_IMG_W > left &&
                  tl.y < bottom &&
                  tl.y + INDOOR_BLOCK_H > top
                ) {
                  ids.add(r.id);
                }
              })
            );
            setSelectedIds(ids);
            return null;
          });
        } else {
          setMarquee(null);
          // Bare click on empty canvas → clear selection.
          setSelectedIds(new Set());
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [addPipeMode, floorLayouts, getUnitTopLeft, handleCanvasClickInAddMode]
  );

  /** Track the cursor while sketching a pipe so the dashed preview line follows. */
  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!addPipeMode || !pendingPipeStart) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPipePointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [addPipeMode, pendingPipeStart]
  );

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

  // A floor junction "exists" only while it still has at least one live branch.
  // Once every branch on a floor is deleted there's nothing tapping the trunk
  // there, so the risers above and below it should read as one pipe.
  const isJunctionFloor = (f: FloorLayout) =>
    f.rooms.some((r) => !isDeleted(branchSegId(r.id)));

  // Flat, top-to-bottom list of every trunk segment: the main trunk first, then
  // each inter-floor riser. Each carries its own length + setter so a merged run
  // can still write back to the underlying segments.
  const trunkSegs: TrunkSeg[] = [
    {
      id: MAIN_TRUNK_ID,
      ft: mainTrunkFt,
      setFt: setMainTrunkFt,
      yTop: oduBottomLive,
      yBot: floorLayouts[0].y,
    },
    ...floorLayouts.slice(1).map((f, i): TrunkSeg => ({
      id: trunkSegId(f.floorId),
      ft: floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT,
      setFt: (v: number) => setFloorSeg(f.floorId, v),
      yTop: floorLayouts[i].y,
      yBot: f.y,
    })),
  ];

  // Merge consecutive segments into runs. Two segments join when the floor they
  // share (floorLayouts[i-1] for segment i) is not a junction. A deleted segment
  // is hidden and breaks the current run.
  const trunkRuns: TrunkRun[] = [];
  let currentRun: TrunkRun | null = null;
  trunkSegs.forEach((seg, i) => {
    if (isDeleted(seg.id)) {
      currentRun = null;
      return;
    }
    const sharedFloor = i > 0 ? floorLayouts[i - 1] : null;
    if (currentRun && sharedFloor && !isJunctionFloor(sharedFloor)) {
      currentRun.segs.push(seg);
      currentRun.yBot = seg.yBot;
    } else {
      currentRun = { segs: [seg], yTop: seg.yTop, yBot: seg.yBot };
      trunkRuns.push(currentRun);
    }
  });

  // Editing a merged run scales its segments proportionally so they still sum to
  // the entered total; if the junction reappears the split stays sensible.
  const setRunFt = (run: TrunkRun, v: number) => {
    if (run.segs.length === 1) {
      run.segs[0].setFt(v);
      return;
    }
    const total = run.segs.reduce((a, s) => a + s.ft, 0);
    if (total <= 0) {
      run.segs[0].setFt(v);
      return;
    }
    const ratio = v / total;
    run.segs.forEach((s) => s.setFt(s.ft * ratio));
  };

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
              {isCombinedOdu ? `${oduUnits.length} combined outdoor units` : "One outdoor unit"} ({oduModel})
              {" "}serving {allRooms.length} indoor unit
              {allRooms.length === 1 ? "" : "s"} ·{" "}
              {isMetric ? `${round(btuhToKw(totalKbtuh * 1000), 1)} kW` : `${totalKbtuh} kBTU/h`}{" "}
              total cooling
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="/docs/coolex-vrf-piping-guide.pdf"
              download="COOLEX-VRF-Piping-Guide.pdf"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Piping guide (PDF)
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={resetLayout}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset layout
          </Button>
          <UnitToggle />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SummaryCard
          label={isCombinedOdu ? "Outdoor Units" : "Outdoor Unit"}
          value={oduModel}
          sub={`${round(oduTons, 1)} tons${isCombinedOdu ? " combined" : ""}`}
          accent="#B45309"
        />
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
          accent={
            pipingResult.overall === "violation"
              ? "#B91C1C"
              : pipingResult.overall === "warning"
              ? "#B45309"
              : PIPE_COLOR
          }
        />
      </div>

      {/* Piping-guide compliance */}
      <VRFPipingCompliance result={pipingResult} isMetric={isMetric} />

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
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded bg-[#EEF4FC] border border-[#D3E3F5] text-[9px] font-semibold text-[#3A6FB0] px-1 py-[1px]">
            ⌀ S · L mm
          </span>
          Recommended pipe diameter — S = suction, L = liquid
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
            <RefnetJoint x={7.5} y={7.5} tag="" />
          </svg>
          Refnet joint (RN-01…)
          {branchJointKit && (
            <span className="text-[#8894AB]">— kit {branchJointKit}</span>
          )}
        </span>
        {isCombinedOdu && (
          <span className="inline-flex items-center gap-1.5">
            <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
              <OutdoorJoint x={7.5} y={7.5} tag="" />
            </svg>
            Outdoor branch joint (M, N, O) — g1…g{oduUnits.length} are the module
            connection pipes
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 ml-auto bg-[#EBF3FF] border border-[#B8D4F0] rounded-full px-2.5 py-1 text-[#0057B8] font-medium">
          <Info className="w-3.5 h-3.5" />
          Drag any length label to resize the pipe — or click it to type a value
        </span>
      </div>

      {/* Canvas */}
      <div className="rounded-2xl border border-[#E2E8F4] bg-[#F8FBFF] p-4 overflow-auto relative">
        {/* Top-left tool bar — sits above the diagram for adding custom pipes. */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={addPipeMode ? "default" : "outline"}
            onClick={() => (addPipeMode ? exitAddPipeMode() : setAddPipeMode(true))}
            className={addPipeMode ? "bg-[#0057B8] text-white hover:bg-[#0057B8]/90" : ""}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {addPipeMode ? "Cancel adding pipe" : "Add pipe"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSave}
            className={
              justSaved
                ? "border-[#86EFAC] text-[#15803D] hover:bg-[#F0FDF4]"
                : ""
            }
          >
            {justSaved ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {justSaved ? "Saved" : "Save"}
          </Button>
          {addPipeMode && (
            <span className="text-[11px] text-[#0057B8] font-medium inline-flex items-center gap-1.5 bg-[#EBF3FF] border border-[#B8D4F0] rounded-full px-2.5 py-1">
              <Info className="w-3.5 h-3.5" />
              {pendingPipeStart
                ? "Click a unit, a pipe line, or any point to connect to (Esc to cancel)"
                : "Click a unit, a pipe line, or any point to start the pipe"}
            </span>
          )}
          {deletedAuto.size > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={restoreAllVRFAutoPipes}
              className="border-[#FCA5A5] text-[#B91C1C] hover:bg-[#FEF2F2]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Restore {deletedAuto.size} hidden pipe
              {deletedAuto.size === 1 ? "" : "s"}
            </Button>
          )}
          {selectedIds.size > 1 && (
            <span className="text-[11px] text-[#0057B8] font-medium inline-flex items-center gap-1.5 bg-[#EBF3FF] border border-[#B8D4F0] rounded-full px-2.5 py-1">
              {selectedIds.size} units selected — drag any one to move them all
            </span>
          )}
          <span className="text-[11px] text-[#64748B] inline-flex items-center gap-1.5 ml-auto">
            <Move className="w-3.5 h-3.5" />
            Tip: drag a unit to reposition, or sweep an empty area to multi-select
          </span>
        </div>

        <div
          ref={canvasRef}
          onPointerDown={beginMarquee}
          onPointerMove={handleCanvasPointerMove}
          className={`relative mx-auto ${addPipeMode ? "cursor-crosshair" : ""}`}
          style={{
            width: canvasW,
            height: canvasH,
            minWidth: canvasW,
            touchAction: "none",
          }}
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

            {/* Trunk risers — vertical at the live trunk x. Adjacent segments are
                merged into a single run wherever the floor between them has no live
                branch, so an emptied floor doesn't leave two stacked pipes. */}
            {trunkRuns.map((run) => (
              <Pipe
                key={`trunk-run-${run.segs[0].id}`}
                x1={dynamicTrunkX}
                y1={run.yTop}
                x2={dynamicTrunkX}
                y2={run.yBot}
              />
            ))}

            {/* Branches — each segment is a Manhattan-routed polyline that follows
                the actual unit anchors. When everything is at its auto position the
                segments collapse to a single straight horizontal line (matching the
                original look); once a unit is moved, its branch rebends to reach it. */}
            {floorLayouts.map((f) => {
              return (
                <g key={`floor-${f.floorId}`}>
                  {f.rooms.map((r, idx) => {
                    if (isDeleted(branchSegId(r.id))) return null;
                    const from =
                      idx === 0
                        ? { x: dynamicTrunkX, y: f.y }
                        : getUnitAnchor(f.rooms[idx - 1].id);
                    const to = getUnitAnchor(r.id);
                    // Right-angle routing: horizontal at `from.y` to the destination's
                    // x, then a vertical jog down/up to the destination's y.
                    const points = `${from.x},${from.y} ${to.x},${from.y} ${to.x},${to.y}`;
                    return <PipePath key={`branch-${r.id}`} points={points} />;
                  })}
                </g>
              );
            })}

            {/* Custom user-drawn pipes — solid blue between unit anchors. */}
            {liveCustomPipes.map((p) => (
              <g key={`cp-${p.id}`}>
                <PipePath
                  points={`${p.base.x},${p.base.y} ${p.elbow.x},${p.elbow.y} ${p.pivot.x},${p.pivot.y}`}
                />
                <circle cx={p.base.x} cy={p.base.y} r={3.5} fill={PIPE_COLOR} />
                <circle cx={p.pivot.x} cy={p.pivot.y} r={3.5} fill={PIPE_COLOR} />
              </g>
            ))}

            {/* Refnet joints — drawn after every pipe so each marker sits on top of
                the line it interrupts, and inside the SVG so the unit cards (which
                are HTML above it) still win wherever the two overlap. */}
            {refnetJoints.map((j) => (
              <RefnetJoint key={j.id} x={j.pos.x} y={j.pos.y} tag={j.tag} />
            ))}

            {/* Pending custom-pipe preview — marker on the chosen anchor plus a
                dashed Manhattan line to wherever the pointer currently is. */}
            {addPipeMode && pendingPipeStart && (() => {
              const a = resolveEndpoint(pendingPipeStart);
              // Preview the same route the pipe will take once committed: run
              // horizontally from the start anchor, then bend vertically into the
              // destination (see `liveCustomPipes`).
              const elbow = pipePointer ? { x: pipePointer.x, y: a.y } : null;
              return (
                <g>
                  {pipePointer && elbow && (
                    <polyline
                      points={`${a.x},${a.y} ${elbow.x},${elbow.y} ${pipePointer.x},${pipePointer.y}`}
                      stroke={PIPE_COLOR}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="none"
                      opacity={0.7}
                    />
                  )}
                  <circle
                    cx={a.x}
                    cy={a.y}
                    r={6}
                    fill="none"
                    stroke={PIPE_COLOR}
                    strokeWidth={2}
                    className="pipe-flow"
                  />
                </g>
              );
            })()}

            {/* Outdoor manifold — the arrangement from the piping guide's
                "alternative outdoor unit arrangements" figure. Each module drops
                its connection pipe (g1…g4) onto a header that runs back to the
                main pipe, merging at an outdoor branch joint (M, N, O) wherever
                the next module ties in. */}
            {isCombinedOdu && (() => {
              const tl = getUnitTopLeft("odu");
              const cardBottom = tl.y + ODU_BLOCK_H;
              const legX = oduUnits.map((_, i) => tl.x + i * (ODU_W + ODU_GAP) + ODU_W / 2);
              return (
                <g>
                  <line
                    x1={dynamicTrunkX}
                    y1={oduBottomLive}
                    x2={legX[legX.length - 1]}
                    y2={oduBottomLive}
                    stroke={PIPE_COLOR}
                    strokeWidth={PIPE_STROKE}
                    strokeLinecap="round"
                  />
                  {legX.map((x, i) => (
                    <g key={`odu-header-leg-${i}`}>
                      <line
                        x1={x}
                        y1={cardBottom}
                        x2={x}
                        y2={oduBottomLive}
                        stroke={PIPE_COLOR}
                        strokeWidth={PIPE_STROKE}
                        strokeLinecap="round"
                      />
                      <text
                        x={x + 6}
                        y={cardBottom + (oduBottomLive - cardBottom) / 2 + 3}
                        className="text-[9px] font-bold"
                        fill={PIPE_COLOR}
                      >
                        g{i + 1}
                      </text>
                    </g>
                  ))}
                  {/* One joint per tie-in, tagged outward from the main pipe:
                      M merges module 2, N module 3, O module 4. */}
                  {legX.slice(1).map((x, i) => (
                    <OutdoorJoint
                      key={`odu-joint-${i}`}
                      x={(legX[i] + x) / 2}
                      y={oduBottomLive}
                      tag={OUTDOOR_JOINT_TAGS[i]}
                    />
                  ))}
                </g>
              );
            })()}

            {/* Marquee selection rect — drawn while the user sweeps an empty area. */}
            {marquee && (() => {
              const x = Math.min(marquee.x1, marquee.x2);
              const y = Math.min(marquee.y1, marquee.y2);
              const w = Math.abs(marquee.x2 - marquee.x1);
              const h = Math.abs(marquee.y2 - marquee.y1);
              return (
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={PIPE_COLOR}
                  fillOpacity={0.08}
                  stroke={PIPE_COLOR}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              );
            })()}
          </svg>

          {/* ODU card(s) — combined modules are one system, so they share the
              "odu" identity: dragging either moves the pair, and the trunk stays
              anchored to the first module. */}
          {oduUnits.map((u, i) => {
            const tl = getUnitTopLeft("odu");
            const isPending =
              pendingPipeStart?.kind === "unit" && pendingPipeStart.unitId === "odu";
            return (
              <DraggableUnitCard
                key={`odu-card-${i}`}
                top={tl.y}
                left={tl.x + i * (ODU_W + ODU_GAP)}
                width={ODU_W}
                imageH={ODU_IMG_H}
                labelH={ODU_LABEL_H}
                image="/images/vrf-outdoor-unit.png"
                title={u.modelNumber}
                subtitle={isCombinedOdu ? `Outdoor Module ${i + 1}` : "Outdoor Unit"}
                power={
                  isCombinedOdu
                    ? `${round(u.capacityKbtuh / 12, 1)} tons · carries ${
                        isMetric
                          ? `${round(btuhToKw(oduModuleLoads[i] * 1000), 1)} kW`
                          : `${round(oduModuleLoads[i], 0)} kBTU/h`
                      }`
                    : `${round(oduTons, 1)} tons capacity`
                }
                accent="#B45309"
                bg="#FEF4E6"
                addPipeMode={addPipeMode}
                isPipeAnchor={isPending}
                isSelected={selectedIds.has("odu")}
                onPointerDown={(e) => beginUnitDrag("odu", e)}
                onDoubleClick={() => startPipeFromUnit("odu")}
              />
            );
          })}

          {/* Indoor cards */}
          {floorLayouts.flatMap((f) =>
            f.rooms.map((r) => {
              const tl = getUnitTopLeft(r.id);
              // Catalogue-backed indoor types carry a real model number (IVLF /
              // IWEF); other indoor types use the synthesized prefix-capacity name.
              const modelName =
                getVRFIndoorModelNumber(r.indoorType, r.capacityKbtuh) ??
                `${INDOOR_PREFIX[r.indoorType]}-${String(r.capacityKbtuh).padStart(3, "0")}`;
              const capDisplay = isMetric
                ? `${round(btuhToKw(r.capacityKbtuh * 1000), 1)} kW`
                : `${r.capacityKbtuh} kBTU/h`;
              const isPending =
                pendingPipeStart?.kind === "unit" && pendingPipeStart.unitId === r.id;
              return (
                <DraggableUnitCard
                  key={`card-${r.id}`}
                  top={tl.y}
                  left={tl.x}
                  width={INDOOR_IMG_W}
                  imageH={INDOOR_IMG_H}
                  labelH={INDOOR_LABEL_H}
                  image={INDOOR_IMAGE[r.indoorType]}
                  title={modelName}
                  subtitle={`${INDOOR_NAME[r.indoorType]} · ${capDisplay}`}
                  tag={`${r.name} · Floor ${f.floorNumber}`}
                  accent="#0057B8"
                  bg="#EBF3FF"
                  addPipeMode={addPipeMode}
                  isPipeAnchor={isPending}
                  isSelected={selectedIds.has(r.id)}
                  onPointerDown={(e) => beginUnitDrag(r.id, e)}
                  onDoubleClick={() => startPipeFromUnit(r.id)}
                />
              );
            })
          )}

          {/* Editable length labels */}
          {/* Trunk run labels — one per merged run. The badge shows the run's total
              length; deleting it hides every segment in the run, and editing scales
              the underlying segments to match. */}
          {trunkRuns.map((run) => (
            <PipeLabel
              key={`lbl-trunk-run-${run.segs[0].id}`}
              cx={dynamicTrunkX}
              cy={(run.yTop + run.yBot) / 2}
              valueFt={run.segs.reduce((a, s) => a + s.ft, 0)}
              onChange={(v) => setRunFt(run, v)}
              onDelete={() => run.segs.forEach((s) => deleteVRFAutoPipe(s.id))}
              isMetric={isMetric}
              orientation="vertical"
              anchor="left"
              size={mainPipeSize}
              addPipeMode={addPipeMode}
            />
          ))}

          {/* Branch segment labels — sit at the midpoint of each segment's
              horizontal portion, so they follow the units the segment connects. */}
          {floorLayouts.flatMap((f) =>
            f.rooms.map((r, idx) => {
              if (isDeleted(branchSegId(r.id))) return null;
              const from =
                idx === 0
                  ? { x: dynamicTrunkX, y: f.y }
                  : getUnitAnchor(f.rooms[idx - 1].id);
              const to = getUnitAnchor(r.id);
              return (
                <PipeLabel
                  key={`lbl-branch-${r.id}`}
                  cx={(from.x + to.x) / 2}
                  cy={from.y}
                  valueFt={branchFt[r.id] ?? DEFAULT_BRANCH_SEG_FT}
                  onChange={(v) => setBranchFtFor(r.id, v)}
                  onDelete={() => deleteVRFAutoPipe(branchSegId(r.id))}
                  isMetric={isMetric}
                  orientation="horizontal"
                  size={auxSizeById.get(r.id)}
                  addPipeMode={addPipeMode}
                />
              );
            })
          )}

          {/* Custom-pipe labels and delete handles. The label sits at the midpoint
              of each user-drawn pipe; orientation is picked from the dominant axis.
              Length is derived from the live anchor distance, so dragging either
              endpoint unit updates the badge in real time. */}
          {liveCustomPipes.map((p) => {
            // Place the badge on the longer leg of the right-angle route so it sits
            // on the pipe rather than floating in the bend. Horizontal leg runs
            // along base.y from base.x to pivot.x; vertical leg runs along pivot.x
            // from base.y down/up into pivot.y.
            const hLen = Math.abs(p.pivot.x - p.base.x);
            const vLen = Math.abs(p.pivot.y - p.base.y);
            const onVertical = vLen >= hLen;
            const midX = onVertical ? p.pivot.x : (p.base.x + p.pivot.x) / 2;
            const midY = onVertical ? (p.base.y + p.pivot.y) / 2 : p.base.y;
            const orient = onVertical ? "vertical" : "horizontal";
            return (
              <CustomPipeLabel
                key={`cp-lbl-${p.id}`}
                cx={midX}
                cy={midY}
                valueFt={p.liveFt}
                onDelete={() => removeVRFCustomPipe(p.id)}
                isMetric={isMetric}
                orientation={orient}
                addPipeMode={addPipeMode}
              />
            );
          })}

          {/* Floor ribbon labels — home position is just left of the trunk at each
              branch line; drag moves them anywhere on the canvas. */}
          {floorLayouts.map((f) => {
            const id = `floor-${f.floorId}`;
            const pos = getLabelPos(id, { x: 8, y: f.y - 10 });
            return (
              <RibbonLabel
                key={id}
                pos={pos}
                text={`Floor ${f.floorNumber}`}
                dragging={labelDrag?.id === id}
                onPointerDown={(e) => beginLabelDrag(id, { x: 8, y: f.y - 10 }, e)}
                addPipeMode={addPipeMode}
              />
            );
          })}

          {/* Zone ribbon labels — same treatment, parked above each zone's cards. */}
          {zoneRibbons.map((z) => {
            // `zoneoff-` (not `zone-`) because the stored value is now an offset:
            // any absolute position left over from an older layout must not be
            // read back as a delta.
            const id = `zoneoff-${z.zoneId}`;
            const pos = getLabelPos(id, z.auto, true);
            return (
              <RibbonLabel
                key={id}
                pos={pos}
                text={z.zoneName || `Zone ${z.zoneNumber}`}
                variant="zone"
                dragging={labelDrag?.id === id}
                onPointerDown={(e) => beginLabelDrag(id, z.auto, e, true)}
                addPipeMode={addPipeMode}
              />
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 text-center">
        Tip: the blue pipes show refrigerant flowing from the outdoor unit down to each room.
        Drag any unit to reposition it, <strong>double-click a unit</strong> (or click{" "}
        <strong>Add pipe</strong>) to draw an extra run from it, or use <strong>Reset layout</strong>{" "}
        to start over.
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

/** A refnet joint — the fitting that splits the run where a branch taps off.
 *  Drawn as the branch symbol used on manufacturer piping schematics: the circle
 *  is the fitting body, the three stubs are its flow paths (in, on, and down).
 *  Purely a topology marker — it says nothing about which way refrigerant moves,
 *  which reverses between cooling and heating. */
function RefnetJoint({ x, y, tag }: { x: number; y: number; tag: string }) {
  const R = 7;
  // Diagonal splitter inside the body, drawn from lower-left to upper-right with a
  // solid head at its low end — the mark that distinguishes a refnet from a plain
  // tee on manufacturer schematics.
  const d = R * 0.62;
  const hx = x - d;
  const hy = y + d;
  const h = 2.6;
  return (
    <g>
      {/* Knock out the pipe behind the body so the inner marks stay legible. */}
      <circle cx={x} cy={y} r={R} fill="#FFFFFF" stroke={PIPE_COLOR} strokeWidth={1.6} />
      <g stroke={PIPE_COLOR} strokeWidth={1.3} strokeLinecap="round">
        {/* Main run passes straight through; the branch drops from the body. */}
        <line x1={x - R} y1={y} x2={x + R} y2={y} />
        <line x1={x} y1={y} x2={x} y2={y + R} />
        <line x1={hx} y1={hy} x2={x + d} y2={y - d} />
      </g>
      <polygon
        points={`${hx},${hy} ${hx + h * 1.7},${hy - h * 0.4} ${hx + h * 0.4},${hy - h * 1.7}`}
        fill={PIPE_COLOR}
      />
      <text
        x={x}
        y={y - R - 4}
        textAnchor="middle"
        className="text-[9px] font-bold"
        fill={PIPE_COLOR}
      >
        {tag}
      </text>
    </g>
  );
}

/** An outdoor branch joint — the fitting that merges one more outdoor module's
 *  connection pipe into the header running back to the main pipe. The piping
 *  guide draws these as a solid triangle, distinct from the open-bodied refnet
 *  used on the indoor side. The apex points at the main pipe (to the left, where
 *  the trunk hangs), matching the guide's figure. */
function OutdoorJoint({ x, y, tag }: { x: number; y: number; tag: string }) {
  const w = 13;
  const h = 11;
  return (
    <g>
      <polygon
        points={`${x - w / 2},${y} ${x + w / 2},${y - h / 2} ${x + w / 2},${y + h / 2}`}
        fill={PIPE_COLOR}
        stroke={PIPE_COLOR}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <text
        x={x}
        y={y + h / 2 + 11}
        textAnchor="middle"
        className="text-[9px] font-bold"
        fill={PIPE_COLOR}
      >
        {tag}
      </text>
    </g>
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

/** Polyline pipe — same visual as `Pipe` but takes an SVG points string so it
 *  can render right-angle (Manhattan) routing from the trunk to a moved unit. */
function PipePath({ points }: { points: string }) {
  return (
    <>
      <polyline
        points={points}
        stroke={PIPE_COLOR}
        strokeWidth={PIPE_STROKE}
        fill="none"
      />
      <polyline
        points={points}
        stroke={FLOW_COLOR}
        strokeWidth={FLOW_STROKE}
        fill="none"
        className="pipe-flow"
      />
    </>
  );
}

/** A draggable floor/zone ribbon. Zones use the lighter accent treatment so a
 *  ribbon parked next to a floor ribbon still reads as the finer subdivision. */
function RibbonLabel({
  pos,
  text,
  variant = "floor",
  dragging,
  onPointerDown,
  addPipeMode,
}: {
  pos: VRFCanvasPos;
  text: string;
  variant?: "floor" | "zone";
  dragging?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  /** Ribbons aren't draggable while adding a pipe, so let clicks reach the canvas under them. */
  addPipeMode?: boolean;
}) {
  const isZone = variant === "zone";
  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        "absolute select-none text-[10px] font-bold tracking-[0.14em] uppercase bg-white rounded-md px-2 py-0.5 shadow-sm border",
        isZone
          ? "text-[#00A3E0] border-[#BFE6F7]"
          : "text-[#0057B8] border-[#B8D4F0]",
        dragging ? "cursor-grabbing shadow-md z-30" : "cursor-grab"
      )}
      style={{ top: pos.y, left: pos.x, pointerEvents: addPipeMode ? "none" : "auto" }}
    >
      {text}
    </div>
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

function DraggableUnitCard({
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
  addPipeMode,
  isPipeAnchor,
  isSelected,
  onPointerDown,
  onDoubleClick,
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
  addPipeMode: boolean;
  isPipeAnchor: boolean;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
}) {
  const cursor = addPipeMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing";
  // Pipe-anchor (add-pipe mode) takes priority, then multi-select highlight, then
  // a soft hover hint while in add-pipe mode.
  const ringClass = isPipeAnchor
    ? "ring-2 ring-[#0057B8] ring-offset-2"
    : isSelected
    ? "ring-2 ring-[#0057B8]/70 ring-offset-2"
    : addPipeMode
    ? "hover:ring-2 hover:ring-[#0057B8]/40"
    : "";

  return (
    <div
      className={`absolute flex flex-col items-center select-none rounded-xl ${cursor} ${ringClass}`}
      style={{ top, left, width, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("input,button,a,select,textarea")) return;
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl border pointer-events-none"
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
          draggable={false}
          className="object-contain"
          style={{ maxWidth: width - 12, maxHeight: imageH - 8 }}
        />
      </div>
      <div
        className="w-full text-center mt-1 px-1 pointer-events-none"
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

/** Read-only badge for custom (user-added) pipes. The length follows the
 *  on-canvas distance between the two endpoint units, so the way to change it
 *  is to drag the units themselves rather than the badge. */
function CustomPipeLabel({
  cx,
  cy,
  valueFt,
  onDelete,
  isMetric,
  orientation,
  addPipeMode,
}: {
  cx: number;
  cy: number;
  valueFt: number;
  onDelete: () => void;
  isMetric: boolean;
  orientation: "vertical" | "horizontal";
  /** While adding a pipe the badge must not swallow clicks aimed at the pipe under it. */
  addPipeMode?: boolean;
}) {
  const display = formatLen(valueFt, isMetric);
  const width = 100;
  const height = 26;
  const left = cx - width / 2;
  const top = cy - height / 2;

  return (
    <div
      className="absolute select-none flex items-center gap-0.5"
      style={{ left, top, width, height, pointerEvents: addPipeMode ? "none" : "auto" }}
    >
      <div
        className="flex-1 h-full flex items-center justify-center gap-1 rounded-md bg-white border border-[#B8D4F0] text-[11px] font-semibold text-[#0057B8] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        title="Drag either connected unit to change this length"
      >
        {orientation === "vertical" ? (
          <ArrowUpDown className="w-3 h-3 text-[#7FA5D4]" />
        ) : (
          <ArrowLeftRight className="w-3 h-3 text-[#7FA5D4]" />
        )}
        {display}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="h-full w-5 flex items-center justify-center rounded-md bg-white border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        title="Remove this pipe"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function PipeLabel({
  cx,
  cy,
  valueFt,
  onChange,
  onDelete,
  isMetric,
  orientation,
  anchor = "center",
  size,
  addPipeMode,
}: {
  cx: number;
  cy: number;
  valueFt: number;
  onChange: (ft: number) => void;
  /** Optional — when provided, an X handle is shown next to the label to hide this pipe. */
  onDelete?: () => void;
  isMetric: boolean;
  orientation: "vertical" | "horizontal";
  anchor?: "center" | "left";
  /** Optional recommended pipe diameter for this segment, shown beneath the length. */
  size?: PipeSize;
  /** While adding a pipe the badge must not swallow clicks aimed at the pipe under it. */
  addPipeMode?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = formatLen(valueFt, isMetric);
  const diameter = formatDiameter(size);
  const labelW = 82;
  const xW = onDelete ? 22 : 0;
  const width = labelW + xW;
  const height = 24;

  // Position so the length-button portion (labelW) anchors to the pipe exactly
  // where it did before; the X handle (when present) flows to the right.
  const left =
    anchor === "left"
      ? cx + 6
      : orientation === "vertical"
      ? cx - labelW - 8
      : cx - labelW / 2;
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
      className="absolute select-none flex items-center gap-0.5"
      style={{ left, top, width, height, pointerEvents: addPipeMode ? "none" : "auto" }}
    >
      {editing ? (
        <div
          className="flex items-center gap-0.5 bg-white border border-[#0057B8] rounded shadow-sm h-full px-1"
          style={{ width: labelW }}
        >
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
        <>
          <button
            type="button"
            onPointerDown={handlePointerDown}
            style={{ width: labelW }}
            className={`h-full flex items-center justify-center gap-1 rounded-md bg-white border text-[11px] font-semibold text-[#0057B8] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${cursorClass} ${
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
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-full w-5 flex items-center justify-center rounded-md bg-white border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              title="Hide this pipe — restore from the toolbar"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      )}
      {diameter && (
        <div
          className="absolute left-0 flex justify-center pointer-events-none"
          style={{ top: height + 2, width: labelW }}
        >
          <span
            className="rounded bg-[#EEF4FC] border border-[#D3E3F5] text-[9px] font-semibold text-[#3A6FB0] px-1 py-[1px] whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            title="Recommended refrigerant pipe outer diameter — suction · liquid, per the VRF piping guide"
          >
            {diameter}
          </span>
        </div>
      )}
    </div>
  );
}

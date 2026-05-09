"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  Info,
  Move,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/components/selection/UnitToggle";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, round } from "@/lib/utils/unit-conversions";
import { VRF_OUTDOOR_SIZES, synthesizeVRFOutdoorModel } from "@/lib/utils/vrf";
import type { VRFCanvasPos, VRFCustomPipe, VRFIndoorType, VRFUnitId } from "@/types/selection";

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

/** Custom-pipe length follows the on-canvas distance between the two unit anchors.
 *  Manhattan rather than Euclidean: refrigerant pipes route along axes (vertical
 *  riser + horizontal run), and we want it to match the rest of the diagram which
 *  uses different px-per-ft for V vs H. */
function computeManhattanFt(a: VRFCanvasPos, b: VRFCanvasPos): number {
  const dxFt = Math.abs(b.x - a.x) / H_PX_PER_FT;
  const dyFt = Math.abs(b.y - a.y) / V_PX_PER_FT;
  return Math.round((dxFt + dyFt) * 2) / 2; // snap to 0.5 ft
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
  const {
    vrfLayout,
    navigateBack,
    setStep,
    toggleModelSelection,
    selectedModels,
    setVRFMainTrunkFt,
    setVRFFloorSegFt,
    setVRFBranchFt,
    setVRFUnitPosition,
    addVRFCustomPipe,
    removeVRFCustomPipe,
    deleteVRFAutoPipe,
    restoreAllVRFAutoPipes,
    resetVRFLayout,
  } = useSelectionStore();
  const unitSystem = useUnitStore((s) => s.unitSystem);
  const isMetric = unitSystem === "metric";

  // Custom-pipe authoring state
  const [addPipeMode, setAddPipeMode] = useState(false);
  const [pendingPipeStart, setPendingPipeStart] = useState<VRFUnitId | null>(null);
  // Live drag preview — keyed map so a single drag can move multiple selected
  // units simultaneously. null when nothing is being dragged.
  const [dragPreview, setDragPreview] = useState<Map<VRFUnitId, VRFCanvasPos> | null>(null);
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

  const exitAddPipeMode = useCallback(() => {
    setAddPipeMode(false);
    setPendingPipeStart(null);
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
      const preview = dragPreview?.get(id);
      if (preview) return preview;
      return unitPositions?.[id] ?? autoTopLeft.get(id) ?? { x: 0, y: 0 };
    },
    [dragPreview, unitPositions, autoTopLeft]
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

  // Trunk follows the ODU horizontally. When the ODU is at its auto position,
  // dynamicTrunkX === TRUNK_X and the visual is identical to before; once it's
  // dragged the entire trunk + branch network anchors to the new center.
  const oduTopLeftLive = getUnitTopLeft("odu");
  const dynamicTrunkX = oduTopLeftLive.x + ODU_W / 2;
  const oduBottomLive = oduTopLeftLive.y + ODU_BLOCK_H;

  // Live-derived geometry for custom pipes. Length tracks the actual distance
  // between unit anchors, so dragging either endpoint updates the number on the
  // pipe label and the total in the summary strip in real time.
  const liveCustomPipes = useMemo(
    () =>
      customPipes.map((p) => {
        const anchorA = getUnitAnchor(p.fromUnitId);
        const anchorB = getUnitAnchor(p.toUnitId);
        return {
          ...p,
          anchorA,
          anchorB,
          liveFt: computeManhattanFt(anchorA, anchorB),
        };
      }),
    // getUnitAnchor depends on dragPreview, so this recomputes during drags.
    [customPipes, getUnitAnchor]
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

  const handleUnitClickInAddMode = useCallback(
    (id: VRFUnitId) => {
      if (!pendingPipeStart) {
        setPendingPipeStart(id);
        return;
      }
      if (pendingPipeStart === id) {
        // Same unit clicked twice → clear selection but stay in add mode.
        setPendingPipeStart(null);
        return;
      }
      // Two distinct units → create the pipe and exit the mode.
      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Seed the stored length from the actual on-canvas distance so the value
      // matches the visual from the moment the pipe is drawn. The label
      // continues to live-track this distance in render.
      const initialFt = computeManhattanFt(
        getUnitAnchor(pendingPipeStart),
        getUnitAnchor(id)
      );
      addVRFCustomPipe({
        id: newId,
        fromUnitId: pendingPipeStart,
        toUnitId: id,
        lengthFt: initialFt,
      });
      exitAddPipeMode();
    },
    [pendingPipeStart, addVRFCustomPipe, exitAddPipeMode, getUnitAnchor]
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
          // Commit every dragged unit's final position to the store. Each call
          // is independent so React can batch them.
          lastPositions.forEach((pos, uid) => setVRFUnitPosition(uid, pos));
          setDragPreview(null);
        } else {
          setDragPreview(null);
          // Treat as a click. In add-pipe mode register the anchor; otherwise
          // collapse the selection to just this unit (or clear if already alone).
          if (addPipeMode) {
            handleUnitClickInAddMode(id);
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
      handleUnitClickInAddMode,
      setVRFUnitPosition,
    ]
  );

  /** Pointer-down on empty canvas starts a marquee selection. Clicks that land
   *  on a unit, label, or any other interactive child are ignored here because
   *  `e.target !== e.currentTarget`. */
  const beginMarquee = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (e.target !== e.currentTarget) return;
      if (addPipeMode) return;

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
    [addPipeMode, floorLayouts, getUnitTopLeft]
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
          <Button variant="outline" size="sm" onClick={resetLayout}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset layout
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
          {addPipeMode && (
            <span className="text-[11px] text-[#0057B8] font-medium inline-flex items-center gap-1.5 bg-[#EBF3FF] border border-[#B8D4F0] rounded-full px-2.5 py-1">
              <Info className="w-3.5 h-3.5" />
              {pendingPipeStart
                ? "Click the unit to connect to (Esc to cancel)"
                : "Click the first unit to start the pipe"}
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
          className="relative mx-auto"
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

            {/* Main trunk: from bottom of ODU down to the first floor's branch line.
                Both endpoints follow the ODU horizontally so the trunk slides with it. */}
            {!isDeleted(MAIN_TRUNK_ID) && (
              <Pipe
                x1={dynamicTrunkX}
                y1={oduBottomLive}
                x2={dynamicTrunkX}
                y2={firstBranchY}
              />
            )}

            {/* Trunk between floors — vertical at the live trunk x. */}
            {floorLayouts.slice(1).map((f, i) => {
              if (isDeleted(trunkSegId(f.floorId))) return null;
              const prev = floorLayouts[i];
              return (
                <Pipe
                  key={`trunk-${f.floorId}`}
                  x1={dynamicTrunkX}
                  y1={prev.y}
                  x2={dynamicTrunkX}
                  y2={f.y}
                />
              );
            })}

            {/* Branches — each segment is a Manhattan-routed polyline that follows
                the actual unit anchors. When everything is at its auto position the
                segments collapse to a single straight horizontal line (matching the
                original look); once a unit is moved, its branch rebends to reach it. */}
            {floorLayouts.map((f) => {
              const firstSegLive = f.rooms[0] && !isDeleted(branchSegId(f.rooms[0].id));
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
                  {firstSegLive && (
                    <circle cx={dynamicTrunkX} cy={f.y} r={4} fill={PIPE_COLOR} />
                  )}
                </g>
              );
            })}

            {/* Custom user-drawn pipes — solid blue between unit anchors. */}
            {liveCustomPipes.map((p) => (
              <g key={`cp-${p.id}`}>
                <Pipe x1={p.anchorA.x} y1={p.anchorA.y} x2={p.anchorB.x} y2={p.anchorB.y} />
                <circle cx={p.anchorA.x} cy={p.anchorA.y} r={3.5} fill={PIPE_COLOR} />
                <circle cx={p.anchorB.x} cy={p.anchorB.y} r={3.5} fill={PIPE_COLOR} />
              </g>
            ))}

            {/* Pending custom-pipe preview — dashed line from the chosen anchor
                to where the user's pointer currently is on the canvas. */}
            {addPipeMode && pendingPipeStart && (() => {
              const a = getUnitAnchor(pendingPipeStart);
              return (
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={6}
                  fill="none"
                  stroke={PIPE_COLOR}
                  strokeWidth={2}
                  className="pipe-flow"
                />
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

          {/* ODU card */}
          {(() => {
            const tl = getUnitTopLeft("odu");
            const isPending = pendingPipeStart === "odu";
            return (
              <DraggableUnitCard
                top={tl.y}
                left={tl.x}
                width={ODU_W}
                imageH={ODU_IMG_H}
                labelH={ODU_LABEL_H}
                image="/images/vrf-outdoor-unit.png"
                title={oduModel}
                subtitle="Outdoor Unit"
                power={`${oduTons} tons capacity`}
                accent="#B45309"
                bg="#FEF4E6"
                addPipeMode={addPipeMode}
                isPipeAnchor={isPending}
                isSelected={selectedIds.has("odu")}
                onPointerDown={(e) => beginUnitDrag("odu", e)}
              />
            );
          })()}

          {/* Indoor cards */}
          {floorLayouts.flatMap((f) =>
            f.rooms.map((r) => {
              const tl = getUnitTopLeft(r.id);
              const eer = INDOOR_EER[r.indoorType];
              const power = round((r.capacityKbtuh * 1000) / eer / 1000, 1);
              const modelName = `${INDOOR_PREFIX[r.indoorType]}-${String(r.capacityKbtuh).padStart(3, "0")}`;
              const capDisplay = isMetric
                ? `${round(btuhToKw(r.capacityKbtuh * 1000), 1)} kW`
                : `${r.capacityKbtuh} kBTU/h`;
              const isPending = pendingPipeStart === r.id;
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
                  power={`Uses ${power} kW`}
                  addPipeMode={addPipeMode}
                  isPipeAnchor={isPending}
                  isSelected={selectedIds.has(r.id)}
                  onPointerDown={(e) => beginUnitDrag(r.id, e)}
                />
              );
            })
          )}

          {/* Editable length labels */}
          {/* Main trunk label — sits along the vertical trunk between ODU and floor 1 */}
          {!isDeleted(MAIN_TRUNK_ID) && (
            <PipeLabel
              cx={dynamicTrunkX}
              cy={(oduBottomLive + firstBranchY) / 2}
              valueFt={mainTrunkFt}
              onChange={setMainTrunkFt}
              onDelete={() => deleteVRFAutoPipe(MAIN_TRUNK_ID)}
              isMetric={isMetric}
              orientation="vertical"
              anchor="left"
            />
          )}

          {/* Between-floor trunk labels — placed midway along the trunk between adjacent floors */}
          {floorLayouts.slice(1).map((f, i) => {
            if (isDeleted(trunkSegId(f.floorId))) return null;
            const prev = floorLayouts[i];
            return (
              <PipeLabel
                key={`lbl-trunk-${f.floorId}`}
                cx={dynamicTrunkX}
                cy={(prev.y + f.y) / 2}
                valueFt={floorSegFt[f.floorId] ?? DEFAULT_FLOOR_GAP_FT}
                onChange={(v) => setFloorSeg(f.floorId, v)}
                onDelete={() => deleteVRFAutoPipe(trunkSegId(f.floorId))}
                isMetric={isMetric}
                orientation="vertical"
                anchor="left"
              />
            );
          })}

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
                />
              );
            })
          )}

          {/* Custom-pipe labels and delete handles. The label sits at the midpoint
              of each user-drawn pipe; orientation is picked from the dominant axis.
              Length is derived from the live anchor distance, so dragging either
              endpoint unit updates the badge in real time. */}
          {liveCustomPipes.map((p) => {
            const midX = (p.anchorA.x + p.anchorB.x) / 2;
            const midY = (p.anchorA.y + p.anchorB.y) / 2;
            const orient =
              Math.abs(p.anchorB.y - p.anchorA.y) > Math.abs(p.anchorB.x - p.anchorA.x)
                ? "vertical"
                : "horizontal";
            return (
              <CustomPipeLabel
                key={`cp-lbl-${p.id}`}
                cx={midX}
                cy={midY}
                valueFt={p.liveFt}
                onDelete={() => removeVRFCustomPipe(p.id)}
                isMetric={isMetric}
                orientation={orient}
              />
            );
          })}

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
        Drag any unit to reposition it, click <strong>Add pipe</strong> to draw extra runs, or use{" "}
        <strong>Reset layout</strong> to start over.
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
}: {
  cx: number;
  cy: number;
  valueFt: number;
  onDelete: () => void;
  isMetric: boolean;
  orientation: "vertical" | "horizontal";
}) {
  const display = formatLen(valueFt, isMetric);
  const width = 100;
  const height = 26;
  const left = cx - width / 2;
  const top = cy - height / 2;

  return (
    <div
      className="absolute select-none flex items-center gap-0.5"
      style={{ left, top, width, height, pointerEvents: "auto" }}
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
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = formatLen(valueFt, isMetric);
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
      style={{ left, top, width, height, pointerEvents: "auto" }}
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
    </div>
  );
}

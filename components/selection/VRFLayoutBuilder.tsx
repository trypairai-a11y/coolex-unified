"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Minus, Building2, DoorClosed, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useUnitStore } from "@/lib/stores/unit-store";
import { toDisplay, toImperial, unitLabel } from "@/lib/utils/unit-conversions";
import { UnitToggle } from "@/components/selection/UnitToggle";
import type { VRFFloor, VRFLayout, VRFRoom } from "@/types/selection";

const MAX_FLOORS = 50;
const MAX_ROOMS_PER_FLOOR = 100;

function makeRoom(floorNumber: number, roomNumber: number): VRFRoom {
  return {
    id: `f${floorNumber}-r${roomNumber}`,
    number: roomNumber,
    name: `Room ${floorNumber}.${roomNumber}`,
  };
}

function makeFloor(floorNumber: number, roomCount = 1): VRFFloor {
  return {
    id: `floor-${floorNumber}`,
    number: floorNumber,
    name: `Floor ${floorNumber}`,
    rooms: Array.from({ length: roomCount }, (_, i) => makeRoom(floorNumber, i + 1)),
  };
}

const AMBIENT_PRESETS: { label: string; ambientF: number; description: string }[] = [
  { label: "T1", ambientF: 95, description: "Moderate · 35°C" },
  { label: "T3", ambientF: 115, description: "Hot · 46°C" },
  { label: "T4", ambientF: 118, description: "Extreme · 48°C" },
];

export function VRFLayoutBuilder() {
  const { selectedGroup, vrfLayout, setVRFLayout, navigateBack } = useSelectionStore();
  const { unitSystem } = useUnitStore();

  const [floors, setFloors] = useState<VRFFloor[]>(() => {
    if (vrfLayout?.floors?.length) return vrfLayout.floors;
    return [makeFloor(1, 1)];
  });

  const [ambientTempF, setAmbientTempF] = useState<number>(vrfLayout?.ambientTempF ?? 95);

  const setFloorCount = (count: number) => {
    const next = Math.max(1, Math.min(MAX_FLOORS, Math.floor(count) || 1));
    setFloors((prev) => {
      if (next === prev.length) return prev;
      if (next > prev.length) {
        const additions = Array.from({ length: next - prev.length }, (_, i) =>
          makeFloor(prev.length + i + 1, 1)
        );
        return [...prev, ...additions];
      }
      return prev.slice(0, next);
    });
  };

  const setRoomCount = (floorIdx: number, count: number) => {
    const next = Math.max(1, Math.min(MAX_ROOMS_PER_FLOOR, Math.floor(count) || 1));
    setFloors((prev) =>
      prev.map((f, i) => {
        if (i !== floorIdx) return f;
        if (next === f.rooms.length) return f;
        if (next > f.rooms.length) {
          const additions = Array.from({ length: next - f.rooms.length }, (_, ri) =>
            makeRoom(f.number, f.rooms.length + ri + 1)
          );
          return { ...f, rooms: [...f.rooms, ...additions] };
        }
        return { ...f, rooms: f.rooms.slice(0, next) };
      })
    );
  };

  const renameRoom = (floorIdx: number, roomIdx: number, name: string) => {
    setFloors((prev) =>
      prev.map((f, i) => {
        if (i !== floorIdx) return f;
        return {
          ...f,
          rooms: f.rooms.map((r, ri) => (ri === roomIdx ? { ...r, name } : r)),
        };
      })
    );
  };

  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);

  const onContinue = () => {
    const layout: VRFLayout = { floors, ambientTempF };
    setVRFLayout(layout);
  };

  const ambientDisplayValue = toDisplay(ambientTempF, "ambientTempF", unitSystem);
  const ambientUnitLabel = unitLabel("ambientTempF", unitSystem);

  if (!selectedGroup) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(2)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">VRF System Layout</h2>
          <p className="text-muted-foreground text-sm">
            Define the building structure — floors and rooms — to size the VRF system.
          </p>
        </div>

        <UnitToggle />
      </div>

      {/* Ambient temperature card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden mb-6">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB] flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEF4E6] text-[#B45309]">
            <Thermometer className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#B45309] mb-0.5">Climate</p>
            <h3 className="text-sm font-semibold text-[#0D1626]">Ambient Temperature</h3>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,240px)_1fr] gap-5 items-start">
            <div>
              <Label htmlFor="vrf-ambient-temp" className="text-xs text-muted-foreground">
                Outdoor design temp ({ambientUnitLabel}) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vrf-ambient-temp"
                type="number"
                step="0.1"
                value={ambientDisplayValue}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  if (!Number.isFinite(raw)) return;
                  setAmbientTempF(toImperial(raw, "ambientTempF", unitSystem));
                }}
                className="mt-1.5 font-semibold"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB] mb-2">
                Climate preset
              </p>
              <div className="flex flex-wrap gap-2">
                {AMBIENT_PRESETS.map(({ label, ambientF }) => {
                  const selected = ambientTempF === ambientF;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAmbientTempF(ambientF)}
                      className={`px-3 py-2 rounded-lg border-2 text-center transition-colors ${
                        selected
                          ? "border-[#0057B8] bg-[#EBF3FF]"
                          : "border-[#E2E8F4] bg-white hover:border-[#B8D4F0] hover:bg-[#F8FBFF]"
                      }`}
                    >
                      <span className={`text-xs font-bold ${selected ? "text-[#0057B8]" : "text-[#0D1626]"}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floor count card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden mb-6">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB]">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8] mb-0.5">Building</p>
          <h3 className="text-sm font-semibold text-[#0D1626]">How many floors?</h3>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setFloorCount(floors.length - 1)}
              disabled={floors.length <= 1}
              aria-label="Decrease floors"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min={1}
              max={MAX_FLOORS}
              value={floors.length}
              onChange={(e) => setFloorCount(parseInt(e.target.value || "1", 10))}
              className="w-24 text-center font-semibold"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setFloorCount(floors.length + 1)}
              disabled={floors.length >= MAX_FLOORS}
              aria-label="Increase floors"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {floors.length} {floors.length === 1 ? "floor" : "floors"} · {totalRooms} {totalRooms === 1 ? "room" : "rooms"} total
            </span>
          </div>
        </div>
      </div>

      {/* Per-floor room configuration */}
      <div className="space-y-4 mb-6">
        {floors.map((floor, floorIdx) => (
          <div
            key={floor.id}
            className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden"
          >
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB] flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#EBF3FF] text-[#0057B8]">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8] mb-0.5">
                  Floor {floor.number}
                </p>
                <h3 className="text-sm font-semibold text-[#0D1626]">How many rooms on this floor?</h3>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5">
              <div className="flex items-center gap-3 mb-5">
                <Label className="text-xs text-muted-foreground">Rooms</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setRoomCount(floorIdx, floor.rooms.length - 1)}
                  disabled={floor.rooms.length <= 1}
                  aria-label="Decrease rooms"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={MAX_ROOMS_PER_FLOOR}
                  value={floor.rooms.length}
                  onChange={(e) => setRoomCount(floorIdx, parseInt(e.target.value || "1", 10))}
                  className="w-24 text-center font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setRoomCount(floorIdx, floor.rooms.length + 1)}
                  disabled={floor.rooms.length >= MAX_ROOMS_PER_FLOOR}
                  aria-label="Increase rooms"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {floor.rooms.map((room, roomIdx) => (
                  <div
                    key={room.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F4] bg-[#F8FAFD]"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white border border-[#E2E8F4] text-[#0057B8]">
                      <DoorClosed className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#0057B8] w-10 shrink-0">
                      {floor.number}.{room.number}
                    </span>
                    <Input
                      value={room.name}
                      onChange={(e) => renameRoom(floorIdx, roomIdx, e.target.value)}
                      className="h-8 bg-white text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={onContinue}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeft, ArrowRight, Wind, Gauge, Zap, Square, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { VRFIndoorType } from "@/types/selection";

const INDOOR_TYPES: {
  value: VRFIndoorType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}[] = [
  {
    value: "ducted-split-low-static",
    label: "Ducted Split (Low Static)",
    description: "Concealed indoor for short duct runs",
    icon: Wind,
    accent: "#0057B8",
    bg: "#EBF3FF",
  },
  {
    value: "ducted-split-high-static",
    label: "Ducted Split (High Static)",
    description: "Concealed indoor for long duct runs",
    icon: Gauge,
    accent: "#0057B8",
    bg: "#EBF3FF",
  },
  {
    value: "ducted-split-inverter",
    label: "Ducted Split Inverter",
    description: "Variable-capacity ducted indoor",
    icon: Zap,
    accent: "#7C3AED",
    bg: "#F3EBFF",
  },
  {
    value: "cassette",
    label: "Cassette",
    description: "Ceiling-recessed 4-way grille",
    icon: Square,
    accent: "#0F766E",
    bg: "#E6F7F4",
  },
  {
    value: "wall-mounted",
    label: "Wall Mounted",
    description: "Surface-mount on the wall",
    icon: Box,
    accent: "#B45309",
    bg: "#FEF4E6",
  },
];

export function VRFDesignConditions() {
  const { vrfLayout, setVRFRoomIndoorType, confirmVRFDesign, navigateBack } = useSelectionStore();

  if (!vrfLayout) {
    return (
      <div className="text-sm text-muted-foreground">
        No VRF layout defined yet. Go back and define floors and rooms first.
      </div>
    );
  }

  const allRooms = vrfLayout.floors.flatMap((f) => f.rooms);
  const allSelected = allRooms.length > 0 && allRooms.every((r) => !!r.indoorType);
  const selectedCount = allRooms.filter((r) => !!r.indoorType).length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(3)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Design Conditions · Indoor Units</h2>
          <p className="text-muted-foreground text-sm">
            Pick the indoor unit type for each room.{" "}
            <span className="font-medium text-[#0057B8]">
              {selectedCount} / {allRooms.length} rooms configured
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {vrfLayout.floors.map((floor) => (
          <div key={floor.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8]">
                Floor {floor.number}
              </span>
              <div className="flex-1 h-px bg-[#E2E8F4]" />
            </div>

            {floor.rooms.map((room) => (
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

                <div className="px-5 sm:px-6 py-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {INDOOR_TYPES.map(({ value, label, description, icon: Icon, accent, bg }) => {
                      const selected = room.indoorType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setVRFRoomIndoorType(room.id, value)}
                          className={`relative aspect-square flex flex-col items-center justify-center text-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 focus:outline-none ${
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
                            className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                            style={
                              selected
                                ? { borderColor: accent, backgroundColor: accent }
                                : { borderColor: "#CBD5E1", backgroundColor: "white" }
                            }
                          >
                            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150"
                            style={
                              selected
                                ? { backgroundColor: accent, color: "white" }
                                : { backgroundColor: bg, color: accent }
                            }
                          >
                            <Icon className="w-5 h-5" strokeWidth={1.75} />
                          </div>

                          <p
                            className="text-[11px] font-semibold leading-tight"
                            style={{ color: selected ? accent : "#0D1626" }}
                          >
                            {label}
                          </p>
                          <p className="text-[10px] text-[#8894AB] leading-snug px-1">
                            {description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-6">
        <Button
          type="button"
          onClick={confirmVRFDesign}
          disabled={!allSelected}
          className="bg-[#0057B8] hover:bg-[#0057B8]/90"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

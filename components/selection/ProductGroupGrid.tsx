"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Package,
  Wind,
  Droplets,
  Zap,
  Fan,
  Thermometer,
  Server,
  Gauge,
} from "lucide-react";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ProductGroup } from "@/types/product";
import type { ProductCategory } from "@/types/product";
import type { SelectionBasis } from "@/types/selection";

const CATEGORY_ICONS: Record<ProductCategory, React.ElementType> = {
  package: Package,
  split: Wind,
  vrf: Zap,
  chiller: Droplets,
  ccu: Thermometer,
  precision: Server,
  "fan-coil": Fan,
  crac: Gauge,
};

const BASIS_OPTIONS: { value: SelectionBasis; label: string; sublabel: string; description: string; icon: React.ElementType }[] = [
  {
    value: "capacity",
    label: "Capacity",
    sublabel: "TR \u00b7 BTU/h \u00b7 kW",
    description: "Select by required cooling or heating output",
    icon: Thermometer,
  },
  {
    value: "airflow",
    label: "Airflow",
    sublabel: "CFM \u00b7 m\u00b3/h",
    description: "Select by required air volume delivery",
    icon: Wind,
  },
];

export function ProductGroupGrid() {
  const { selectionBasis, setSelectionBasis, setSelectedGroup, navigateBack } = useSelectionStore();

  const { data: groups, isLoading, isError, refetch } = useQuery<ProductGroup[]>({
    queryKey: ["product-groups"],
    queryFn: () => fetch("/api/mock/product-groups").then(r => r.json()),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <AlertCircle className="w-10 h-10 text-destructive/60" />
        <p className="text-sm">Failed to load product groups</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Select Product Group</h2>
          <p className="text-muted-foreground text-sm mt-1">Choose the type of HVAC equipment to select</p>
        </div>
      </div>

      {/* Selection Basis */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,87,184,0.04)] overflow-hidden mb-6">
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0F4FB]">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8] mb-0.5">Selection Basis</p>
          <h3 className="text-sm font-semibold text-[#0D1626]">
            Selection will be based on Capacity or Airflow?
            <span className="text-[#0057B8] ml-0.5">*</span>
          </h3>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BASIS_OPTIONS.map(({ value, label, sublabel, description, icon: Icon }) => {
              const selected = selectionBasis === value;
              const colorMap = {
                capacity: {
                  selected: "border-[#0057B8] bg-[#EBF3FF] shadow-[0_0_0_3px_rgba(0,87,184,0.1)]",
                  unselected: "border-[#B8D4F0] bg-[#F0F7FF] hover:border-[#0057B8] hover:bg-[#E6F0FB]",
                },
                airflow: {
                  selected: "border-[#00875A] bg-[#E6F9F0] shadow-[0_0_0_3px_rgba(0,135,90,0.1)]",
                  unselected: "border-[#A8E6CF] bg-[#F0FFF8] hover:border-[#00875A] hover:bg-[#E0F5EC]",
                },
              };
              const colors = colorMap[value];
              const accent = value === "airflow" ? "#00875A" : "#0057B8";
              const iconBgUnselected = value === "airflow" ? "#E6F9F0" : "#EBF3FF";
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectionBasis(value)}
                  className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none
                    ${selected ? colors.selected : colors.unselected}`}
                >
                  <div className="absolute top-3.5 right-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                    style={selected ? { borderColor: accent, backgroundColor: accent } : { borderColor: "#CBD5E1", backgroundColor: "white" }}>
                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150"
                    style={selected ? { backgroundColor: accent, color: "white" } : { backgroundColor: iconBgUnselected, color: accent }}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: selected ? accent : "#0D1626" }}>
                      {label}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: selected ? `${accent}B3` : "#9BA8C0" }}>
                      {sublabel}
                    </p>
                    <p className="text-[11px] text-[#8894AB] mt-1.5 leading-snug pr-4">
                      {description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Group Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
        {(groups ?? []).map((group, i) => {
          const Icon = CATEGORY_ICONS[group.category] ?? Package;
          return (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedGroup(group)}
              className="relative group aspect-square rounded-2xl border border-gray-100 bg-white
                flex flex-col items-center justify-center gap-3 cursor-pointer
                transition-all duration-300 hover:shadow-xl overflow-hidden"
            >
              {/* Gradient background glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at 50% 40%, ${group.gradientFrom}0A 0%, transparent 70%)`,
                }}
              />

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-center"
                style={{
                  background: `linear-gradient(90deg, transparent, ${group.gradientFrom}, transparent)`,
                }}
              />

              {/* Icon */}
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center
                  transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${group.gradientFrom}10` }}
              >
                <Icon
                  className="w-8 h-8 transition-colors duration-300"
                  style={{ color: group.gradientFrom }}
                />
              </div>

              {/* Name */}
              <h3 className="relative font-semibold text-sm text-gray-800 text-center px-3 leading-tight">
                {group.name}
              </h3>

              {/* Short description */}
              <p className="relative text-[11px] text-gray-400 text-center px-4 leading-snug
                line-clamp-2 group-hover:text-gray-500 transition-colors duration-300">
                {group.shortDescription}
              </p>

              {/* Series count badge */}
              <span
                className="relative text-[10px] font-medium px-2.5 py-0.5 rounded-full
                  transition-colors duration-300"
                style={{
                  color: group.gradientFrom,
                  background: `${group.gradientFrom}10`,
                }}
              >
                {group.seriesCount} {group.seriesCount === 1 ? "series" : "series"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

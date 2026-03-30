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

export function ProductGroupGrid() {
  const { setSelectedGroup, navigateBack } = useSelectionStore();

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

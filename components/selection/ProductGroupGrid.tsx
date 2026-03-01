"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Thermometer, Wind, Droplets, Server, Package, Zap, AlertCircle } from "lucide-react";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ProductGroup } from "@/types/product";
import type { ProductCategory } from "@/types/product";

const CATEGORY_ICONS: Record<ProductCategory, React.ElementType> = {
  package: Package,
  split: Wind,
  "mini-split": Zap,
  chiller: Droplets,
  ccu: Thermometer,
  precision: Server,
};

export function ProductGroupGrid() {
  const { setSelectedGroup } = useSelectionStore();

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Select Product Group</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose the type of HVAC equipment to select</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(groups ?? []).map((group, i) => {
          const Icon = CATEGORY_ICONS[group.category] ?? Package;
          return (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(0,87,184,0.15)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGroup(group)}
              className="relative rounded-xl border-2 border-transparent bg-card text-left p-5 overflow-hidden group hover:border-[#0057B8] transition-all duration-200 shadow-sm"
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${group.gradientFrom}, ${group.gradientTo})` }}
              />

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
                style={{ background: `linear-gradient(135deg, ${group.gradientFrom}20, ${group.gradientTo}20)` }}
              >
                <Icon className="w-6 h-6 relative" style={{ color: group.gradientFrom }} />
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="font-semibold text-sm text-foreground leading-tight">{group.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{group.shortDescription}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-[#0057B8]">{group.tonRange}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{group.seriesCount} series</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

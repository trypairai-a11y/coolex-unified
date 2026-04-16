"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Snowflake, Gauge, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { EquipmentIllustration } from "./EquipmentIllustration";
import type { ProductSeries } from "@/types/product";

export function SeriesGrid() {
  const { selectedGroup, setSelectedSeries, navigateBack } = useSelectionStore();

  const { data: series, isLoading } = useQuery<ProductSeries[]>({
    queryKey: ["product-series", selectedGroup?.id],
    queryFn: () => fetch(`/api/mock/product-series?groupId=${selectedGroup?.id}`).then(r => r.json()),
    enabled: !!selectedGroup,
  });

  const hasSpeedTypes = series?.some(s => s.speedType);

  type RefrigerantSubGroup = { key: string; label: string; items: ProductSeries[] };
  type SeriesGroup = {
    key: string;
    label: string;
    icon: 'snowflake' | 'gauge' | 'zap';
    items?: ProductSeries[];
    subGroups?: RefrigerantSubGroup[];
  };

  const groupedSeries = useMemo((): SeriesGroup[] => {
    if (!series) return [];

    if (hasSpeedTypes) {
      // Primary: speed type (Fixed Speed / Variable Speed)
      // Secondary: refrigerant sub-groups within each speed type
      const speedGroups = new Map<string, ProductSeries[]>();
      const order = ['fixed', 'variable'];
      for (const s of series) {
        const key = s.speedType || 'other';
        if (!speedGroups.has(key)) speedGroups.set(key, []);
        speedGroups.get(key)!.push(s);
      }
      return order
        .filter(k => speedGroups.has(k))
        .map(k => {
          const items = speedGroups.get(k)!;
          // Sub-group by refrigerant if there are multiple refrigerant types
          const refGroups = new Map<string, ProductSeries[]>();
          for (const s of items) {
            const ref = s.primaryRefrigerant;
            if (!refGroups.has(ref)) refGroups.set(ref, []);
            refGroups.get(ref)!.push(s);
          }
          if (refGroups.size > 1) {
            return {
              key: k,
              label: k === 'fixed' ? 'Fixed Speed' : 'Variable Speed',
              icon: (k === 'fixed' ? 'gauge' : 'zap') as 'gauge' | 'zap',
              subGroups: Array.from(refGroups.entries()).map(([ref, refItems]) => ({
                key: ref,
                label: ref,
                items: refItems,
              })),
            };
          }
          return {
            key: k,
            label: k === 'fixed' ? 'Fixed Speed' : 'Variable Speed',
            icon: (k === 'fixed' ? 'gauge' : 'zap') as 'gauge' | 'zap',
            items,
          };
        });
    }

    // Fallback: group by refrigerant
    const groups = new Map<string, ProductSeries[]>();
    for (const s of series) {
      const ref = s.primaryRefrigerant;
      if (!groups.has(ref)) groups.set(ref, []);
      groups.get(ref)!.push(s);
    }
    return Array.from(groups.entries()).map(([ref, items]) => ({
      key: ref,
      label: ref,
      icon: 'snowflake' as const,
      items,
    }));
  }, [series, hasSpeedTypes]);


  if (!selectedGroup) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(2)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">{selectedGroup.name}</h2>
          <p className="text-muted-foreground text-sm">Select the specific equipment series</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : groupedSeries.length === 1 ? (
        // Single group — no section headers needed
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedSeries[0].items!.map((s, i) => (
            <SeriesCard key={s.id} series={s} index={i} onSelect={setSelectedSeries} />
          ))}
        </div>
      ) : (
        // Multiple groups — each with a header and cards
        <div className="space-y-8">
          {(() => {
            let animIdx = 0;
            return groupedSeries.map((group) => {
              const Icon = group.icon === 'gauge' ? Gauge : group.icon === 'zap' ? Zap : Snowflake;
              const iconColor = group.icon === 'gauge' ? 'text-gray-500' : group.icon === 'zap' ? 'text-emerald-500' : 'text-blue-500';
              return (
                <div key={group.key}>
                  {/* Main group header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{group.label}</h3>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {group.subGroups ? (
                    // Refrigerant sub-groups within this speed type
                    <div className="space-y-6">
                      {group.subGroups.map((sub) => {
                        const startIdx = animIdx;
                        animIdx += sub.items.length;
                        return (
                          <div key={sub.key}>
                            <div className="flex items-center gap-2 mb-3 ml-1">
                              <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{sub.label}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {sub.items.map((s, i) => (
                                <SeriesCard key={s.id} series={s} index={startIdx + i} onSelect={setSelectedSeries} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Flat items
                    (() => {
                      const startIdx = animIdx;
                      animIdx += group.items!.length;
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.items!.map((s, i) => (
                            <SeriesCard key={s.id} series={s} index={startIdx + i} onSelect={setSelectedSeries} />
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

function SeriesCard({ series: s, index, onSelect }: { series: ProductSeries; index: number; onSelect: (s: ProductSeries) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(s)}
      className="rounded-xl border border-gray-100 bg-white text-left p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group h-full flex flex-col"
    >
      {/* Equipment illustration */}
      <div className="mb-3">
        {s.imageUrl ? (
          <img src={s.imageUrl} alt={s.name} className="w-full h-24 object-contain" />
        ) : (
          <EquipmentIllustration groupId={s.groupId} />
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <h3 className="text-base font-semibold text-gray-800">{s.name}</h3>
        {s.refrigerants.map(r => (
          <Badge key={r} variant="outline" className="text-xs flex items-center gap-1 border-gray-200 text-gray-500">
            <Snowflake className="w-3 h-3 text-blue-400" /> {r}
          </Badge>
        ))}
      </div>

      {/* Ton range */}
      <div className="text-xl font-semibold text-[#0057B8]">{s.tonRangeLabel}</div>
      {s.cfmRangeLabel && (
        <div className="text-sm font-medium text-gray-500">{s.cfmRangeLabel}</div>
      )}

    </motion.button>
  );
}

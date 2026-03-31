"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Snowflake } from "lucide-react";
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

  // Group series by primary refrigerant
  const seriesByRefrigerant = useMemo(() => {
    if (!series) return [];
    const groups = new Map<string, ProductSeries[]>();
    for (const s of series) {
      const ref = s.primaryRefrigerant;
      if (!groups.has(ref)) groups.set(ref, []);
      groups.get(ref)!.push(s);
    }
    return Array.from(groups.entries());
  }, [series]);

  if (!selectedGroup) return null;

  let animIndex = 0;

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
      ) : seriesByRefrigerant.length === 1 ? (
        // Single refrigerant — no need for section headers
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesByRefrigerant[0][1].map((s, i) => (
            <SeriesCard key={s.id} series={s} index={i} onSelect={setSelectedSeries} />
          ))}
        </div>
      ) : (
        // Multiple refrigerants — group with headers
        <div className="space-y-8">
          {seriesByRefrigerant.map(([refrigerant, items]) => {
            const startIndex = animIndex;
            animIndex += items.length;
            return (
              <div key={refrigerant}>
                <div className="flex items-center gap-2 mb-4">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{refrigerant}</h3>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((s, i) => (
                    <SeriesCard key={s.id} series={s} index={startIndex + i} onSelect={setSelectedSeries} />
                  ))}
                </div>
              </div>
            );
          })}
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
        <EquipmentIllustration groupId={s.groupId} />
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

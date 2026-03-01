"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import type { ProductSeries } from "@/types/product";

export function SeriesGrid() {
  const { selectedGroup, setSelectedSeries, navigateBack } = useSelectionStore();

  const { data: series, isLoading } = useQuery<ProductSeries[]>({
    queryKey: ["product-series", selectedGroup?.id],
    queryFn: () => fetch(`/api/mock/product-series?groupId=${selectedGroup?.id}`).then(r => r.json()),
    enabled: !!selectedGroup,
  });

  if (!selectedGroup) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
          <p className="text-muted-foreground text-sm">Select the specific equipment series</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(series ?? []).map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSeries(s)}
              className="rounded-xl border-2 border-transparent bg-card text-left p-5 hover:border-[#0057B8] hover:shadow-md transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.modelPrefix}</div>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">{s.name}</h3>
                </div>
                <div className="flex flex-col gap-1">
                  {s.refrigerants.map(r => (
                    <Badge key={r} variant="outline" className="text-xs flex items-center gap-1">
                      <Snowflake className="w-3 h-3 text-blue-400" /> {r}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ton range */}
              <div className="text-2xl font-bold text-[#0057B8] mb-2">{s.tonRangeLabel}</div>

              {/* Differentiator */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.keyDifferentiator}</p>

              {/* Features */}
              <ul className="space-y-1">
                {s.features.slice(0, 3).map(f => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0057B8] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 text-xs text-[#0057B8] font-medium group-hover:underline">
                Select this series →
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

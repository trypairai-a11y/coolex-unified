"use client";

import { ArrowLeft, ArrowRight, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useOptions } from "@/hooks/useSelection";
import type { EquipmentOption } from "@/lib/mock-data/options";

const CATEGORY_LABELS: Record<string, string> = {
  construction: "Construction Options",
  electrical: "Electrical Options",
  refrigeration: "Refrigeration Options",
  controls: "Controls & BAS",
};

export function OptionsConfigurator() {
  const { selectedSeries, selectedModel, selectedOptions, toggleOption, setStep, navigateBack } = useSelectionStore();
  const { user } = useAuthStore();
  const showPricing = user?.role !== "dealer";

  const { data: options, isLoading, isError } = useOptions(selectedSeries?.id ?? null);

  const grouped = (options ?? []).reduce<Record<string, EquipmentOption[]>>((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});

  const selectedTotal = (options ?? [])
    .filter(o => selectedOptions.includes(o.id))
    .reduce((sum, o) => sum + o.priceAdderKWD, 0);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(5)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Options & Accessories</h2>
          <p className="text-muted-foreground text-sm">{selectedModel?.modelNumber} — Select additional options</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <AlertCircle className="w-8 h-8 text-destructive/60" />
          <p className="text-sm">Failed to load options</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
            const catOptions = grouped[cat] ?? [];
            if (!catOptions.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                  {catLabel}
                </h3>
                <div className="space-y-2">
                  {catOptions.map((opt) => {
                    const isChecked = selectedOptions.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isChecked ? "border-[#0057B8] bg-blue-50" : "border-border hover:border-muted-foreground/30 hover:bg-muted/20"
                        }`}
                        onClick={() => toggleOption(opt.id)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOption(opt.id)}
                          className="mt-0.5"
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{opt.label}</span>
                            {showPricing && (
                              <span className="text-sm font-semibold text-[#0057B8] whitespace-nowrap">
                                +KWD {opt.priceAdderKWD.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {showPricing && selectedOptions.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="w-4 h-4 text-[#0057B8]" />
                  Selected options total
                  <Badge variant="secondary">{selectedOptions.length} items</Badge>
                </div>
                <span className="font-bold text-[#0057B8]">+KWD {selectedTotal.toFixed(0)}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={() => setStep(7)} className="bg-[#0057B8] hover:bg-[#0057B8]/90">
          Preview Submittal <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

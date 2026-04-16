"use client";

import { ArrowLeft, ArrowRight, AlertCircle, Wrench, Zap, Snowflake, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionStore } from "@/lib/stores/selection-store";
import { useOptions } from "@/hooks/useSelection";
import type { EquipmentOption } from "@/lib/mock-data/options";

const CATEGORY_CONFIG: Record<string, { label: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
  construction: {
    label: "Construction Options",
    description: "Structural and protective accessories",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  electrical: {
    label: "Electrical Options",
    description: "Power and electrical accessories",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  refrigeration: {
    label: "Refrigeration Options",
    description: "Refrigerant circuit accessories",
    icon: Snowflake,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  controls: {
    label: "Controls & BAS",
    description: "Building automation and monitoring",
    icon: Cpu,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
};

export function OptionsConfigurator() {
  const { selectedSeries, selectedModels, selectedOptions, toggleOption, setStep, navigateBack } = useSelectionStore();

  const { data: options, isLoading, isError } = useOptions(selectedSeries?.id ?? null);

  const grouped = (options ?? []).reduce<Record<string, EquipmentOption[]>>((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});

  const selectedCount = selectedOptions.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigateBack(5)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Options & Accessories</h2>
          <p className="text-muted-foreground text-sm">
            {selectedModels.map(m => m.modelNumber).join(", ")} — Select additional options
          </p>
        </div>
      </div>


      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <AlertCircle className="w-8 h-8 text-destructive/60" />
          <p className="text-sm">Failed to load options</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
            const catOptions = grouped[cat] ?? [];
            if (!catOptions.length) return null;
            const catSelectedCount = catOptions.filter(o => selectedOptions.includes(o.id)).length;
            const Icon = config.icon;

            return (
              <div
                key={cat}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-[18px] h-[18px] ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
                      {catSelectedCount > 0 && (
                        <Badge variant="secondary" className="text-[11px] px-1.5 py-0 h-5 bg-[#0057B8]/10 text-[#0057B8] border-0">
                          {catSelectedCount} selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>

                {/* Options List */}
                <div className="divide-y divide-border/40">
                  {catOptions.map((opt) => {
                    const isChecked = selectedOptions.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[#0057B8]/[0.04]"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() => toggleOption(opt.id)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOption(opt.id)}
                          className="shrink-0"
                          onClick={e => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${isChecked ? "text-[#0057B8]" : "text-foreground"}`}>
                            {opt.label}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Summary Footer */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#0057B8]/20 bg-[#0057B8]/[0.04]">
              <div className="flex-1">
                <span className="text-sm font-semibold text-foreground">
                  {selectedCount} option{selectedCount !== 1 ? "s" : ""} selected
                </span>
              </div>
            </div>
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

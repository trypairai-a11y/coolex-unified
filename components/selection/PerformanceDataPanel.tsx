"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/types/product";
import {
  ACC_ST_MODELS,
  ACC_ST_AMBIENT_TEMPS_C,
  ACC_ST_LCWT_C,
} from "@/lib/mock-data/acc-st-models";
import {
  ACC_BP_MODELS,
  ACC_BP_AMBIENT_TEMPS_C,
  ACC_BP_LCWT_C,
} from "@/lib/mock-data/acc-bp-models";
import { fToC } from "@/lib/utils/unit-conversions";

interface PerformancePoint {
  capacityKW: number;
  compressorKW: number;
  waterFlowLPS: number;
  waterPressureDropKPa: number;
}

type Matrix = Record<string, Record<string, PerformancePoint>>;

interface PerformanceSource {
  matrix: Matrix;
  lcwtOptions: readonly number[];
  ambientOptions: readonly number[];
}

function getPerformanceSource(model: Model): PerformanceSource | null {
  if (model.seriesId === "acc-st") {
    const m = ACC_ST_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    return { matrix: m.performance, lcwtOptions: ACC_ST_LCWT_C, ambientOptions: ACC_ST_AMBIENT_TEMPS_C };
  }
  if (model.seriesId === "acc-bp") {
    const m = ACC_BP_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    return { matrix: m.performance, lcwtOptions: ACC_BP_LCWT_C, ambientOptions: ACC_BP_AMBIENT_TEMPS_C };
  }
  return null;
}

function closest(target: number, options: readonly number[]): number {
  return options.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best, options[0]);
}

interface Props {
  model: Model;
  designLcwtF?: number | null;
  designAmbientF?: number | null;
}

type Metric = "capacity" | "compressor" | "flow" | "pressureDrop";

const METRIC_CONFIG: Record<Metric, { label: string; unit: string; key: keyof PerformancePoint }> = {
  capacity:     { label: "Cooling Capacity", unit: "kW",  key: "capacityKW" },
  compressor:   { label: "Compressor Power", unit: "kW",  key: "compressorKW" },
  flow:         { label: "Water Flow Rate",  unit: "L/s", key: "waterFlowLPS" },
  pressureDrop: { label: "Water Pressure Drop", unit: "kPa", key: "waterPressureDropKPa" },
};

export function PerformanceDataPanel({ model, designLcwtF, designAmbientF }: Props) {
  const source = useMemo(() => getPerformanceSource(model), [model]);
  const [metric, setMetric] = useState<Metric>("capacity");

  if (!source) return null;

  const { matrix, lcwtOptions, ambientOptions } = source;

  const designLcwtC = designLcwtF != null ? fToC(designLcwtF) : null;
  const designAmbientC = designAmbientF != null ? fToC(designAmbientF) : null;
  const snappedLcwt = designLcwtC != null ? closest(designLcwtC, lcwtOptions) : null;
  const snappedAmbient = designAmbientC != null ? closest(designAmbientC, ambientOptions) : null;

  const config = METRIC_CONFIG[metric];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Performance Data for This Unit
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {model.modelNumber} — metric system, across ambient and leaving chilled water temperatures
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-background border border-border p-0.5">
          {(Object.entries(METRIC_CONFIG) as [Metric, typeof METRIC_CONFIG[Metric]][]).map(([k, cfg]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMetric(k)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                metric === k ? "bg-[#0057B8] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cfg.label} ({cfg.unit})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                LCWT (°C) ↓ / Ambient (°C) →
              </th>
              {ambientOptions.map(a => (
                <th
                  key={a}
                  className={`text-right text-[11px] font-semibold px-4 py-3 whitespace-nowrap ${
                    a === snappedAmbient ? "text-[#0057B8] bg-[#0057B8]/5" : "text-muted-foreground"
                  }`}
                >
                  {a}°C
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lcwtOptions.map(lcwt => {
              const isRowHighlight = lcwt === snappedLcwt;
              return (
                <tr
                  key={lcwt}
                  className={`border-b border-border/40 ${isRowHighlight ? "bg-[#0057B8]/5" : ""}`}
                >
                  <td className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap ${
                    isRowHighlight ? "text-[#0057B8]" : "text-muted-foreground"
                  }`}>
                    {lcwt}°C
                  </td>
                  {ambientOptions.map(amb => {
                    const point = matrix[String(lcwt)]?.[String(amb)];
                    const isCell = isRowHighlight && amb === snappedAmbient;
                    const value = point ? point[config.key] : null;
                    return (
                      <td
                        key={amb}
                        className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${
                          isCell
                            ? "text-[#0057B8] font-bold bg-[#0057B8]/10 ring-1 ring-inset ring-[#0057B8]/30"
                            : "text-foreground"
                        }`}
                      >
                        {value != null ? value.toFixed(1) : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {snappedLcwt != null && snappedAmbient != null && (
        <div className="px-5 py-3 border-t border-border/60 bg-[#0057B8]/[0.03] text-xs text-muted-foreground">
          Highlighted cell shows performance at the design point
          {designLcwtC != null && ` (LCWT ≈ ${designLcwtC.toFixed(1)}°C`}
          {designAmbientC != null && `, ambient ≈ ${designAmbientC.toFixed(1)}°C`}
          {designLcwtC != null && `, snapped to nearest tabulated values)`}.
        </div>
      )}
    </div>
  );
}

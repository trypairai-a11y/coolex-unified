"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/types/product";
import {
  FCL_SPEEDS,
  FCL_ESP_INWG,
  FCL_ROWS,
  parseFCLModel,
  getFCLMatrixByRows,
  type FCLRows,
  type FCLSpeed,
  type FCLPerfPoint,
} from "@/lib/mock-data/fcl-performance";
import { useUnitStore } from "@/lib/stores/unit-store";
import { btuhToKw, gpmToLps, ftWgToKpa } from "@/lib/utils/unit-conversions";

interface MetricDef {
  id: string;
  label: string;
  key: keyof FCLPerfPoint;
  // Imperial display.
  imp: { unit: string; fmt: (v: number) => string };
  // Metric display.
  met: { unit: string; fmt: (v: number) => string };
}

const METRICS: MetricDef[] = [
  {
    id: "total",
    label: "Total Capacity",
    key: "totalCapacityBtuh",
    imp: { unit: "Btu/h", fmt: (v) => Math.round(v).toLocaleString() },
    met: { unit: "kW", fmt: (v) => btuhToKw(v).toFixed(2) },
  },
  {
    id: "sensible",
    label: "Sensible Capacity",
    key: "sensibleCapacityBtuh",
    imp: { unit: "Btu/h", fmt: (v) => Math.round(v).toLocaleString() },
    met: { unit: "kW", fmt: (v) => btuhToKw(v).toFixed(2) },
  },
  {
    id: "flow",
    label: "Water Flow Rate",
    key: "waterFlowGPM",
    imp: { unit: "GPM", fmt: (v) => v.toFixed(2) },
    met: { unit: "L/s", fmt: (v) => gpmToLps(v).toFixed(2) },
  },
  {
    id: "wpd",
    label: "Water Pressure Drop",
    key: "waterPressureDropFtH2O",
    imp: { unit: "ft.wg", fmt: (v) => v.toFixed(2) },
    met: { unit: "kPa", fmt: (v) => ftWgToKpa(v).toFixed(1) },
  },
];

const fmtEsp = (e: number) => `${e.toFixed(1)}"`;

interface Props {
  model: Model;
  /** Design external static pressure (in. WG); highlighted column. */
  designEspInWG?: number | null;
}

function DesignStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground leading-tight mt-0.5">
        {value} <span className="text-[11px] font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export function FCLPerformancePanel({ model, designEspInWG }: Props) {
  const parsed = useMemo(() => parseFCLModel(model.modelNumber), [model.modelNumber]);
  const { unitSystem } = useUnitStore();
  const isMetric = unitSystem === "metric";

  const [rows, setRows] = useState<FCLRows>(() => parsed?.rows ?? 3);
  const [metricId, setMetricId] = useState<string>("total");

  const matrix = useMemo(
    () => (parsed ? getFCLMatrixByRows(parsed.base, rows) : null),
    [parsed, rows],
  );

  if (!parsed || !matrix) return null;

  const activeMetric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];
  const disp = isMetric ? activeMetric.met : activeMetric.imp;

  // Design point: HI speed at the design (or 0) external static, snapped to a
  // tabulated ESP column.
  const designEsp = FCL_ESP_INWG.reduce(
    (best, e) =>
      Math.abs(e - (designEspInWG ?? 0)) < Math.abs(best - (designEspInWG ?? 0)) ? e : best,
    FCL_ESP_INWG[0],
  );
  const designPoint = matrix.HI[designEsp];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Performance Data for This Unit
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {model.modelNumber} — {rows}-row coil · across fan speed and external static (in. WG)
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-background border border-border p-0.5">
          {METRICS.map((m) => {
            const unit = isMetric ? m.met.unit : m.imp.unit;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetricId(m.id)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  metricId === m.id
                    ? "bg-[#0057B8] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label} ({unit})
              </button>
            );
          })}
        </div>
      </div>

      {/* Coil-row selector + design point */}
      <div className="px-5 py-4 border-b border-border/60 bg-[#0057B8]/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#0057B8]">
              Design Point
            </p>
            <p className="text-[11px] text-muted-foreground">
              HI speed · {fmtEsp(designEsp)} ESP
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">Cooling coil</span>
            <div className="flex gap-1 rounded-lg bg-background border border-border p-0.5">
              {FCL_ROWS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRows(r)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                    rows === r ? "bg-[#0057B8] text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r} Row
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS.map((m) => {
            const d = isMetric ? m.met : m.imp;
            return (
              <DesignStat
                key={m.id}
                label={m.label}
                value={d.fmt(designPoint[m.key])}
                unit={d.unit}
              />
            );
          })}
        </div>
      </div>

      {/* Speed × ESP matrix for the active metric */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                Speed ↓ / ESP (in. WG) →
              </th>
              {FCL_ESP_INWG.map((e) => {
                const isDesignCol = e === designEsp;
                return (
                  <th
                    key={e}
                    className={`text-right text-[11px] font-semibold px-4 py-3 whitespace-nowrap ${
                      isDesignCol ? "text-[#0057B8] bg-[#0057B8]/5" : "text-muted-foreground"
                    }`}
                  >
                    {fmtEsp(e)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FCL_SPEEDS.map((speed) => {
              const isDesignRow = speed === "HI";
              return (
                <tr
                  key={speed}
                  className={`border-b border-border/40 ${isDesignRow ? "bg-[#0057B8]/5" : ""}`}
                >
                  <td
                    className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap ${
                      isDesignRow ? "text-[#0057B8]" : "text-muted-foreground"
                    }`}
                  >
                    {speed}
                  </td>
                  {FCL_ESP_INWG.map((e) => {
                    const point = matrix[speed as FCLSpeed][e];
                    const isDesignCell = isDesignRow && e === designEsp;
                    return (
                      <td
                        key={e}
                        className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${
                          isDesignCell
                            ? "font-bold text-[#0057B8] bg-[#0057B8]/10"
                            : e === designEsp
                              ? "bg-[#0057B8]/5 text-foreground"
                              : "text-foreground"
                        }`}
                      >
                        {disp.fmt(point[activeMetric.key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 border-t border-border/60 bg-muted/10">
        <p className="text-[11px] text-muted-foreground">
          Rated at 80/67&deg;F entering air (DB/WB), 45/55&deg;F entering/leaving chilled water.
          Highlighted cell is the rating point (HI speed at the design external static).
        </p>
      </div>
    </div>
  );
}

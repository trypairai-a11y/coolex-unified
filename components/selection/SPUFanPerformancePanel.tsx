"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/types/product";
import {
  SPU_FAN_ESP_INWG,
  SPU_FAN_NOTE,
  parseSPUFanBase,
  getSPUFanMatrix,
  getSPUFanCfmRows,
  getSPUFanPerformance,
  spuMotorHP,
  type SPUFanPoint,
} from "@/lib/mock-data/spu-fan-performance";
import { useUnitStore } from "@/lib/stores/unit-store";
import { cfmToM3h, hpToKw } from "@/lib/utils/unit-conversions";

// A displayed metric reads either straight off the fan point or through a
// derived getter (Motor HP is BHP × service factor). Imperial vs metric each
// carry their own unit + formatter.
interface MetricDef {
  id: string;
  label: string;
  get: (p: SPUFanPoint) => number;
  imp: { unit: string; fmt: (v: number) => string };
  met: { unit: string; fmt: (v: number) => string };
}

const METRICS: MetricDef[] = [
  {
    id: "rpm",
    label: "Fan Speed",
    get: (p) => p.rpm,
    imp: { unit: "RPM", fmt: (v) => Math.round(v).toLocaleString() },
    met: { unit: "RPM", fmt: (v) => Math.round(v).toLocaleString() },
  },
  {
    id: "bhp",
    label: "Absorbed Power",
    get: (p) => p.bhp,
    imp: { unit: "BHP", fmt: (v) => v.toFixed(2) },
    met: { unit: "kW", fmt: (v) => hpToKw(v).toFixed(2) },
  },
  {
    id: "motor",
    label: "Motor Power",
    get: (p) => spuMotorHP(p.bhp),
    imp: { unit: "HP", fmt: (v) => v.toFixed(2) },
    met: { unit: "kW", fmt: (v) => hpToKw(v).toFixed(2) },
  },
];

const fmtEsp = (e: number) => `${e.toFixed(2)}"`;

interface Props {
  model: Model;
  /** Design external static pressure (in. WG); highlighted column. */
  designEspInWG?: number | null;
  /** Design airflow (CFM); highlighted row. Falls back to the model's airflow. */
  designAirflowCFM?: number | null;
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

export function SPUFanPerformancePanel({ model, designEspInWG, designAirflowCFM }: Props) {
  const base = useMemo(() => parseSPUFanBase(model.modelNumber), [model.modelNumber]);
  const { unitSystem } = useUnitStore();
  const isMetric = unitSystem === "metric";

  const [metricId, setMetricId] = useState<string>("rpm");

  const matrix = useMemo(() => getSPUFanMatrix(model.modelNumber), [model.modelNumber]);
  const cfmRows = useMemo(() => getSPUFanCfmRows(model.modelNumber), [model.modelNumber]);

  if (!base || !matrix || cfmRows.length === 0) return null;

  const activeMetric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];
  const disp = isMetric ? activeMetric.met : activeMetric.imp;

  // Snap the design airflow/static to the nearest tabulated row/column.
  const targetCfm = designAirflowCFM ?? model.airflowCFM ?? cfmRows[0];
  const designCfm = cfmRows.reduce(
    (best, c) => (Math.abs(c - targetCfm) < Math.abs(best - targetCfm) ? c : best),
    cfmRows[0],
  );
  const designEsp = SPU_FAN_ESP_INWG.reduce(
    (best, e) =>
      Math.abs(e - (designEspInWG ?? 0)) < Math.abs(best - (designEspInWG ?? 0)) ? e : best,
    SPU_FAN_ESP_INWG[0],
  );
  // Interpolated design point (exact CFM/ESP, not snapped) for the stat strip.
  const designPoint =
    getSPUFanPerformance(model.modelNumber, targetCfm, designEspInWG ?? designEsp) ??
    matrix[designCfm][designEsp];

  const fmtCfm = (c: number) => (isMetric ? Math.round(cfmToM3h(c)).toLocaleString() : c.toLocaleString());

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Supply Fan Performance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {base} — across airflow and external static pressure (in. WG)
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

      {/* Design point strip */}
      <div className="px-5 py-4 border-b border-border/60 bg-[#0057B8]/[0.04]">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#0057B8]">
            Design Point
          </p>
          <p className="text-[11px] text-muted-foreground">
            {fmtCfm(targetCfm)} {isMetric ? "m³/h" : "CFM"} · {fmtEsp(designEspInWG ?? designEsp)} ESP
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {METRICS.map((m) => {
            const d = isMetric ? m.met : m.imp;
            return (
              <DesignStat key={m.id} label={m.label} value={d.fmt(m.get(designPoint))} unit={d.unit} />
            );
          })}
        </div>
      </div>

      {/* CFM × ESP matrix for the active metric */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                {isMetric ? "Airflow (m³/h)" : "Airflow (CFM)"} ↓ / ESP (in. WG) →
              </th>
              {SPU_FAN_ESP_INWG.map((e) => {
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
            {cfmRows.map((cfm) => {
              const isDesignRow = cfm === designCfm;
              return (
                <tr
                  key={cfm}
                  className={`border-b border-border/40 ${isDesignRow ? "bg-[#0057B8]/5" : ""}`}
                >
                  <td
                    className={`px-4 py-2.5 text-xs font-medium tabular-nums whitespace-nowrap ${
                      isDesignRow ? "text-[#0057B8]" : "text-muted-foreground"
                    }`}
                  >
                    {fmtCfm(cfm)}
                  </td>
                  {SPU_FAN_ESP_INWG.map((e) => {
                    const point = matrix[cfm][e];
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
                        {disp.fmt(activeMetric.get(point))}
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
        <p className="text-[11px] text-muted-foreground">{SPU_FAN_NOTE}</p>
      </div>
    </div>
  );
}

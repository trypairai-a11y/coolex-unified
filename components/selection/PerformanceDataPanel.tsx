"use client";

import { useMemo, useState } from "react";
import type { Model } from "@/types/product";
import {
  ACC_ST_MODELS,
  ACC_ST_AMBIENT_TEMPS_C,
  ACC_ST_LCWT_C,
  getACCSTPerformance,
} from "@/lib/mock-data/acc-st-models";
import {
  ACC_BP_MODELS,
  ACC_BP_AMBIENT_TEMPS_C,
  ACC_BP_LCWT_C,
  getACCBPPerformance,
} from "@/lib/mock-data/acc-bp-models";
import {
  DHAC_MODELS,
  DHAC_AMBIENT_TEMPS_F,
  DHAC_LCWT_F,
  getDHACPerformanceEnglish,
} from "@/lib/mock-data/dhac-models";
import {
  THAC_MODELS,
  THAC_AMBIENT_TEMPS_F,
  THAC_LCWT_F,
  getTHACPerformanceEnglish,
} from "@/lib/mock-data/thac-models";
import {
  CCU_MODELS,
  CCU_SST_F,
  CCU_AMBIENT_F,
  getCCUPerformance,
} from "@/lib/mock-data/ccu-models";
import {
  ACSC_60HZ_PERFORMANCE,
  ACSC_60HZ_LCWT_F,
  ACSC_60HZ_AMBIENT_F,
  getACSC60HzPerformance,
} from "@/lib/mock-data/acsc-60hz-performance";
import {
  ACSC_50HZ_PERFORMANCE,
  ACSC_50HZ_LCWT_F,
  ACSC_50HZ_AMBIENT_F,
  getACSC50HzPerformance,
} from "@/lib/mock-data/acsc-50hz-performance";
import {
  NGW_EWT_F,
  NGW_RATING_NOTE,
  getNGWMatrix,
  getNGWPerformance,
  getNGWCfmRows,
} from "@/lib/mock-data/ngw-performance";
import {
  FAPU_ENTERING_AIR_DB_F,
  FAPU_RATING_NOTE,
  getFAPUMatrix,
  getFAPUPerformance,
  getFAPUCfmRows,
} from "@/lib/mock-data/fapu-performance";
import {
  SPU_AMBIENT_F,
  SPU_RATING_NOTE,
  SPU_WB_BY_DB,
  getSPUMatrix,
  getSPUPerformance,
  getSPUCfmRows,
} from "@/lib/mock-data/spu-performance";
import {
  DSSF_AMBIENT_F,
  DSSF_RATING_NOTE,
  DSSF_WB_BY_DB,
  getDSSFMatrix,
  getDSSFPerformance,
  getDSSFCfmRows,
} from "@/lib/mock-data/dssf-cdef-performance";
import { btuhToKw, fToC, gpmToLps, lpsToGpm } from "@/lib/utils/unit-conversions";

const TONS_TO_KW = 3.51685;
const FTWG_TO_KPA = 2.98898;
import { useUnitStore } from "@/lib/stores/unit-store";

// Generic point — the matrix and metric configs use string keys to read from it.
type PerfPoint = Record<string, number>;

interface MetricConfig {
  id: string;
  label: string;
  unit: string;
  key: string;
  decimals: number;
  // Optional imperial display override (e.g. L/s → GPM). When in imperial mode
  // we transform the raw value through this and swap the unit.
  imperial?: { unit: string; transform: (v: number) => number; decimals: number };
  // Optional metric display override — used when the primary `unit` is imperial
  // (e.g. DHAC catalogue stores Tons/GPM/ft.wg natively).
  metric?: { unit: string; transform: (v: number) => number; decimals: number };
}

interface PerformanceSource {
  matrix: Record<string, Record<string, PerfPoint>>;
  yAxis: { label: string; unit: string; values: readonly number[]; designValue: number | null };
  xAxis: { label: string; unit: string; values: readonly number[]; designValue: number | null };
  metrics: MetricConfig[];
  designPoint: PerfPoint | null;
  axisValueFormat: (v: number) => string;
  // Optional catalogue footnote rendered beneath the table.
  note?: string;
}

const fmtAxis = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function getPerformanceSource(
  model: Model,
  designLcwtF: number | null,
  designAmbientF: number | null,
  designSstF: number | null,
  is60Hz: boolean,
  designAirflowCFM: number | null,
  designEwtF: number | null,
  designEnteringDBF: number | null,
): PerformanceSource | null {
  if (model.seriesId === "ngw") {
    const matrix = getNGWMatrix(model.modelNumber);
    const cfmRows = getNGWCfmRows(model.modelNumber);
    if (!matrix || cfmRows.length === 0) return null;
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "Airflow", unit: "CFM", values: cfmRows, designValue: designAirflowCFM },
      xAxis: { label: "Entering Water", unit: "°F", values: NGW_EWT_F, designValue: designEwtF },
      metrics: ngwMetrics(),
      designPoint: designAirflowCFM != null && designEwtF != null
        ? (getNGWPerformance(model.modelNumber, designAirflowCFM, designEwtF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
      note: NGW_RATING_NOTE,
    };
  }
  if (model.seriesId === "acsc" && is60Hz) {
    const matrix = ACSC_60HZ_PERFORMANCE[model.modelNumber];
    if (!matrix) return null;
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°F", values: ACSC_60HZ_LCWT_F, designValue: designLcwtF },
      xAxis: { label: "Ambient", unit: "°F", values: ACSC_60HZ_AMBIENT_F, designValue: designAmbientF },
      metrics: acscMetrics(),
      designPoint: designLcwtF != null && designAmbientF != null
        ? (getACSC60HzPerformance(model.modelNumber, designLcwtF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "acsc" && !is60Hz) {
    const matrix = ACSC_50HZ_PERFORMANCE[model.modelNumber];
    if (!matrix) return null;
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°F", values: ACSC_50HZ_LCWT_F, designValue: designLcwtF },
      xAxis: { label: "Ambient", unit: "°F", values: ACSC_50HZ_AMBIENT_F, designValue: designAmbientF },
      metrics: acscMetrics(),
      designPoint: designLcwtF != null && designAmbientF != null
        ? (getACSC50HzPerformance(model.modelNumber, designLcwtF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "acc-st") {
    const m = ACC_ST_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    const lcwtC = designLcwtF != null ? fToC(designLcwtF) : null;
    const ambC = designAmbientF != null ? fToC(designAmbientF) : null;
    return {
      matrix: m.performance as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°C", values: ACC_ST_LCWT_C, designValue: lcwtC },
      xAxis: { label: "Ambient", unit: "°C", values: ACC_ST_AMBIENT_TEMPS_C, designValue: ambC },
      metrics: chillerMetrics(),
      designPoint: lcwtC != null && ambC != null
        ? (getACCSTPerformance(model.modelNumber, lcwtC, ambC) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "acc-bp") {
    const m = ACC_BP_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    const lcwtC = designLcwtF != null ? fToC(designLcwtF) : null;
    const ambC = designAmbientF != null ? fToC(designAmbientF) : null;
    return {
      matrix: m.performance as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°C", values: ACC_BP_LCWT_C, designValue: lcwtC },
      xAxis: { label: "Ambient", unit: "°C", values: ACC_BP_AMBIENT_TEMPS_C, designValue: ambC },
      metrics: chillerMetrics(),
      designPoint: lcwtC != null && ambC != null
        ? (getACCBPPerformance(model.modelNumber, lcwtC, ambC) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "dhac") {
    const m = DHAC_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    return {
      matrix: m.performance as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°F", values: DHAC_LCWT_F, designValue: designLcwtF },
      xAxis: { label: "Ambient", unit: "°F", values: DHAC_AMBIENT_TEMPS_F, designValue: designAmbientF },
      metrics: englishChillerMetrics(),
      designPoint: designLcwtF != null && designAmbientF != null
        ? (getDHACPerformanceEnglish(model.modelNumber, designLcwtF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "thac") {
    const m = THAC_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    return {
      matrix: m.performance as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "LCWT", unit: "°F", values: THAC_LCWT_F, designValue: designLcwtF },
      xAxis: { label: "Ambient", unit: "°F", values: THAC_AMBIENT_TEMPS_F, designValue: designAmbientF },
      metrics: englishChillerMetrics(),
      designPoint: designLcwtF != null && designAmbientF != null
        ? (getTHACPerformanceEnglish(model.modelNumber, designLcwtF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "ccu-std") {
    const m = CCU_MODELS.find(x => x.modelNumber === model.modelNumber);
    if (!m) return null;
    return {
      matrix: m.performance as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "SST", unit: "°F", values: CCU_SST_F, designValue: designSstF },
      xAxis: { label: "Ambient", unit: "°F", values: CCU_AMBIENT_F, designValue: designAmbientF },
      metrics: ccuMetrics(),
      designPoint: designSstF != null && designAmbientF != null
        ? (getCCUPerformance(model.modelNumber, designSstF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
    };
  }
  if (model.seriesId === "fapu") {
    const matrix = getFAPUMatrix(model.modelNumber);
    const cfmRows = getFAPUCfmRows(model.modelNumber);
    if (!matrix || cfmRows.length === 0) return null;
    // Fresh-air unit: the entering-air DB axis is the outdoor/ambient temp.
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "Airflow", unit: "CFM", values: cfmRows, designValue: designAirflowCFM },
      xAxis: { label: "Entering Air", unit: "°F", values: FAPU_ENTERING_AIR_DB_F, designValue: designAmbientF },
      metrics: fapuMetrics(),
      designPoint: designAirflowCFM != null && designAmbientF != null
        ? (getFAPUPerformance(model.modelNumber, designAirflowCFM, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
      note: FAPU_RATING_NOTE,
    };
  }
  if (model.seriesId === "spu") {
    // Packaged unit: fix the entering-air DB/WB to the design condition (default
    // 80/67), then show the 2D table as Airflow (CFM) × Condenser Ambient.
    const edbF = designEnteringDBF ?? 80;
    const matrix = getSPUMatrix(model.modelNumber, edbF);
    const cfmRows = getSPUCfmRows(model.modelNumber);
    if (!matrix || cfmRows.length === 0) return null;
    const wb = SPU_WB_BY_DB[edbF];
    const dbLabel = wb ? `${edbF}/${wb} °F` : `${edbF} °F`;
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "Airflow", unit: "CFM", values: cfmRows, designValue: designAirflowCFM },
      xAxis: { label: "Ambient", unit: "°F", values: SPU_AMBIENT_F, designValue: designAmbientF },
      metrics: spuMetrics(),
      designPoint: designAirflowCFM != null && designAmbientF != null
        ? (getSPUPerformance(model.modelNumber, designAirflowCFM, edbF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
      note: `Entering air ${dbLabel}. ${SPU_RATING_NOTE}`,
    };
  }
  if (model.seriesId === "split-ds") {
    // Ducted split DX: fix the entering-air DB/WB to the design condition
    // (default 80/67), then show the 2D table as Airflow (CFM) × Condenser Ambient.
    const edbF = designEnteringDBF ?? 80;
    const matrix = getDSSFMatrix(model.modelNumber, edbF);
    const cfmRows = getDSSFCfmRows(model.modelNumber);
    if (!matrix || cfmRows.length === 0) return null;
    const wb = DSSF_WB_BY_DB[edbF];
    const dbLabel = wb ? `${edbF}/${wb} °F` : `${edbF} °F`;
    return {
      matrix: matrix as unknown as Record<string, Record<string, PerfPoint>>,
      yAxis: { label: "Airflow", unit: "CFM", values: cfmRows, designValue: designAirflowCFM },
      xAxis: { label: "Ambient", unit: "°F", values: DSSF_AMBIENT_F, designValue: designAmbientF },
      metrics: spuMetrics(),
      designPoint: designAirflowCFM != null && designAmbientF != null
        ? (getDSSFPerformance(model.modelNumber, designAirflowCFM, edbF, designAmbientF) as unknown as PerfPoint) ?? null
        : null,
      axisValueFormat: fmtAxis,
      note: `Entering air ${dbLabel}. ${DSSF_RATING_NOTE}`,
    };
  }
  return null;
}

function chillerMetrics(): MetricConfig[] {
  return [
    { id: "capacity",     label: "Cooling Capacity",    unit: "kW",  key: "capacityKW",            decimals: 1 },
    { id: "compressor",   label: "Compressor Power",    unit: "kW",  key: "compressorKW",          decimals: 1 },
    {
      id: "flow",
      label: "Water Flow Rate",
      unit: "L/s",
      key: "waterFlowLPS",
      decimals: 2,
      imperial: { unit: "GPM", transform: lpsToGpm, decimals: 1 },
    },
    { id: "pressureDrop", label: "Water Pressure Drop", unit: "kPa", key: "waterPressureDropKPa",  decimals: 1 },
  ];
}

function englishChillerMetrics(): MetricConfig[] {
  return [
    {
      id: "capacity",
      label: "Cooling Capacity",
      unit: "Tons",
      key: "capacityTons",
      decimals: 1,
      metric: { unit: "kW", transform: (v: number) => v * TONS_TO_KW, decimals: 1 },
    },
    { id: "compressor", label: "Compressor Power", unit: "kW", key: "compressorKW", decimals: 1 },
    {
      id: "flow",
      label: "Water Flow Rate",
      unit: "GPM",
      key: "waterFlowGPM",
      decimals: 1,
      metric: { unit: "L/s", transform: gpmToLps, decimals: 2 },
    },
    {
      id: "pressureDrop",
      label: "Water Pressure Drop",
      unit: "ft.wg",
      key: "waterPressureDropFtWg",
      decimals: 1,
      metric: { unit: "kPa", transform: (v: number) => v * FTWG_TO_KPA, decimals: 1 },
    },
  ];
}

function acscMetrics(): MetricConfig[] {
  return [
    {
      id: "capacity",
      label: "Cooling Capacity",
      unit: "Tons",
      key: "capacityTons",
      decimals: 1,
      metric: { unit: "kW", transform: (v: number) => v * TONS_TO_KW, decimals: 1 },
    },
    { id: "compressor", label: "Compressor Power", unit: "kW", key: "compressorKW", decimals: 1 },
    { id: "eer", label: "EER", unit: "", key: "eer", decimals: 2 },
    {
      id: "flow",
      label: "Water Flow Rate",
      unit: "GPM",
      key: "waterFlowGPM",
      decimals: 1,
      metric: { unit: "L/s", transform: gpmToLps, decimals: 2 },
    },
    {
      id: "pressureDrop",
      label: "Water Pressure Drop",
      unit: "ft.wg",
      key: "waterPressureDropFtWg",
      decimals: 1,
      metric: { unit: "kPa", transform: (v: number) => v * FTWG_TO_KPA, decimals: 1 },
    },
  ];
}

function fapuMetrics(): MetricConfig[] {
  return [
    {
      id: "total",
      label: "Total Capacity",
      unit: "Btu/h",
      key: "totalCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    {
      id: "sensible",
      label: "Sensible Capacity",
      unit: "Btu/h",
      key: "sensibleCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    { id: "power", label: "Power Input", unit: "kW", key: "kwInput", decimals: 2 },
  ];
}

function spuMetrics(): MetricConfig[] {
  return [
    {
      id: "total",
      label: "Total Capacity",
      unit: "Btu/h",
      key: "totalCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    {
      id: "sensible",
      label: "Sensible Capacity",
      unit: "Btu/h",
      key: "sensibleCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    { id: "power", label: "Power Input", unit: "kW", key: "kwInput", decimals: 2 },
  ];
}

function ngwMetrics(): MetricConfig[] {
  return [
    {
      id: "total",
      label: "Total Capacity",
      unit: "Btu/h",
      key: "totalCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    {
      id: "sensible",
      label: "Sensible Capacity",
      unit: "Btu/h",
      key: "sensibleCapacityBtuh",
      decimals: 0,
      metric: { unit: "kW", transform: btuhToKw, decimals: 1 },
    },
    {
      id: "flow",
      label: "Water Flow Rate",
      unit: "GPM",
      key: "waterFlowGPM",
      decimals: 1,
      metric: { unit: "L/s", transform: gpmToLps, decimals: 2 },
    },
    {
      id: "wpd",
      label: "Water Pressure Drop",
      unit: "ft.wg",
      key: "waterPressureDropFtH2O",
      decimals: 1,
      metric: { unit: "kPa", transform: (v: number) => v * FTWG_TO_KPA, decimals: 1 },
    },
  ];
}

function ccuMetrics(): MetricConfig[] {
  return [
    { id: "capacity",   label: "Total Capacity",  unit: "Btu/h", key: "totalCapacityBtuh", decimals: 0 },
    { id: "power",      label: "Power Input",     unit: "kW",    key: "powerInputKW",      decimals: 1 },
    { id: "condTemp",   label: "Condensing Temp", unit: "°F",    key: "condensingTempF",   decimals: 1 },
  ];
}

function bracketIndex(target: number, options: readonly number[]): { loIdx: number; hiIdx: number } {
  const sorted = [...options].sort((a, b) => a - b);
  if (target <= sorted[0]) return { loIdx: 0, hiIdx: 0 };
  if (target >= sorted[sorted.length - 1]) return { loIdx: sorted.length - 1, hiIdx: sorted.length - 1 };
  for (let i = 0; i < sorted.length - 1; i++) {
    if (target >= sorted[i] && target <= sorted[i + 1]) return { loIdx: i, hiIdx: i + 1 };
  }
  return { loIdx: 0, hiIdx: 0 };
}

interface Props {
  model: Model;
  designLcwtF?: number | null;
  designAmbientF?: number | null;
  designSstF?: number | null;
  is60Hz?: boolean;
  designAirflowCFM?: number | null;
  designEwtF?: number | null;
  designEnteringDBF?: number | null;
}

function formatMetricValue(metric: MetricConfig, value: number, isMetric: boolean): { display: string; unit: string } {
  if (!isMetric && metric.imperial) {
    return {
      display: metric.imperial.transform(value).toFixed(metric.imperial.decimals),
      unit: metric.imperial.unit,
    };
  }
  if (isMetric && metric.metric) {
    return {
      display: metric.metric.transform(value).toFixed(metric.metric.decimals),
      unit: metric.metric.unit,
    };
  }
  if (metric.decimals === 0) {
    return { display: Math.round(value).toLocaleString(), unit: metric.unit };
  }
  return { display: value.toFixed(metric.decimals), unit: metric.unit };
}

export function PerformanceDataPanel({ model, designLcwtF, designAmbientF, designSstF, is60Hz, designAirflowCFM, designEwtF, designEnteringDBF }: Props) {
  const source = useMemo(
    () => getPerformanceSource(model, designLcwtF ?? null, designAmbientF ?? null, designSstF ?? null, is60Hz ?? false, designAirflowCFM ?? null, designEwtF ?? null, designEnteringDBF ?? null),
    [model, designLcwtF, designAmbientF, designSstF, is60Hz, designAirflowCFM, designEwtF, designEnteringDBF],
  );
  const { unitSystem } = useUnitStore();
  const isMetric = unitSystem === "metric";
  const [metricId, setMetricId] = useState<string>(() => source?.metrics[0]?.id ?? "capacity");

  if (!source) return null;

  const { matrix, yAxis, xAxis, metrics, designPoint, axisValueFormat, note } = source;
  const activeMetric = metrics.find(m => m.id === metricId) ?? metrics[0];

  const yBrackets = yAxis.designValue != null ? bracketIndex(yAxis.designValue, yAxis.values) : null;
  const xBrackets = xAxis.designValue != null ? bracketIndex(xAxis.designValue, xAxis.values) : null;

  const yIsExact = yAxis.designValue != null && yAxis.values.includes(yAxis.designValue);
  const xIsExact = xAxis.designValue != null && xAxis.values.includes(xAxis.designValue);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Performance Data for This Unit
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {model.modelNumber} — across {xAxis.label.toLowerCase()} and {yAxis.label.toLowerCase()} ({yAxis.unit})
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-background border border-border p-0.5">
          {metrics.map(m => {
            const unit = !isMetric && m.imperial ? m.imperial.unit
              : isMetric && m.metric ? m.metric.unit
              : m.unit;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetricId(m.id)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  metricId === m.id ? "bg-[#0057B8] text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label} ({unit})
              </button>
            );
          })}
        </div>
      </div>

      {designPoint != null && yAxis.designValue != null && xAxis.designValue != null && (
        <div className="px-5 py-4 border-b border-border/60 bg-[#0057B8]/[0.04]">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#0057B8]">
              Design Point
            </p>
            <p className="text-[11px] text-muted-foreground">
              {yAxis.label} {yAxis.designValue.toFixed(1)}{yAxis.unit} · {xAxis.label} {xAxis.designValue.toFixed(1)}{xAxis.unit}
              {(!yIsExact || !xIsExact) && " · interpolated"}
            </p>
          </div>
          <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(metrics.length, 4)} gap-3`}>
            {metrics.map(m => {
              const v = designPoint[m.key];
              if (v == null) return null;
              const { display, unit } = formatMetricValue(m, v, isMetric);
              return <DesignStat key={m.id} label={m.label} value={display} unit={unit} />;
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left text-[11px] font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">
                {yAxis.label} ({yAxis.unit}) ↓ / {xAxis.label} ({xAxis.unit}) →
              </th>
              {xAxis.values.map((x, idx) => {
                const inBracket = xBrackets != null && (idx === xBrackets.loIdx || idx === xBrackets.hiIdx);
                return (
                  <th
                    key={x}
                    className={`text-right text-[11px] font-semibold px-4 py-3 whitespace-nowrap ${
                      inBracket ? "text-[#0057B8] bg-[#0057B8]/5" : "text-muted-foreground"
                    }`}
                  >
                    {axisValueFormat(x)}{xAxis.unit}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {yAxis.values.map((y, rowIdx) => {
              const isRowHighlight = yBrackets != null && (rowIdx === yBrackets.loIdx || rowIdx === yBrackets.hiIdx);
              return (
                <tr
                  key={y}
                  className={`border-b border-border/40 ${isRowHighlight ? "bg-[#0057B8]/5" : ""}`}
                >
                  <td className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap ${
                    isRowHighlight ? "text-[#0057B8]" : "text-muted-foreground"
                  }`}>
                    {axisValueFormat(y)}{yAxis.unit}
                  </td>
                  {xAxis.values.map((x, colIdx) => {
                    const point = matrix[String(y)]?.[String(x)];
                    const inXBracket = xBrackets != null && (colIdx === xBrackets.loIdx || colIdx === xBrackets.hiIdx);
                    const isCell = isRowHighlight && inXBracket;
                    const value = point ? point[activeMetric.key] : null;
                    const display = value != null
                      ? formatMetricValue(activeMetric, value, isMetric).display
                      : "—";
                    return (
                      <td
                        key={x}
                        className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${
                          isCell
                            ? "text-[#0057B8] font-semibold bg-[#0057B8]/10 ring-1 ring-inset ring-[#0057B8]/30"
                            : "text-foreground"
                        }`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {designPoint != null && (
        <div className="px-5 py-3 border-t border-border/60 bg-[#0057B8]/[0.03] text-xs text-muted-foreground">
          {xIsExact && yIsExact
            ? "Highlighted cell shows performance at the exact design point."
            : "Design-point values are bilinearly interpolated between the four highlighted cells (linear slope across each axis)."}
        </div>
      )}

      {note && (
        <div className="px-5 py-3 border-t border-border/60 text-[11px] italic text-muted-foreground">
          Note: {note}
        </div>
      )}
    </div>
  );
}

function DesignStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#0057B8]/15 px-3 py-2">
      <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-[#0057B8] tabular-nums">
        {value}
        <span className="ml-1 text-[11px] font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

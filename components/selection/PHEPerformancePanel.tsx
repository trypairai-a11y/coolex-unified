"use client";

import { Fragment, useState } from "react";
import { Thermometer, ChevronDown, ChevronUp } from "lucide-react";
import {
  PHE_CATALOGUE,
  PHE_AMBIENT_POINTS,
  getPHEAmbientPerformance,
  PHE_RATING_AMBIENT_C,
  PHE_AMBIENT_SLOPE_PER_C,
} from "@/lib/mock-data/phe-models";

const KW_PER_TON = 3.51685;

/** Nearest catalogue ambient point to the design ambient (°F). */
function activeLabelFor(designAmbientF?: number | null): "T1" | "T3" | "T4" | null {
  if (designAmbientF == null) return null;
  let best = PHE_AMBIENT_POINTS[0];
  for (const pt of PHE_AMBIENT_POINTS) {
    if (Math.abs(pt.ambientF - designAmbientF) < Math.abs(best.ambientF - designAmbientF)) best = pt;
  }
  return best.label;
}

function GeneralDataRow({
  label,
  values,
  group,
}: {
  label: string;
  values: (string | number | null)[];
  group?: boolean;
}) {
  return (
    <tr className={group ? "bg-[#F0F7FF]" : "border-t"}>
      <th
        scope="row"
        className={`px-3 py-1.5 text-left text-xs font-medium whitespace-nowrap ${
          group ? "text-[#0057B8] font-semibold" : "text-muted-foreground"
        }`}
      >
        {label}
      </th>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-1.5 text-center text-xs">
          {v == null || v === "" ? "–" : v}
        </td>
      ))}
    </tr>
  );
}

export function PHEPerformancePanel({ designAmbientF }: { designAmbientF?: number | null }) {
  const [showGeneral, setShowGeneral] = useState(false);
  const active = activeLabelFor(designAmbientF);
  const slopePct = (PHE_AMBIENT_SLOPE_PER_C * 100).toFixed(2);

  return (
    <section className="mt-8 rounded-xl border overflow-hidden">
      {/* Header + rating basis emphasis */}
      <div className="bg-[#0A1628] text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#00A3E0]" />
          <h3 className="text-sm font-semibold">PHCF-PHEF Precision Cooling — Performance Data</h3>
        </div>
        <p className="text-[11px] text-white/70 mt-1 leading-snug">
          Cooling capacity is rated at <span className="font-semibold text-white">48&nbsp;°C ambient (T4)</span>,
          24&nbsp;°C&nbsp;DB / 19.4&nbsp;°C&nbsp;WB entering air. T1 (35&nbsp;°C) and T3 (46&nbsp;°C) are
          calculated from the T4 rating using a linear air-cooled slope of ≈{slopePct}%/°C
          (capacity rises as ambient falls).
        </p>
      </div>

      {/* Ambient performance — cooling/sensible at T1 / T3 / T4 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th rowSpan={2} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground align-bottom">
                Model (Indoor / Outdoor)
              </th>
              {PHE_AMBIENT_POINTS.map((pt) => (
                <th
                  key={pt.label}
                  colSpan={2}
                  className={`px-3 py-2 text-center text-xs font-semibold border-l ${
                    active === pt.label ? "bg-[#E6F0FB] text-[#0057B8]" : "text-muted-foreground"
                  }`}
                >
                  {pt.label}
                  <span className="font-normal"> · {pt.ambientC.toFixed(pt.ambientC % 1 ? 1 : 0)} °C</span>
                  {pt.catalogue && <span className="block text-[10px] font-medium text-[#0057B8]">Catalogue rated</span>}
                  {!pt.catalogue && <span className="block text-[10px] font-normal text-muted-foreground">calculated</span>}
                </th>
              ))}
            </tr>
            <tr className="bg-muted/30 text-[10px] text-muted-foreground">
              {PHE_AMBIENT_POINTS.map((pt) => (
                <Fragment key={pt.label}>
                  <th className="px-2 py-1 font-medium border-l">Cooling kW</th>
                  <th className="px-2 py-1 font-medium">Sensible kW</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHE_CATALOGUE.map((spec) => {
              const rows = getPHEAmbientPerformance(spec);
              return (
                <tr key={spec.size} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="font-mono font-semibold text-foreground">{spec.indoorModel}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{spec.outdoorModel}</div>
                  </td>
                  {rows.map((r) => (
                    <Fragment key={r.label}>
                      <td
                        className={`px-2 py-2 text-center border-l ${
                          active === r.label ? "bg-[#E6F0FB]" : ""
                        }`}
                      >
                        <div className="font-semibold text-foreground">{r.coolingKW.toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {(r.coolingKW / KW_PER_TON).toFixed(1)} TR
                        </div>
                      </td>
                      <td
                        className={`px-2 py-2 text-center text-muted-foreground ${
                          active === r.label ? "bg-[#E6F0FB]" : ""
                        }`}
                      >
                        {r.sensibleKW.toFixed(1)}
                      </td>
                    </Fragment>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* General data (collapsible reference reproduction of the catalogue) */}
      <button
        type="button"
        onClick={() => setShowGeneral((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#0057B8] bg-[#F0F7FF] border-t hover:bg-[#E6F0FB] transition-colors"
      >
        <span>General Data (catalogue reference)</span>
        {showGeneral ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showGeneral && (
        <div className="overflow-x-auto">
          <GeneralDataTable />
        </div>
      )}

      {/* Operating range note */}
      <p className="px-4 py-3 text-[11px] text-muted-foreground leading-snug border-t bg-muted/20">
        <span className="font-semibold">Note:</span> Cooling capacity is based on 24&nbsp;°C&nbsp;DB / 19.4&nbsp;°C&nbsp;WB
        entering air and {PHE_RATING_AMBIENT_C}&nbsp;°C ambient temperature (T4). The unit can operate
        between 18.3&nbsp;°C (min) and 55&nbsp;°C (max) ambient. T1 / T3 capacities are calculated,
        not catalogue-tested points.
      </p>
    </section>
  );
}

function GeneralDataTable() {
  const m = PHE_CATALOGUE;

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-[#0A1628] text-white">
          <th className="px-3 py-2 text-left text-xs font-semibold">Indoor / Outdoor Model</th>
          {m.map((s) => (
            <th key={s.size} className="px-3 py-2 text-center text-xs font-semibold whitespace-nowrap">
              {s.designation}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <GeneralDataRow label="General Data" values={["", "", "", ""]} group />
        <GeneralDataRow label="Cooling, kW (@48 °C / T4)" values={m.map((s) => s.coolingKW)} />
        <GeneralDataRow label="Sensible, kW (@48 °C / T4)" values={m.map((s) => s.sensibleKW)} />
        <GeneralDataRow label="Power Supply (V/Ph/Hz)" values={m.map((s) => s.powerSupply)} />
        <GeneralDataRow label="Piping · Suction, mm" values={m.map((s) => s.piping.suctionMM)} />
        <GeneralDataRow label="Piping · Discharge, mm" values={m.map((s) => s.piping.dischargeMM)} />
        <GeneralDataRow label="Piping · Liquid, mm" values={m.map((s) => s.piping.liquidMM)} />

        <GeneralDataRow label="Indoor Unit (PHEF)" values={["", "", "", ""]} group />
        <GeneralDataRow label="Evaporator Blower · Type" values={m.map((s) => s.indoor.blowerType)} />
        <GeneralDataRow label="Evaporator Blower · Qty" values={m.map((s) => s.indoor.blowerQty)} />
        <GeneralDataRow label="Evaporator Blower · Nominal kW" values={m.map((s) => s.indoor.blowerNominalKW)} />
        <GeneralDataRow label="Airflow, CMH" values={m.map((s) => s.indoor.airflowCMH.toLocaleString())} />
        <GeneralDataRow label="Evaporator Coil · Type" values={m.map((s) => s.indoor.coilType)} />
        <GeneralDataRow label="Evaporator Coil · Row Deep" values={m.map((s) => s.indoor.coilRows)} />
        <GeneralDataRow label="Evaporator Coil · Total Area, m²" values={m.map((s) => s.indoor.coilAreaSqM)} />
        <GeneralDataRow label="Compressor · Qty" values={m.map((s) => s.indoor.compressorCount)} />
        <GeneralDataRow label="Refrigerant" values={m.map((s) => s.refrigerant)} />
        <GeneralDataRow label="Dimension H×W×D, mm" values={m.map((s) => s.indoor.dimsMM)} />

        <GeneralDataRow label="Outdoor Unit (PHCF)" values={["", "", "", ""]} group />
        <GeneralDataRow label="Condenser Fan · Type" values={m.map((s) => s.outdoor.condenserFanType)} />
        <GeneralDataRow label="Condenser Fan · Qty" values={m.map((s) => s.outdoor.condenserFanQty)} />
        <GeneralDataRow label="Condenser Fan · Nominal kW" values={m.map((s) => s.outdoor.condenserFanKW)} />
        <GeneralDataRow label="Condenser Coil · Type" values={m.map((s) => s.outdoor.coilType)} />
        <GeneralDataRow label="Condenser Coil · Row Deep" values={m.map((s) => s.outdoor.coilRows)} />
        <GeneralDataRow label="Condenser Coil · Total Area, m²" values={m.map((s) => s.outdoor.coilAreaSqM)} />
        <GeneralDataRow label="Dimension H×W×D, mm" values={m.map((s) => s.outdoor.dimsMM)} />
        <GeneralDataRow label="Weight, kg" values={m.map((s) => s.outdoor.weightKg)} />
      </tbody>
    </table>
  );
}

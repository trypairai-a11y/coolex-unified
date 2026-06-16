"use client";

import { cfmToM3h, round } from "@/lib/utils/unit-conversions";
import { getVRFIndoorCatalog } from "@/lib/mock-data/vrf-indoor";
import type { VRFIndoorType } from "@/types/selection";

interface Props {
  /** Indoor type whose catalogue table to render. */
  indoorType: VRFIndoorType;
  /** Model number to highlight as the selected unit (e.g. IWEF-00124DH). */
  activeModelNumber?: string;
  isMetric: boolean;
}

const KG_TO_LB = 2.205;

/**
 * Catalogue performance/spec table for a VRF indoor lineup that has real data
 * (see the registry in lib/mock-data/vrf-indoor.ts). Mirrors the printed
 * specification sheet: one row per model with the selected unit highlighted,
 * a per-model gas-pipe column, and a footer of the specs common to every size.
 * Renders nothing for synthesized (non-catalogue) indoor types.
 */
export function VRFIndoorPerformancePanel({
  indoorType,
  activeModelNumber,
  isMetric,
}: Props) {
  const catalog = getVRFIndoorCatalog(indoorType);
  if (!catalog) return null;
  const C = catalog.common;

  return (
    <div className="rounded-xl border border-[#E2E8F4] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F0F4FB] bg-[#0057B8]/[0.04]">
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#0057B8]">
          Performance Data
        </p>
        <h4 className="text-sm font-semibold text-[#0D1626]">{catalog.title}</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#F8FAFD] border-b border-[#E2E8F4] text-[#64748B]">
              <th className="text-left font-semibold px-3 py-2 whitespace-nowrap">Model</th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">
                Cooling{isMetric ? " (kW)" : " (Btu/h)"}
              </th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">
                Heating{isMetric ? " (kW)" : " (Btu/h)"}
              </th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">Fan (W)</th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">
                {isMetric ? "Airflow (m³/h)" : "Airflow (CFM)"}
              </th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">Rows</th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">
                {isMetric ? "Weight (kg)" : "Weight (lb)"}
              </th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">Gas</th>
              <th className="text-right font-semibold px-3 py-2 whitespace-nowrap">Liquid</th>
            </tr>
          </thead>
          <tbody>
            {catalog.specs.map((s) => {
              const isActive = s.modelNumber === activeModelNumber;
              const cooling = isMetric
                ? s.coolingCapacityKW.toFixed(1)
                : s.coolingCapacityBtuh.toLocaleString();
              const heating = isMetric
                ? s.heatingCapacityKW.toFixed(1)
                : s.heatingCapacityBtuh.toLocaleString();
              const airflow = isMetric
                ? round(cfmToM3h(s.airflowCFM), 0).toLocaleString()
                : s.airflowCFM.toLocaleString();
              const weight =
                s.bodyWeightKg == null
                  ? "—"
                  : isMetric
                    ? s.bodyWeightKg
                    : Math.round(s.bodyWeightKg * KG_TO_LB);
              return (
                <tr
                  key={s.modelNumber}
                  className={`border-b border-[#F0F4FB] tabular-nums ${
                    isActive ? "bg-[#0057B8]/10 font-semibold text-[#0057B8]" : "text-[#0D1626]"
                  }`}
                >
                  <td className="text-left px-3 py-2 whitespace-nowrap font-medium">
                    {s.modelNumber}
                  </td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{cooling}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{heating}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{s.fanMotorWattsLabel}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{airflow}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{s.coilRows}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{weight}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{s.gasPipe}</td>
                  <td className="text-right px-3 py-2 whitespace-nowrap">{s.liquidPipe}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-[#E2E8F4] bg-[#F8FAFD] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        <SpecLine label="Power supply" value={C.powerSupply} />
        <SpecLine label="Expansion device" value={C.expansionDevice} />
        <SpecLine label="Controller" value={C.controller} />
        <SpecLine label="Drain pipe" value={C.drainPipe} />
        {C.panelNetKg != null && (
          <SpecLine label="Panel weight" value={`${C.panelNetKg} kg net / ${C.panelGrossKg} kg gross`} />
        )}
        <SpecLine label="Evaporator coil" value={C.evaporatorCoil} className="col-span-2 sm:col-span-3" />
      </div>
    </div>
  );
}

function SpecLine({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB]">
        {label}:{" "}
      </span>
      <span className="text-[11px] font-medium text-[#0D1626]">{value}</span>
    </div>
  );
}

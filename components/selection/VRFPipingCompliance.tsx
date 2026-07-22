"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Ruler,
  XCircle,
} from "lucide-react";
import { mToFt } from "@/lib/utils/unit-conversions";
import type {
  PipeSize,
  PipingCheck,
  PipingCheckStatus,
  VRFPipingResult,
} from "@/lib/utils/vrf-piping";

const STATUS_STYLE: Record<
  PipingCheckStatus,
  { dot: string; text: string; chip: string; label: string }
> = {
  ok: {
    dot: "bg-[#16A34A]",
    text: "text-[#15803D]",
    chip: "bg-[#ECFDF3] border-[#ABEFC6] text-[#15803D]",
    label: "Within limits",
  },
  warning: {
    dot: "bg-[#D97706]",
    text: "text-[#B45309]",
    chip: "bg-[#FFFAEB] border-[#FEDF89] text-[#B45309]",
    label: "Needs attention",
  },
  violation: {
    dot: "bg-[#DC2626]",
    text: "text-[#B91C1C]",
    chip: "bg-[#FEF3F2] border-[#FECDCA] text-[#B91C1C]",
    label: "Exceeds limit",
  },
};

function formatM(valueM: number, isMetric: boolean): string {
  return isMetric ? `${valueM.toFixed(1)} m` : `${mToFt(valueM).toFixed(1)} ft`;
}

function sizeLabel(size: PipeSize): string {
  const suction = size.gasMm != null ? `Ø${size.gasMm.toFixed(2).replace(/\.?0+$/, "")}` : "—";
  const liq = size.liquidMm != null ? `Ø${size.liquidMm.toFixed(2).replace(/\.?0+$/, "")}` : "—";
  return `${suction} suction / ${liq} liquid`;
}

export function VRFPipingCompliance({
  result,
  isMetric,
}: {
  result: VRFPipingResult;
  isMetric: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result.hasIndoorUnits) return null;

  const { overall, checks, sizing } = result;
  const violations = checks.filter((c) => c.status === "violation").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const head = STATUS_STYLE[overall];

  const HeadIcon =
    overall === "ok" ? CheckCircle2 : overall === "warning" ? AlertTriangle : XCircle;
  const headline =
    overall === "ok"
      ? "Layout complies with the VRF piping guide"
      : overall === "warning"
      ? `${warnings} item${warnings === 1 ? "" : "s"} need${warnings === 1 ? "s" : ""} attention`
      : `${violations} piping rule${violations === 1 ? "" : "s"} exceeded`;
  const subline =
    overall === "ok"
      ? "All Section 4.3 length and level-difference limits are satisfied."
      : "Adjust pipe segment lengths or the layout to bring the design back within the catalogue limits.";

  return (
    <div className="rounded-2xl border border-[#E2E8F4] bg-white mb-4 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#F8FBFF] transition-colors"
      >
        <span
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${head.chip} border`}
        >
          <HeadIcon className={`w-5 h-5 ${head.text}`} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0D1626]">{headline}</p>
          <p className="text-[12px] text-[#64748B] truncate">{subline}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {violations > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3F2] border border-[#FECDCA] text-[#B91C1C]">
              {violations} over
            </span>
          )}
          {warnings > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFAEB] border border-[#FEDF89] text-[#B45309]">
              {warnings} warning{warnings === 1 ? "" : "s"}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#8894AB] transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {showDetails && (
        <div className="border-t border-[#EEF2F9] p-4 pt-3 space-y-4">
          {/* Length & level-difference checks */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB] mb-2">
              Permitted lengths &amp; level differences (Section 4.3)
            </p>
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <CheckRow key={c.id} check={c} isMetric={isMetric} />
              ))}
            </ul>
          </div>

          {/* Recommended pipe sizing */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8894AB] mb-2 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" /> Recommended pipe sizing (Section 4.4)
            </p>
            <div className="rounded-lg border border-[#E2E8F4] divide-y divide-[#EEF2F9]">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-[12px] font-medium text-[#0D1626]">
                  Main pipe (L1)
                </span>
                <span className="text-[12px] text-[#334155] text-right">
                  {sizeLabel(sizing.mainPipe)}
                </span>
              </div>
              {sizing.branchJointKit && (
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-[12px] font-medium text-[#0D1626]">
                    First branch-joint kit
                  </span>
                  <span className="text-[12px] text-[#334155]">{sizing.branchJointKit}</span>
                </div>
              )}
              {sizing.auxiliary.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="text-[12px] text-[#64748B] truncate">
                    Auxiliary → {a.name}
                  </span>
                  <span className="text-[12px] text-[#334155] text-right shrink-0">
                    {sizeLabel(a.size)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#8894AB] mt-1.5">
              Diameters in mm. Main pipe is sized to the larger of Tables 3-4.4 (indoor
              capacity) and 3-4.5 (outdoor capacity / equivalent length). Confirm against the
              full piping guide before ordering.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ check, isMetric }: { check: PipingCheck; isMetric: boolean }) {
  const s = STATUS_STYLE[check.status];
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] font-medium text-[#0D1626]">
            <span className="text-[10px] font-semibold text-[#8894AB] mr-1.5">
              {check.ref}
            </span>
            {check.label}
          </span>
          <span className={`text-[12px] font-semibold shrink-0 ${s.text}`}>
            {formatM(check.valueM, isMetric)}
            <span className="text-[#94A3B8] font-normal">
              {" "}
              / {formatM(check.limitM, isMetric)}
            </span>
          </span>
        </div>
        {check.status !== "ok" && (
          <p className="text-[11px] text-[#64748B] mt-0.5">{check.detail}</p>
        )}
      </div>
    </li>
  );
}

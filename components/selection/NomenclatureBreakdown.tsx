"use client";

import { useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  decodeNomenclature,
  getFullNomenclatureSegments,
  buildOracleBOM,
  getOptionBOMCode,
  type NomenclatureSegment,
} from "@/lib/nomenclature";

// ── Compact inline breakdown (for ResultsTable rows) ────────────────────────

interface NomenclatureInlineProps {
  modelNumber: string;
  seriesId: string;
}

export function NomenclatureInline({ modelNumber, seriesId }: NomenclatureInlineProps) {
  const segments = useMemo(
    () => decodeNomenclature(modelNumber, seriesId),
    [modelNumber, seriesId],
  );

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {segments.map((seg, i) => (
        <span key={i} className="group/seg relative">
          <span
            className={`inline-block px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded border ${seg.color}`}
          >
            {seg.code}
          </span>
          {i < segments.length - 1 && (
            <span className="text-muted-foreground/40 text-[10px] mx-0.5">-</span>
          )}
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] bg-foreground text-background rounded shadow-lg whitespace-nowrap opacity-0 group-hover/seg:opacity-100 transition-opacity pointer-events-none z-50">
            <span className="font-semibold">{seg.label}:</span> {seg.meaning}
          </span>
        </span>
      ))}
    </div>
  );
}

// ── Full breakdown panel (for Options & Submittal steps) ────────────────────

interface NomenclatureBreakdownProps {
  modelNumber: string;
  seriesId: string;
  selectedOptionIds?: string[];
  showOracleBOM?: boolean;
  compact?: boolean;
}

export function NomenclatureBreakdown({
  modelNumber,
  seriesId,
  selectedOptionIds = [],
  showOracleBOM = true,
  compact = false,
}: NomenclatureBreakdownProps) {
  const [copied, setCopied] = useState(false);

  const fullSegments = useMemo(
    () => getFullNomenclatureSegments(modelNumber, seriesId),
    [modelNumber, seriesId],
  );

  const bom = useMemo(
    () => buildOracleBOM(modelNumber, seriesId, selectedOptionIds),
    [modelNumber, seriesId, selectedOptionIds],
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bom.oracleBOM);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <SegmentChips segments={fullSegments} />
        {showOracleBOM && <BOMCodeLine code={bom.oracleBOM} copied={copied} onCopy={handleCopy} />}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Unit Nomenclature
        </h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Model breakdown &amp; Oracle BOM reference
        </p>
      </div>

      {/* Segment chips */}
      <div className="px-4 py-3 border-b border-border/40">
        <SegmentChips segments={fullSegments} />
      </div>

      {/* Segment legend */}
      <div className="px-4 py-2 border-b border-border/40 bg-muted/10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          {fullSegments.map((seg, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px]">
              <span className={`inline-block w-2 h-2 rounded-full mt-0.5 shrink-0 ${seg.color.split(' ')[0]}`} />
              <div>
                <span className="font-medium text-foreground">{seg.label}:</span>{" "}
                <span className="text-muted-foreground">{seg.meaning}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Option codes */}
      {selectedOptionIds.length > 0 && (
        <div className="px-4 py-2 border-b border-border/40">
          <div className="text-[11px] text-muted-foreground mb-1 font-medium">Option Codes</div>
          <div className="flex flex-wrap gap-1">
            {selectedOptionIds.map(id => {
              const code = getOptionBOMCode(id);
              if (!code) return null;
              return (
                <span
                  key={id}
                  className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {code}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Oracle BOM string */}
      {showOracleBOM && (
        <div className="px-4 py-3">
          <BOMCodeLine code={bom.oracleBOM} copied={copied} onCopy={handleCopy} />
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function SegmentChips({ segments }: { segments: NomenclatureSegment[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {segments.map((seg, i) => (
        <span key={i} className="group/seg relative">
          <span
            className={`inline-block px-2 py-1 text-xs font-mono font-semibold rounded border ${seg.color} cursor-default`}
          >
            {seg.code}
          </span>
          {i < segments.length - 1 && (
            <span className="text-muted-foreground/30 text-xs mx-0.5">-</span>
          )}
          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] bg-foreground text-background rounded shadow-lg whitespace-nowrap opacity-0 group-hover/seg:opacity-100 transition-opacity pointer-events-none z-50">
            <span className="font-semibold">{seg.label}:</span> {seg.meaning}
          </span>
        </span>
      ))}
    </div>
  );
}

function BOMCodeLine({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[11px] text-muted-foreground font-medium shrink-0">Oracle BOM:</div>
      <code className="flex-1 text-xs font-mono font-semibold text-[#0057B8] bg-blue-50/50 px-2 py-1 rounded border border-blue-100 truncate">
        {code}
      </code>
      <button
        onClick={onCopy}
        className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
        title="Copy BOM code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

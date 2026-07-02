"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import type { Project } from "@/types/project";
import type { QuotationInfo, QuotationLine } from "@/types/quotation";
import { PRODUCT_SERIES } from "@/lib/mock-data/product-series";
import { unitBasePriceKWD } from "@/lib/utils/pricing";

// Lazily load the PDF preview to avoid SSR issues with @react-pdf/renderer.
const QuotationPDFContent = dynamic(() => import("./QuotationPDFContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[550px] text-muted-foreground">
      Loading PDF preview...
    </div>
  ),
});

interface QuotationDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the signed-in user, used as the default "Prepared By". */
  preparedByDefault?: string;
}

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);

/** Stable 4-digit sequence derived from the project id. */
function seqFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return String(h % 10000).padStart(4, "0");
}

/** Short line-item descriptor from the unit's series. */
function describeUnit(seriesId: string, fallback: string, refrigerant?: string): string {
  const series = PRODUCT_SERIES.find((s) => s.id === seriesId);
  const base = series?.fullName || fallback || "HVAC Unit";
  const ref = refrigerant || series?.primaryRefrigerant;
  return ref ? `${base} · ${ref}` : base;
}

function buildLines(project: Project): QuotationLine[] {
  return project.units.map((u) => {
    const series = PRODUCT_SERIES.find((s) => s.id === u.seriesId);
    return {
      id: u.id,
      imageUrl: series?.imageUrl,
      model: u.model.modelNumber,
      description: describeUnit(u.seriesId, u.seriesName, u.model.refrigerant),
      capacityBtuh: Math.round(u.model.totalCapacityBtuh),
      quantity: u.quantity,
      unitPriceKWD: unitBasePriceKWD(u.model, u.submittalData),
    };
  });
}

export function QuotationDialog({ project, open, onOpenChange, preparedByDefault }: QuotationDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [info, setInfo] = useState<QuotationInfo | null>(null);
  const [lines, setLines] = useState<QuotationLine[]>([]);

  // (Re)initialise state each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const today = new Date();
    const year = today.getFullYear();
    const validDays = 14;
    const until = new Date(today);
    until.setDate(until.getDate() + validDays);
    setInfo({
      quotationNumber: `QT-${year}-${seqFromId(project.id)}`,
      date: fmtDate(today),
      validUntil: fmtDate(until),
      validDays,
      preparedBy: preparedByDefault || project.salesEngineer || "",
      department: "Engineering Selection",
      branch: "Kuwait",
      currency: "KWD",
      location: project.country || "Kuwait",
      vatExclusive: true,
      vatRate: 5,
    });
    setLines(buildLines(project));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project.id]);

  // Debounce the props fed to the (expensive) PDF renderer so typing stays smooth.
  const [preview, setPreview] = useState<{ info: QuotationInfo; lines: QuotationLine[] } | null>(null);
  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setPreview({ info, lines }), 350);
    return () => clearTimeout(t);
  }, [info, lines]);

  const updateInfo = (patch: Partial<QuotationInfo>) =>
    setInfo((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      // Keep validUntil in sync when validDays changes.
      if (patch.validDays !== undefined) {
        const base = new Date();
        const until = new Date(base);
        until.setDate(until.getDate() + (patch.validDays || 0));
        next.validUntil = fmtDate(until);
      }
      return next;
    });

  const setLinePrice = (id: string, value: number) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, unitPriceKWD: value } : l)));

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPriceKWD * l.quantity, 0), [lines]);

  const handleDownload = async () => {
    if (!info) return;
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { QuotationDoc } = await import("./QuotationPDFContent");
      const blob = await pdf(
        <QuotationDoc
          projectName={project.name}
          projectId={project.displayId ?? project.id}
          info={info}
          lines={lines}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COOLEX_Quotation_${info.quotationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (!info) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>Quotation — {project.name}</span>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-[#0057B8] hover:bg-[#004494] text-white gap-1.5"
            >
              {downloading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Downloading...</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Download PDF</>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-[320px_1fr] gap-4">
          {/* ── Editable fields ── */}
          <div className="overflow-y-auto pr-2 space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quotation Number</Label>
                <Input
                  className="h-8 text-sm"
                  value={info.quotationNumber}
                  onChange={(e) => updateInfo({ quotationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prepared By</Label>
                <Input
                  className="h-8 text-sm"
                  value={info.preparedBy}
                  onChange={(e) => updateInfo({ preparedBy: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Input
                    className="h-8 text-sm"
                    value={info.department}
                    onChange={(e) => updateInfo({ department: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <Input
                    className="h-8 text-sm"
                    value={info.branch}
                    onChange={(e) => updateInfo({ branch: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Location</Label>
                  <Input
                    className="h-8 text-sm"
                    value={info.location}
                    onChange={(e) => updateInfo({ location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Input
                    className="h-8 text-sm"
                    value={info.currency}
                    onChange={(e) => updateInfo({ currency: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valid (days)</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={info.validDays}
                    onChange={(e) => updateInfo({ validDays: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">VAT Rate (%)</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    disabled={info.vatExclusive}
                    value={info.vatRate}
                    onChange={(e) => updateInfo({ vatRate: Number(e.target.value) })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={info.vatExclusive}
                  onCheckedChange={(v) => updateInfo({ vatExclusive: v === true })}
                />
                Prices exclusive of VAT
              </label>
            </div>

            {/* Per-line unit prices */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Unit Prices ({info.currency})</Label>
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{l.model}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      × {l.quantity} · {l.capacityBtuh.toLocaleString()} BTU/hr
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    className="h-8 w-28 text-sm text-right"
                    value={l.unitPriceKWD}
                    onChange={(e) => setLinePrice(l.id, Number(e.target.value))}
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-[#0057B8]">
                  {info.currency} {subtotal.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>
          </div>

          {/* ── Live preview ── */}
          <div className="min-h-0 rounded-lg overflow-hidden border bg-gray-100">
            {preview && (
              <QuotationPDFContent
                projectName={project.name}
                projectId={project.displayId ?? project.id}
                info={preview.info}
                lines={preview.lines}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

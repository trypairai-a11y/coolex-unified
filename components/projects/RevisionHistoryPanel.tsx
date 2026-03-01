"use client";

import { Download, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Revision, Unit } from "@/types/project";

interface RevisionHistoryPanelProps {
  unit: Unit | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  issued: CheckCircle2,
  superseded: XCircle,
  draft: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  issued: "text-green-600",
  superseded: "text-muted-foreground",
  draft: "text-amber-600",
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function RevisionHistoryPanel({ unit, open, onClose }: RevisionHistoryPanelProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Revision History</SheetTitle>
          <SheetDescription>
            {unit ? `${unit.tag} — ${unit.reference}` : ""}
          </SheetDescription>
        </SheetHeader>

        {unit && (
          <div className="space-y-1">
            {/* Current revision badge */}
            <div className="bg-[#E8F2FF] border border-[#0057B8]/20 rounded-lg px-4 py-3 mb-4">
              <div className="text-xs text-[#0057B8] font-semibold">Current: Rev. {unit.currentRevision}</div>
              <div className="text-sm font-medium text-foreground mt-0.5">{unit.model.modelNumber}</div>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {[...unit.revisions].reverse().map((rev: Revision) => {
                  const StatusIcon = STATUS_ICONS[rev.status] ?? Clock;
                  const isCurrent = rev.revisionNumber === unit.currentRevision;
                  return (
                    <div key={rev.id} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background ${isCurrent ? "border-[#0057B8]" : "border-border"}`}>
                        <StatusIcon className={`w-4 h-4 ${STATUS_COLORS[rev.status]}`} />
                      </div>
                      <div className={`flex-1 rounded-lg border p-3 ${isCurrent ? "border-[#0057B8] bg-[#E8F2FF]/40" : "bg-card"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">Rev. {rev.revisionNumber}</span>
                            {isCurrent && <Badge variant="default" className="text-xs">Current</Badge>}
                            <Badge
                              variant={rev.status === "issued" ? "success" : rev.status === "draft" ? "warning" : "secondary"}
                              className="text-xs capitalize"
                            >
                              {rev.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">{rev.changeSummary}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(rev.createdAt)} · {rev.createdBy}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

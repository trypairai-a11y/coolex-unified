"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { Project } from "@/types/project";

// Lazily load the PDF content component to avoid SSR issues with @react-pdf/renderer
const SelectionSheetPDFContent = dynamic(
  () => import("./SelectionSheetPDFContent"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[550px] text-muted-foreground">Loading PDF preview...</div> }
);

interface SelectionSheetDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectionSheetDialog({ project, open, onOpenChange }: SelectionSheetDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { SelectionSheetDoc } = await import("./SelectionSheetPDFContent");
      const blob = await pdf(<SelectionSheetDoc project={project} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_Selection_Sheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Selection Sheet — {project.name}</span>
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
        <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-gray-100">
          {mounted && open && <SelectionSheetPDFContent project={project} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

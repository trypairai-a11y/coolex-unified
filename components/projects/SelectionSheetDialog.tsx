"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Path,
  Rect,
  Line,
  pdf,
} from "@react-pdf/renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, Loader2 } from "lucide-react";
import type { Project, Unit } from "@/types/project";

// Register standard fonts
Font.register({ family: "Helvetica", fonts: [] });

const COOLEX_BLUE = "#0057B8";
const COOLEX_NAVY = "#002D5C";
const COOLEX_ACCENT = "#00A3E0";
const LIGHT_GRAY = "#F8FAFC";
const BORDER_COLOR = "#E2E8F0";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 36,
    backgroundColor: "#FFFFFF",
    color: "#1E293B",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: COOLEX_NAVY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    justifyContent: "space-between",
  },
  headerLogo: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerCompany: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  headerSub: { fontSize: 7, color: "rgba(255,255,255,0.7)" },
  headerRight: { alignItems: "flex-end" },
  headerRightText: { fontSize: 8, color: "rgba(255,255,255,0.8)" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: LIGHT_GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: "#64748B" },
  footerPage: { fontSize: 7, color: "#64748B" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COOLEX_NAVY, marginBottom: 4 },
  subtitle: { fontSize: 11, color: COOLEX_BLUE, marginBottom: 16 },
  badge: {
    backgroundColor: COOLEX_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_BLUE,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COOLEX_BLUE,
  },
  kvRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
  kvLabel: { fontSize: 8, color: "#64748B", width: 140, fontFamily: "Helvetica-Bold" },
  kvValue: { fontSize: 8, flex: 1, color: "#1E293B" },
  table: { borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: COOLEX_NAVY, paddingVertical: 5, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tableRow: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: BORDER_COLOR },
  tableRowAlt: { backgroundColor: LIGHT_GRAY },
  tableCell: { fontSize: 8, color: "#334155" },
  tableCellBold: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1E293B" },
});

function PdfLogoMark() {
  return (
    <Svg width={30} height={30} viewBox="0 0 48 48">
      <Rect x={0} y={0} width={48} height={48} rx={8} fill={COOLEX_BLUE} />
      <Path
        d="M33 14 L18 14 C15 14 13 16 13 19 L13 29 C13 32 15 34 18 34 L33 34"
        stroke={COOLEX_ACCENT}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={22} y1={18} x2={37} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" />
      <Line x1={37} y1={18} x2={22} y2={30} stroke="white" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function PageHeader() {
  return (
    <View style={s.header} fixed>
      <View style={s.headerLogo}>
        <PdfLogoMark />
        <View style={{ marginLeft: 8 }}>
          <Text style={s.headerCompany}>COOLEX</Text>
          <Text style={s.headerSub}>Refrigeration Industries & Storage Co.</Text>
        </View>
      </View>
      <View style={s.headerRight}>
        <Text style={[s.headerRightText, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>SELECTION SHEET</Text>
        <Text style={s.headerRightText}>Equipment Summary</Text>
      </View>
    </View>
  );
}

function PageFooter({ date }: { date: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>
        COOLEX / RIC · P.O. Box 123, Kuwait City, Kuwait · Tel: +965 2XXX XXXX
      </Text>
      <Text style={s.footerPage}>
        {date} · Page <Text render={({ pageNumber }) => `${pageNumber}`} /> of{" "}
        <Text render={({ totalPages }) => `${totalPages}`} />
      </Text>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

// Column widths (must sum to reasonable total)
const COL = { no: 25, tag: 55, series: 50, model: 75, tons: 45, cfm: 50, qty: 30, rev: 35 };

function SelectionSheetDoc({ project }: { project: Project }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document title={`${project.name} - Selection Sheet`}>
      <Page size="A4" style={s.page}>
        <PageHeader />
        <PageFooter date={date} />

        {/* Cover section */}
        <View style={{ marginTop: 20 }}>
          <View style={s.badge}>
            <Text style={s.badgeText}>SELECTION SHEET</Text>
          </View>
          <Text style={s.title}>{project.name}</Text>
          <Text style={s.subtitle}>{project.units.length} Equipment Unit{project.units.length !== 1 ? "s" : ""}</Text>
        </View>

        {/* Project details */}
        <Text style={s.sectionTitle}>Project Details</Text>
        <View style={{ marginBottom: 16 }}>
          <KV label="Project ID" value={project.id} />
          <KV label="Client" value={project.clientName || "Not set"} />
          <KV label="Sales Engineer" value={project.salesEngineer || "Not set"} />
          <KV label="Submitted For" value={project.submittedFor || "Not set"} />
          <KV label="Country" value={project.country || "Not set"} />
          <KV label="Status" value={project.status.charAt(0).toUpperCase() + project.status.slice(1)} />
          <KV label="Created" value={formatDate(project.createdAt)} />
          <KV label="Last Modified" value={formatDate(project.updatedAt)} />
        </View>

        {/* Equipment table */}
        <Text style={s.sectionTitle}>Equipment Units</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: COL.no }]}>#</Text>
            <Text style={[s.tableHeaderCell, { width: COL.tag }]}>Tag</Text>
            <Text style={[s.tableHeaderCell, { width: COL.series }]}>Series</Text>
            <Text style={[s.tableHeaderCell, { width: COL.model }]}>Model</Text>
            <Text style={[s.tableHeaderCell, { width: COL.tons }]}>Capacity</Text>
            <Text style={[s.tableHeaderCell, { width: COL.cfm }]}>Airflow</Text>
            <Text style={[s.tableHeaderCell, { width: COL.qty }]}>Qty</Text>
            <Text style={[s.tableHeaderCell, { width: COL.rev }]}>Rev</Text>
          </View>
          {project.units.map((unit: Unit, i: number) => (
            <View key={unit.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCellBold, { width: COL.no }]}>{i + 1}</Text>
              <Text style={[s.tableCell, { width: COL.tag }]}>{unit.tag || "—"}</Text>
              <Text style={[s.tableCell, { width: COL.series }]}>{unit.seriesName}</Text>
              <Text style={[s.tableCellBold, { width: COL.model }]}>{unit.model.modelNumber}</Text>
              <Text style={[s.tableCell, { width: COL.tons }]}>{unit.model.nominalTons} TR</Text>
              <Text style={[s.tableCell, { width: COL.cfm }]}>
                {unit.model.airflowCFM ? `${unit.model.airflowCFM.toLocaleString()} CFM` : "—"}
              </Text>
              <Text style={[s.tableCell, { width: COL.qty }]}>{unit.quantity}</Text>
              <Text style={[s.tableCell, { width: COL.rev }]}>Rev. {unit.currentRevision}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={{ backgroundColor: "#EFF6FF", borderLeftWidth: 3, borderLeftColor: COOLEX_BLUE, padding: 10, borderRadius: 2, marginTop: 8 }}>
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: COOLEX_NAVY, marginBottom: 4 }}>
            Total Equipment
          </Text>
          <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: COOLEX_BLUE }}>
            {project.units.length} unit{project.units.length !== 1 ? "s" : ""} ·{" "}
            {project.units.reduce((sum, u) => sum + u.quantity, 0)} total qty ·{" "}
            {project.units.reduce((sum, u) => sum + u.model.nominalTons * u.quantity, 0)} TR total capacity
          </Text>
        </View>

        {/* Generated timestamp */}
        <View style={{ marginTop: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: BORDER_COLOR }}>
          <Text style={{ fontSize: 7, color: "#94A3B8" }}>
            Generated on {date} · COOLEX Unified Selector
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false }
);

interface SelectionSheetDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectionSheetDialog({ project, open, onOpenChange }: SelectionSheetDialogProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
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
          <PDFViewer width="100%" height={550} style={{ border: "none" }}>
            <SelectionSheetDoc project={project} />
          </PDFViewer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

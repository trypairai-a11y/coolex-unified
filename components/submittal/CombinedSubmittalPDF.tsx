"use client";

import React from "react";
import { Page, Text, View, pdf, Document } from "@react-pdf/renderer";
import type { Project } from "@/types/project";
import type { ProjectInfoFormData } from "@/types/selection";
import {
  styles,
  PageHeader,
  PageFooter,
  SectionBar,
  UnitSubmittalPages,
  VRFReportPages,
  templateKind,
} from "./coolex-pdf-kit";

// ─── Combined PDF Document ──────────────────────────────────────────────────

interface CombinedSubmittalPDFDocProps {
  project: Project;
  showPricing: boolean;
}

function CombinedSubmittalPDFDoc({ project, showPricing }: CombinedSubmittalPDFDocProps) {
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  /** Build a ProjectInfoFormData view for a unit so it can reuse the single-unit sheet. */
  const infoFor = (unitTag: string, reference: string): ProjectInfoFormData => ({
    projectId: project.displayId ?? project.id,
    projectName: project.name,
    clientName: project.clientName,
    unitReference: reference,
    unitTag,
    quantity: 1,
    submittedFor: project.submittedFor,
    country: project.country,
    salesEngineer: project.salesEngineer,
  });

  return (
    <Document title={`${project.name} - Combined Submittal`}>
      {/* ── PROJECT COVER ───────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />

        <View style={styles.titleBar}>
          <Text style={styles.titleBarText}>PROJECT SUBMITTAL</Text>
        </View>
        <Text style={styles.subtitle}>{project.name}</Text>

        <View style={{ flexDirection: "row", marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            {([
              ["Project Name", project.name],
              ["Client", project.clientName || "-"],
              ["Sales Engineer", project.salesEngineer || "-"],
            ] as [string, string][]).map(([l, v]) => (
              <View key={l} style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90, fontSize: 8, fontFamily: "Helvetica-Bold" }}>{l}</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#333", borderBottomWidth: 0.7, borderBottomColor: "#000", flex: 1, marginRight: 10 }}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            {([
              ["Submitted For", project.submittedFor || "-"],
              ["Country", project.country || "-"],
              ["Date", today],
              ["Total Units", String(project.units.length)],
            ] as [string, string][]).map(([l, v]) => (
              <View key={l} style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90, fontSize: 8, fontFamily: "Helvetica-Bold" }}>{l}</Text>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#333", borderBottomWidth: 0.7, borderBottomColor: "#000", flex: 1, marginRight: 10 }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionBar title="EQUIPMENT SCHEDULE" />
        <View style={styles.tHead}>
          {["#", "Tag", "Series", "Model", "TR", "Qty", "Rev."].map((h, i) => (
            <Text key={h} style={[styles.tHeadCell, { flex: [0.5, 1.4, 1.6, 2, 0.8, 0.6, 0.7][i] }]}>{h}</Text>
          ))}
        </View>
        {project.units.map((unit, i) => (
          <View key={unit.id} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
            <Text style={[styles.tCell, { flex: 0.5 }]}>{i + 1}</Text>
            <Text style={[styles.tCell, { flex: 1.4, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{unit.tag || "-"}</Text>
            <Text style={[styles.tCell, { flex: 1.6, textAlign: "left" }]}>{unit.seriesName}</Text>
            <Text style={[styles.tCell, { flex: 2, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{unit.model.modelNumber}</Text>
            <Text style={[styles.tCell, { flex: 0.8 }]}>{unit.model.nominalTons}</Text>
            <Text style={[styles.tCell, { flex: 0.6 }]}>{unit.quantity}</Text>
            <Text style={[styles.tCell, { flex: 0.7, borderRightWidth: 0 }]}>{unit.currentRevision}</Text>
          </View>
        ))}
      </Page>

      {/* ── PER-UNIT SHEETS ─────────────────────────────────────────────── */}
      {project.units.map((unit) => {
        const sd = unit.submittalData;
        const info = infoFor(unit.tag, unit.reference);
        const isVRF = templateKind(unit.model.seriesId) === "vrf";

        if (isVRF && sd?.vrfLayout) {
          return (
            <VRFReportPages
              key={unit.id}
              outdoorModel={unit.model}
              projectInfo={info}
              vrfLayout={sd.vrfLayout}
              revisionNumber={unit.currentRevision}
              generatedBy={sd.generatedBy ?? project.salesEngineer ?? ""}
            />
          );
        }

        return (
          <UnitSubmittalPages
            key={unit.id}
            model={unit.model}
            projectInfo={info}
            designConditions={sd?.designConditions}
            selectedOptions={sd?.selectedOptions ?? []}
            revisionNumber={unit.currentRevision}
            generatedBy={sd?.generatedBy ?? project.salesEngineer ?? ""}
            unitSystem="imperial"
            unitTag={unit.tag}
            quantity={unit.quantity}
          />
        );
      })}

      {/* ── PROJECT PRICING SUMMARY ─────────────────────────────────────── */}
      {showPricing && project.units.length > 1 && (
        <Page size="A4" style={styles.page}>
          <PageHeader />
          <PageFooter />
          <SectionBar title="PROJECT PRICING SUMMARY (INTERNAL)" />
          <View style={styles.tHead}>
            {["#", "Tag", "Model", "Qty", "Unit (KWD)", "Total (KWD)"].map((h, i) => (
              <Text key={h} style={[styles.tHeadCell, { flex: [0.5, 1.4, 2, 0.6, 1.2, 1.2][i] }]}>{h}</Text>
            ))}
          </View>
          {project.units.map((unit, i) => {
            const net = unit.submittalData?.netTotalKWD ?? Math.round(unit.model.nominalTons * 185 * 0.95);
            return (
              <View key={unit.id} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
                <Text style={[styles.tCell, { flex: 0.5 }]}>{i + 1}</Text>
                <Text style={[styles.tCell, { flex: 1.4, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{unit.tag || "-"}</Text>
                <Text style={[styles.tCell, { flex: 2, textAlign: "left" }]}>{unit.model.modelNumber}</Text>
                <Text style={[styles.tCell, { flex: 0.6 }]}>{unit.quantity}</Text>
                <Text style={[styles.tCell, { flex: 1.2 }]}>{net.toLocaleString()}</Text>
                <Text style={[styles.tCell, { flex: 1.2, borderRightWidth: 0, fontFamily: "Helvetica-Bold", color: "#0057B8" }]}>{(net * unit.quantity).toLocaleString()}</Text>
              </View>
            );
          })}
          {(() => {
            const grand = project.units.reduce((s, u) => s + (u.submittalData?.netTotalKWD ?? Math.round(u.model.nominalTons * 185 * 0.95)) * u.quantity, 0);
            return (
              <View style={{ flexDirection: "row", paddingVertical: 4, marginTop: 6, backgroundColor: "#EEF3F9" }}>
                <Text style={{ flex: 1, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0057B8", paddingLeft: 4 }}>Grand Total (All Units)</Text>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0057B8", paddingRight: 4 }}>KWD {grand.toLocaleString()}</Text>
              </View>
            );
          })()}
          <Text style={{ fontSize: 6.5, color: "#94A3B8", marginTop: 8 }}>
            * Internal pricing — excludes installation, freight, and VAT.
          </Text>
        </Page>
      )}
    </Document>
  );
}

export { CombinedSubmittalPDFDoc };

/** Generate a combined PDF blob for download */
export async function generateCombinedPDFBlob(project: Project, showPricing: boolean): Promise<Blob> {
  return pdf(<CombinedSubmittalPDFDoc project={project} showPricing={showPricing} />).toBlob();
}

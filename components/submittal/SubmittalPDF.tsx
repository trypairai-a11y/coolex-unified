"use client";

import React from "react";
import { Document, Page, Text, View, PDFViewer } from "@react-pdf/renderer";
import type { Model } from "@/types/product";
import type { ProjectInfoFormData, DesignConditionsFormData, VRFLayout } from "@/types/selection";
import type { SubmittalOption } from "@/types/submittal";
import type { UnitSystem } from "@/lib/stores/unit-store";
import {
  styles,
  PageHeader,
  PageFooter,
  SectionBar,
  UnitSubmittalPages,
  VRFReportPages,
  templateKind,
} from "./coolex-pdf-kit";

// ─── PDF Document ───────────────────────────────────────────────────────────

interface SubmittalPDFDocProps {
  model: Model;
  projectInfo: ProjectInfoFormData;
  designConditions: DesignConditionsFormData;
  selectedOptions: SubmittalOption[];
  basePriceKWD: number;
  optionsTotalKWD: number;
  discountPercent: number;
  netTotalKWD: number;
  showPricing: boolean;
  revisionNumber: string;
  generatedBy: string;
  oracleBOM?: string;
  unitSystem?: UnitSystem;
  /** VRF system layout — present only for VRF selections; drives the multi-page report. */
  vrfLayout?: VRFLayout;
}

function SubmittalPDFDoc({
  model,
  projectInfo,
  designConditions,
  selectedOptions,
  showPricing,
  basePriceKWD,
  optionsTotalKWD,
  discountPercent,
  netTotalKWD,
  revisionNumber,
  generatedBy,
  oracleBOM,
  unitSystem = "imperial",
  vrfLayout,
}: SubmittalPDFDocProps) {
  const isVRF = templateKind(model.seriesId) === "vrf";

  return (
    <Document title={`${projectInfo.projectName} - ${model.modelNumber} - Rev.${revisionNumber}`}>
      {isVRF && vrfLayout ? (
        <VRFReportPages
          outdoorModel={model}
          projectInfo={projectInfo}
          vrfLayout={vrfLayout}
          revisionNumber={revisionNumber}
          generatedBy={generatedBy}
        />
      ) : (
        <UnitSubmittalPages
          model={model}
          projectInfo={projectInfo}
          designConditions={designConditions}
          selectedOptions={selectedOptions}
          revisionNumber={revisionNumber}
          generatedBy={generatedBy}
          unitSystem={unitSystem}
        />
      )}

      {/* Internal pricing page (hidden from dealers). Mirrors the catalogue
          submittal which has no price page, so this is appended only when the
          viewer is allowed to see pricing. */}
      {showPricing && (
        <Page size="A4" style={styles.page}>
          <PageHeader />
          <PageFooter />
          <SectionBar title="PRICING SUMMARY (INTERNAL)" />
          <View style={{ marginTop: 8 }}>
            {oracleBOM && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1A1A1A" }}>Oracle BOM</Text>
                <Text style={{ fontSize: 9, color: "#0057B8", fontFamily: "Helvetica-Bold" }}>{oracleBOM}</Text>
              </View>
            )}
            {([
              ["Base Unit Price", `KWD ${basePriceKWD.toLocaleString()}`],
              ["Options Total", `KWD ${optionsTotalKWD.toLocaleString()}`],
              [`Discount (${discountPercent}%)`, `- KWD ${Math.round((basePriceKWD + optionsTotalKWD) * discountPercent / 100).toLocaleString()}`],
            ] as [string, string][]).map(([l, v]) => (
              <View key={l} style={{ flexDirection: "row", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: "#BFC7D2" }}>
                <Text style={{ width: 160, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#1A1A1A" }}>{l}</Text>
                <Text style={{ fontSize: 8.5, color: "#333" }}>{v}</Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", paddingVertical: 4, marginTop: 4, backgroundColor: "#EEF3F9" }}>
              <Text style={{ width: 160, fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0057B8", paddingLeft: 2 }}>Net Total (per unit)</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0057B8" }}>KWD {netTotalKWD.toLocaleString()}</Text>
            </View>
            <Text style={{ fontSize: 6.5, color: "#94A3B8", marginTop: 8 }}>
              * Internal pricing — prices valid 30 days from issue date and exclude installation, freight, and VAT.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

// ─── Exported Viewer ─────────────────────────────────────────────────────────

export function SubmittalPDFViewer(props: SubmittalPDFDocProps) {
  return (
    <PDFViewer width="100%" height={700} style={{ border: "none" }}>
      <SubmittalPDFDoc {...props} />
    </PDFViewer>
  );
}

export { SubmittalPDFDoc };

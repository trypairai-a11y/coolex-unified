"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Font,
  Svg,
  Path,
  Rect,
  Line,
} from "@react-pdf/renderer";
import type { Model } from "@/types/product";
import type { ProjectInfoFormData, DesignConditionsFormData } from "@/types/selection";
import type { SubmittalOption } from "@/types/submittal";

// Register standard fonts
Font.register({
  family: "Helvetica",
  fonts: [],
});

const COOLEX_BLUE = "#0057B8";
const COOLEX_NAVY = "#002D5C";
const COOLEX_ACCENT = "#00A3E0";
const LIGHT_GRAY = "#F8FAFC";
const BORDER_COLOR = "#E2E8F0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 36,
    backgroundColor: "#FFFFFF",
    color: "#1E293B",
  },
  // Header
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
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogoBox: {
    width: 28,
    height: 28,
    backgroundColor: COOLEX_BLUE,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogoText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  headerCompany: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 7,
    color: "rgba(255,255,255,0.7)",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerRightText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.8)",
  },
  // Footer
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
  footerText: {
    fontSize: 7,
    color: "#64748B",
  },
  footerPage: {
    fontSize: 7,
    color: "#64748B",
  },
  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_BLUE,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COOLEX_BLUE,
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COOLEX_NAVY,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableCell: {
    fontSize: 8,
    flex: 1,
    color: "#334155",
  },
  tableCellBold: {
    fontSize: 8,
    flex: 1,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  // KV pairs
  kvRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  kvLabel: {
    fontSize: 8,
    color: "#64748B",
    width: 140,
    fontFamily: "Helvetica-Bold",
  },
  kvValue: {
    fontSize: 8,
    flex: 1,
    color: "#1E293B",
  },
  // Cover
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_NAVY,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontSize: 13,
    color: COOLEX_BLUE,
    marginBottom: 20,
  },
  coverBadge: {
    backgroundColor: COOLEX_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  coverBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Highlight box
  highlightBox: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: COOLEX_BLUE,
    padding: 10,
    marginBottom: 12,
    borderRadius: 2,
  },
  highlightBoxTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_NAVY,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_BLUE,
  },
  // Two column
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
});

// PDF Logo Mark using react-pdf SVG primitives
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

// Page Header Component
function PageHeader({ pageTitle }: { pageTitle: string }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLogo}>
        <PdfLogoMark />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.headerCompany}>COOLEX</Text>
          <Text style={styles.headerSub}>Refrigeration Industries & Storage Co.</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Text style={[styles.headerRightText, { fontFamily: "Helvetica-Bold", fontSize: 9 }]}>{pageTitle}</Text>
        <Text style={styles.headerRightText}>Technical Submittal Document</Text>
      </View>
    </View>
  );
}

// Page Footer Component
function PageFooter({ revisionNumber, date }: { revisionNumber: string; date: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        COOLEX / RIC · P.O. Box 123, Kuwait City, Kuwait · Tel: +965 2XXX XXXX · Fax: +965 2XXX XXXX
      </Text>
      <Text style={styles.footerPage}>
        Rev. {revisionNumber} · {date} · Page{" "}
        <Text render={({ pageNumber }) => `${pageNumber}`} />{" "}
        of{" "}
        <Text render={({ totalPages }) => `${totalPages}`} />
      </Text>
    </View>
  );
}

// KV Row
function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{String(value)}</Text>
    </View>
  );
}

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
}

function SubmittalPDFDoc({
  model,
  projectInfo,
  designConditions,
  selectedOptions,
  basePriceKWD,
  optionsTotalKWD,
  discountPercent,
  netTotalKWD,
  showPricing,
  revisionNumber,
  generatedBy,
}: SubmittalPDFDocProps) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const conditions = designConditions as unknown as Record<string, unknown>;

  return (
    <Document title={`${projectInfo.projectName} — ${model.modelNumber} — Rev.${revisionNumber}`}>
      {/* ── PAGE 1: COVER ─────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="COVER PAGE" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>TECHNICAL SUBMITTAL — REV. {revisionNumber}</Text>
          </View>
          <Text style={styles.coverTitle}>{projectInfo.projectName}</Text>
          <Text style={styles.coverSubtitle}>{model.modelNumber} — {model.nominalTons} Tons</Text>

          <View style={[styles.highlightBox, { marginBottom: 16 }]}>
            <Text style={styles.highlightBoxTitle}>Selected Model</Text>
            <Text style={styles.highlightValue}>{model.modelNumber}</Text>
            <Text style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
              {(model.totalCapacityBtuh / 12000).toFixed(1)} Tons · {model.eer} EER · {model.powerKW} kW · {model.compressorCount} Compressor{model.compressorCount > 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Project Details</Text>
              <KV label="Project Name" value={projectInfo.projectName} />
              <KV label="Client / Submitted For" value={projectInfo.submittedFor ?? ""} />
              <KV label="Unit Tag" value={projectInfo.unitTag ?? ""} />
              <KV label="Unit Reference" value={projectInfo.unitReference ?? ""} />
              <KV label="Quantity" value={projectInfo.quantity ?? 1} />
              <KV label="Country" value={projectInfo.country ?? ""} />
              <KV label="Sales Engineer" value={projectInfo.salesEngineer ?? ""} />
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Document Details</Text>
              <KV label="Revision" value={revisionNumber} />
              <KV label="Issue Date" value={date} />
              <KV label="Prepared By" value={generatedBy} />
              <KV label="Document Status" value="Issued for Review" />
            </View>
          </View>
        </View>
      </Page>

      {/* ── PAGE 2: PERFORMANCE DATA ───────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="PERFORMANCE DATA" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Design Input Conditions</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <KV label="Required Cooling Cap." value={`${((conditions.requiredCoolingCapacityBtuh as number ?? 0) / 1000).toFixed(0)}k Btu/h`} />
              <KV label="Power Supply" value={String(conditions.powerSupply ?? "")} />
              <KV label="Ambient Temp" value={`${conditions.ambientTempF ?? ""}°F`} />
              <KV label="Entering DB" value={`${conditions.enteringDBF ?? ""}°F`} />
              <KV label="Entering WB" value={`${conditions.enteringWBF ?? ""}°F`} />
            </View>
            <View style={styles.col}>
              <KV label="ESP" value={`${conditions.espInWG ?? "0"} in. WG`} />
              <KV label="Electric Heater" value={`${conditions.electricHeaterKW ?? "0"} kW`} />
              <KV label="Altitude" value={`${conditions.altitudeFt ?? "0"} ft`} />
              {Boolean(conditions.enteringWaterTempF) && <KV label="EWT" value={`${conditions.enteringWaterTempF}°F`} />}
              {Boolean(conditions.leavingWaterTempF) && <KV label="LWT" value={`${conditions.leavingWaterTempF}°F`} />}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Performance Output</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {["Parameter", "Value", "Unit"].map(h => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {[
              ["Total Cooling Capacity", (model.totalCapacityBtuh / 1000).toFixed(0) + "k", "Btu/h"],
              ["Sensible Capacity", (model.sensibleCapacityBtuh / 1000).toFixed(0) + "k", "Btu/h"],
              ["Total Power Input", model.powerKW.toString(), "kW"],
              ["EER", model.eer.toString(), "Btu/(W·h)"],
              ["Airflow", model.airflowCFM.toLocaleString(), "CFM"],
              ["Leaving DB", model.leavingDBF.toString(), "°F"],
              ["Leaving WB", model.leavingWBF.toString(), "°F"],
              ["# Compressors", model.compressorCount.toString(), "—"],
              ["Match to Request", model.matchPercent.toString(), "%"],
            ].map(([param, val, unit], i) => (
              <View key={param} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={styles.tableCellBold}>{param}</Text>
                <Text style={[styles.tableCell, { color: COOLEX_BLUE, fontFamily: "Helvetica-Bold" }]}>{val}</Text>
                <Text style={styles.tableCell}>{unit}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ── PAGE 3: TECHNICAL DATA ─────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="TECHNICAL DATA" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Compressor Section</Text>
              <KV label="Number of Compressors" value={model.compressorCount} />
              <KV label="Type" value="Hermetic Scroll" />
              <KV label="Crankcase Heater" value="Standard" />
              <KV label="High Pressure Switch" value="Manual Reset" />
              <KV label="Low Pressure Switch" value="Auto Reset" />

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Condenser Section</Text>
              <KV label="Type" value="Air-Cooled (Fin & Tube)" />
              <KV label="Coil Material" value="Aluminum Fins / Copper Tubes" />
              <KV label="Fan Type" value="Propeller, Direct Drive" />
              <KV label="Fan Motors" value="Totally Enclosed" />
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Evaporator Section</Text>
              <KV label="Type" value="Fin & Tube, Direct Expansion" />
              <KV label="Coil Material" value="Aluminum Fins / Copper Tubes" />
              <KV label="Expansion Device" value="Thermal Expansion Valve" />
              <KV label="Drain Pan" value="Galvanized Steel" />

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Protections</Text>
              <KV label="Phase Failure Protection" value="Standard" />
              <KV label="Phase Reversal Protection" value="Standard" />
              <KV label="High Discharge Temp" value="Standard" />
              <KV label="Anti-Freeze Protection" value="Standard" />
              <KV label="Loss of Charge" value="Standard" />
            </View>
          </View>
        </View>
      </Page>

      {/* ── PAGE 4: GENERAL & DIMENSIONS ──────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="GENERAL & DIMENSIONS" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>General Data</Text>
              <KV label="Model Number" value={model.modelNumber} />
              <KV label="Nominal Capacity" value={`${model.nominalTons} Tons`} />
              <KV label="Refrigerant" value="R-410A" />
              <KV label="Cabinet Finish" value="Powder-Coated, RAL 7035" />
              <KV label="Operating Ambient" value="59°F – 130°F" />
              <KV label="Operating Voltage" value="380V / 3Ph / 60Hz" />

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Installation</Text>
              <KV label="Mounting" value="Floor / Rooftop" />
              <KV label="Vibration Isolators" value="Optional (rubber pads standard)" />
              <KV label="Refrigerant Connections" value="Sweat (copper)" />
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Physical Dimensions</Text>
              <KV label="Unit Weight" value={`${model.weightLbs} lbs (${Math.round(model.weightLbs * 0.453)} kg)`} />
              <KV label="Length" value={`${model.lengthIn} in (${Math.round(model.lengthIn * 25.4)} mm)`} />
              <KV label="Width" value={`${model.widthIn} in (${Math.round(model.widthIn * 25.4)} mm)`} />
              <KV label="Height" value={`${model.heightIn} in (${Math.round(model.heightIn * 25.4)} mm)`} />

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Sound Data</Text>
              <KV label="Sound Pressure" value="≤ 72 dB(A) @ 10 ft" />
              <KV label="Sound Power" value="≤ 84 dB(A)" />
            </View>
          </View>

          {/* Dimension drawing placeholder */}
          <View style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 4,
            padding: 16,
            backgroundColor: LIGHT_GRAY,
            alignItems: "center",
            justifyContent: "center",
            height: 160,
          }}>
            <Text style={{ fontSize: 10, color: "#94A3B8", fontFamily: "Helvetica-Bold" }}>
              UNIT DIMENSION DRAWING
            </Text>
            <Text style={{ fontSize: 8, color: "#94A3B8", marginTop: 4 }}>
              {model.lengthIn}" (L) × {model.widthIn}" (W) × {model.heightIn}" (H)
            </Text>
            <Text style={{ fontSize: 7, color: "#CBD5E1", marginTop: 8 }}>
              [Three-view drawing: Top / Front / Side — engineering drawing to be inserted]
            </Text>
          </View>
        </View>
      </Page>

      {/* ── PAGE 5: OPTIONS & PRICING ─────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="OPTIONS & PRICING" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Selected Options</Text>

          {selectedOptions.length === 0 ? (
            <Text style={{ fontSize: 8, color: "#64748B", marginBottom: 12 }}>No additional options selected.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Option</Text>
                {showPricing && <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>KWD</Text>}
              </View>
              {selectedOptions.map((opt, i) => (
                <View key={opt.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{opt.label}</Text>
                  {showPricing && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                      {opt.priceAdderKWD.toFixed(0)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {showPricing && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionTitle}>Pricing Summary</Text>
              <KV label="Base Unit Price" value={`KWD ${basePriceKWD.toLocaleString()}`} />
              <KV label="Options Total" value={`KWD ${optionsTotalKWD.toLocaleString()}`} />
              <KV label={`Discount (${discountPercent}%)`} value={`- KWD ${Math.round((basePriceKWD + optionsTotalKWD) * discountPercent / 100).toLocaleString()}`} />
              <View style={[styles.kvRow, { backgroundColor: "#EFF6FF", paddingHorizontal: 4, borderRadius: 2 }]}>
                <Text style={[styles.kvLabel, { fontSize: 10, color: COOLEX_BLUE }]}>Net Total (per unit)</Text>
                <Text style={[styles.kvValue, { fontSize: 12, fontFamily: "Helvetica-Bold", color: COOLEX_BLUE }]}>
                  KWD {netTotalKWD.toLocaleString()}
                </Text>
              </View>
              <Text style={{ fontSize: 7, color: "#94A3B8", marginTop: 8 }}>
                * Prices valid for 30 days from issue date. Prices exclude installation, freight, and VAT.
              </Text>
            </View>
          )}
        </View>
      </Page>

      {/* ── PAGE 6: DRAWING ───────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="DIMENSIONAL DRAWING" />
        <PageFooter revisionNumber={revisionNumber} date={date} />

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Unit Dimensional Drawing — {model.modelNumber}</Text>

          {/* Top view placeholder */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", marginBottom: 4 }}>TOP VIEW</Text>
            <View style={{
              borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 2,
              backgroundColor: LIGHT_GRAY, height: 120, justifyContent: "center", alignItems: "center",
            }}>
              <View style={{
                borderWidth: 2, borderColor: COOLEX_NAVY, width: model.lengthIn * 1.2, maxWidth: 300,
                height: model.widthIn * 1.2, maxHeight: 80, justifyContent: "center", alignItems: "center",
              }}>
                <Text style={{ fontSize: 7, color: COOLEX_NAVY }}>{model.lengthIn}" × {model.widthIn}"</Text>
              </View>
            </View>
          </View>

          <View style={styles.twoCol}>
            {/* Front view */}
            <View style={styles.col}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", marginBottom: 4 }}>FRONT VIEW</Text>
              <View style={{
                borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 2,
                backgroundColor: LIGHT_GRAY, height: 140, justifyContent: "center", alignItems: "center",
              }}>
                <View style={{
                  borderWidth: 2, borderColor: COOLEX_NAVY,
                  width: Math.min(model.lengthIn * 0.8, 120), height: Math.min(model.heightIn * 0.8, 90),
                  justifyContent: "center", alignItems: "center",
                }}>
                  <Text style={{ fontSize: 7, color: COOLEX_NAVY }}>{model.lengthIn}" × {model.heightIn}"</Text>
                </View>
              </View>
            </View>
            {/* Side view */}
            <View style={styles.col}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#475569", marginBottom: 4 }}>SIDE VIEW</Text>
              <View style={{
                borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 2,
                backgroundColor: LIGHT_GRAY, height: 140, justifyContent: "center", alignItems: "center",
              }}>
                <View style={{
                  borderWidth: 2, borderColor: COOLEX_NAVY,
                  width: Math.min(model.widthIn * 0.8, 80), height: Math.min(model.heightIn * 0.8, 90),
                  justifyContent: "center", alignItems: "center",
                }}>
                  <Text style={{ fontSize: 7, color: COOLEX_NAVY }}>{model.widthIn}" × {model.heightIn}"</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Key Dimensions (mm)</Text>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <KV label="Length (L)" value={`${Math.round(model.lengthIn * 25.4)} mm`} />
                <KV label="Width (W)" value={`${Math.round(model.widthIn * 25.4)} mm`} />
                <KV label="Height (H)" value={`${Math.round(model.heightIn * 25.4)} mm`} />
              </View>
              <View style={styles.col}>
                <KV label="Operating Weight" value={`${Math.round(model.weightLbs * 0.453)} kg`} />
                <KV label="Shipping Weight" value={`${Math.round(model.weightLbs * 0.453 * 1.08)} kg`} />
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Exported Viewer ─────────────────────────────────────────────────────────

interface SubmittalPDFViewerProps {
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
}

export function SubmittalPDFViewer(props: SubmittalPDFViewerProps) {
  return (
    <PDFViewer width="100%" height={700} style={{ border: "none" }}>
      <SubmittalPDFDoc {...props} />
    </PDFViewer>
  );
}

export { SubmittalPDFDoc };

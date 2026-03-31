"use client";

import React from "react";
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
} from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import type { Project, Unit } from "@/types/project";

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
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COOLEX_BLUE,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COOLEX_BLUE,
  },
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
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
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
        <Text style={styles.headerRightText}>Combined Technical Submittal</Text>
      </View>
    </View>
  );
}

function PageFooter({ date }: { date: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        COOLEX / RIC · P.O. Box 123, Kuwait City, Kuwait · Tel: +965 2XXX XXXX · Fax: +965 2XXX XXXX
      </Text>
      <Text style={styles.footerText}>
        {date} · Page{" "}
        <Text render={({ pageNumber }) => `${pageNumber}`} />{" "}
        of{" "}
        <Text render={({ totalPages }) => `${totalPages}`} />
      </Text>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{String(value)}</Text>
    </View>
  );
}

// ─── Combined PDF Document ──────────────────────────────────────────────────

interface CombinedSubmittalPDFDocProps {
  project: Project;
  showPricing: boolean;
}

function CombinedSubmittalPDFDoc({ project, showPricing }: CombinedSubmittalPDFDocProps) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document title={`${project.name} - Combined Submittal`}>
      {/* ── PROJECT COVER PAGE ─── */}
      <Page size="A4" style={styles.page}>
        <PageHeader pageTitle="PROJECT COVER" />
        <PageFooter date={date} />

        <View style={{ marginTop: 20 }}>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>COMBINED TECHNICAL SUBMITTAL</Text>
          </View>
          <Text style={styles.coverTitle}>{project.name}</Text>
          <Text style={styles.coverSubtitle}>
            {project.units.length} Equipment Unit{project.units.length !== 1 ? "s" : ""}
          </Text>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Project Details</Text>
              <KV label="Project Name" value={project.name} />
              <KV label="Client" value={project.clientName || "N/A"} />
              <KV label="Sales Engineer" value={project.salesEngineer || "N/A"} />
              <KV label="Submitted For" value={project.submittedFor || "N/A"} />
              <KV label="Country" value={project.country || "N/A"} />
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Document Info</Text>
              <KV label="Issue Date" value={date} />
              <KV label="Total Units" value={project.units.length} />
              <KV label="Status" value={project.status.charAt(0).toUpperCase() + project.status.slice(1)} />
            </View>
          </View>

          {/* Equipment summary table */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Equipment Summary</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tag</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Series</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Model</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tons</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Rev.</Text>
            </View>
            {project.units.map((unit, i) => (
              <View key={unit.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{i + 1}</Text>
                <Text style={[styles.tableCellBold, { flex: 1.5 }]}>{unit.tag || "-"}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{unit.seriesName}</Text>
                <Text style={[styles.tableCell, { flex: 2, fontFamily: "Helvetica-Bold", fontSize: 7 }]}>{unit.model.modelNumber}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{unit.model.nominalTons}</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{unit.quantity}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>{unit.currentRevision}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {/* ── PER-UNIT PAGES ─── */}
      {project.units.map((unit, unitIndex) => {
        const sd = unit.submittalData;
        const conditions = sd?.designConditions as Record<string, unknown> | undefined;
        const m = unit.model;

        return (
          <React.Fragment key={unit.id}>
            {/* Unit Cover + Performance */}
            <Page size="A4" style={styles.page}>
              <PageHeader pageTitle={`UNIT ${unitIndex + 1} — ${unit.tag || unit.model.modelNumber}`} />
              <PageFooter date={date} />

              <View style={{ marginTop: 20 }}>
                <View style={[styles.coverBadge, { backgroundColor: COOLEX_NAVY }]}>
                  <Text style={styles.coverBadgeText}>
                    UNIT {unitIndex + 1} OF {project.units.length} · REV. {unit.currentRevision}
                  </Text>
                </View>

                <View style={[styles.highlightBox, { marginBottom: 12, marginTop: 8 }]}>
                  <Text style={styles.highlightBoxTitle}>
                    {unit.tag ? `${unit.tag} — ` : ""}{unit.seriesName}
                  </Text>
                  <Text style={styles.highlightValue}>{m.modelNumber}</Text>
                  <Text style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                    {(m.totalCapacityBtuh / 12000).toFixed(1)} Tons · {m.eer} EER · {m.powerKW} kW · {m.compressorCount} Compressor{m.compressorCount > 1 ? "s" : ""}
                  </Text>
                </View>

                {sd?.oracleBOM && (
                  <View style={[styles.highlightBox, { marginBottom: 12, borderLeftColor: COOLEX_ACCENT }]}>
                    <Text style={styles.highlightBoxTitle}>Oracle BOM Nomenclature</Text>
                    <Text style={[styles.highlightValue, { fontSize: 11, letterSpacing: 0.5 }]}>{sd.oracleBOM}</Text>
                  </View>
                )}

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.sectionTitle}>Unit Details</Text>
                    <KV label="Unit Tag" value={unit.tag || "N/A"} />
                    <KV label="Reference" value={unit.reference || "N/A"} />
                    <KV label="Series" value={unit.seriesName} />
                    <KV label="Quantity" value={unit.quantity} />
                    <KV label="Current Revision" value={unit.currentRevision} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.sectionTitle}>Performance Output</Text>
                    <KV label="Total Cooling Capacity" value={`${(m.totalCapacityBtuh / 1000).toFixed(0)}k Btu/h`} />
                    <KV label="Sensible Capacity" value={`${(m.sensibleCapacityBtuh / 1000).toFixed(0)}k Btu/h`} />
                    <KV label="Total Power Input" value={`${m.powerKW} kW`} />
                    <KV label="EER" value={`${m.eer} Btu/(W·h)`} />
                    <KV label="Airflow" value={`${m.airflowCFM.toLocaleString()} CFM`} />
                  </View>
                </View>

                {/* Design conditions if available */}
                {conditions && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Design Input Conditions</Text>
                    <View style={styles.twoCol}>
                      <View style={styles.col}>
                        <KV label="Required Cooling Cap." value={`${((conditions.requiredCoolingCapacityBtuh as number ?? 0) / 1000).toFixed(0)}k Btu/h`} />
                        <KV label="Power Supply" value={String(conditions.powerSupply ?? "")} />
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
                  </View>
                )}
              </View>
            </Page>

            {/* Unit Technical Data + Dimensions */}
            <Page size="A4" style={styles.page}>
              <PageHeader pageTitle={`UNIT ${unitIndex + 1} — TECHNICAL DATA`} />
              <PageFooter date={date} />

              <View style={{ marginTop: 20 }}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={styles.sectionTitle}>Compressor Section</Text>
                    <KV label="Number of Compressors" value={m.compressorCount} />
                    <KV label="Type" value={m.compressorType ?? "Hermetic Scroll"} />
                    <KV label="Crankcase Heater" value="Standard" />
                    <KV label="High Pressure Switch" value="Manual Reset" />
                    <KV label="Low Pressure Switch" value="Auto Reset" />

                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Condenser Section</Text>
                    <KV label="Type" value="Air-Cooled (Fin & Tube)" />
                    <KV label="Coil Material" value="Aluminum Fins / Copper Tubes" />
                    <KV label="Fan Type" value="Propeller, Direct Drive" />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.sectionTitle}>Physical Dimensions</Text>
                    <KV label="Unit Weight" value={`${m.weightLbs} lbs (${Math.round(m.weightLbs * 0.453)} kg)`} />
                    <KV label="Length" value={`${m.lengthIn} in (${Math.round(m.lengthIn * 25.4)} mm)`} />
                    <KV label="Width" value={`${m.widthIn} in (${Math.round(m.widthIn * 25.4)} mm)`} />
                    <KV label="Height" value={`${m.heightIn} in (${Math.round(m.heightIn * 25.4)} mm)`} />

                    <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Sound Data</Text>
                    <KV label="Sound Pressure" value="≤ 72 dB(A) @ 10 ft" />
                    <KV label="Sound Power" value="≤ 84 dB(A)" />
                  </View>
                </View>

                {/* Options & pricing */}
                {sd && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.sectionTitle}>Selected Options</Text>
                    {sd.selectedOptions.length === 0 ? (
                      <Text style={{ fontSize: 8, color: "#64748B", marginBottom: 12 }}>No additional options selected.</Text>
                    ) : (
                      <View style={styles.table}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Option</Text>
                          {showPricing && <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>KWD</Text>}
                        </View>
                        {sd.selectedOptions.map((opt, i) => (
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
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.sectionTitle}>Pricing Summary</Text>
                        <KV label="Base Unit Price" value={`KWD ${sd.basePriceKWD.toLocaleString()}`} />
                        <KV label="Options Total" value={`KWD ${sd.optionsTotalKWD.toLocaleString()}`} />
                        <KV label={`Discount (${sd.discountPercent}%)`} value={`- KWD ${Math.round((sd.basePriceKWD + sd.optionsTotalKWD) * sd.discountPercent / 100).toLocaleString()}`} />
                        <View style={[styles.kvRow, { backgroundColor: "#EFF6FF", paddingHorizontal: 4, borderRadius: 2 }]}>
                          <Text style={[styles.kvLabel, { fontSize: 10, color: COOLEX_BLUE }]}>Net Total (per unit)</Text>
                          <Text style={[styles.kvValue, { fontSize: 12, fontFamily: "Helvetica-Bold", color: COOLEX_BLUE }]}>
                            KWD {sd.netTotalKWD.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Page>
          </React.Fragment>
        );
      })}

      {/* ── PRICING SUMMARY PAGE (if pricing visible and multiple units) ─── */}
      {showPricing && project.units.length > 1 && (
        <Page size="A4" style={styles.page}>
          <PageHeader pageTitle="PROJECT PRICING SUMMARY" />
          <PageFooter date={date} />

          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Project Pricing Summary</Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tag</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Model</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>Qty</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Unit (KWD)</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Total (KWD)</Text>
              </View>
              {project.units.map((unit, i) => {
                const unitNet = unit.submittalData?.netTotalKWD ?? Math.round(unit.model.nominalTons * 185 * 0.95);
                return (
                  <View key={unit.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{i + 1}</Text>
                    <Text style={[styles.tableCellBold, { flex: 1.5 }]}>{unit.tag || "-"}</Text>
                    <Text style={[styles.tableCell, { flex: 2, fontSize: 7 }]}>{unit.model.modelNumber}</Text>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{unit.quantity}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{unitNet.toLocaleString()}</Text>
                    <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right", color: COOLEX_BLUE }]}>
                      {(unitNet * unit.quantity).toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Grand total */}
            {(() => {
              const grandTotal = project.units.reduce((sum, u) => {
                const net = u.submittalData?.netTotalKWD ?? Math.round(u.model.nominalTons * 185 * 0.95);
                return sum + net * u.quantity;
              }, 0);
              return (
                <View style={[styles.highlightBox, { marginTop: 8 }]}>
                  <Text style={styles.highlightBoxTitle}>Grand Total (All Units)</Text>
                  <Text style={styles.highlightValue}>KWD {grandTotal.toLocaleString()}</Text>
                  <Text style={{ fontSize: 7, color: "#64748B", marginTop: 3 }}>
                    * Prices valid for 30 days from issue date. Prices exclude installation, freight, and VAT.
                  </Text>
                </View>
              );
            })()}
          </View>
        </Page>
      )}
    </Document>
  );
}

export { CombinedSubmittalPDFDoc };

/** Generate a combined PDF blob for download */
export async function generateCombinedPDFBlob(
  project: Project,
  showPricing: boolean
): Promise<Blob> {
  const blob = await pdf(
    <CombinedSubmittalPDFDoc project={project} showPricing={showPricing} />
  ).toBlob();
  return blob;
}

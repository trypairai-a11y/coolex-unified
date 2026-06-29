"use client";

/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer <Image> has no alt prop */

/**
 * COOLEX submittal PDF kit.
 *
 * Recreates the real COOLEX "PRODUCT SUBMITTAL" house style seen in the
 * reference reports (CCU / SPU / FAPU single-unit data sheets and the VRF
 * system report): dual-logo header, centred blue title bar, grey section
 * bars, dense two-column key/value grids, and the RIC/COOLEX footer.
 *
 * Every product type resolves to its own data-sheet structure via
 * `buildUnitSpec`, so each submittal reads like its catalogue equivalent.
 */

import React from "react";
import {
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  G,
} from "@react-pdf/renderer";
import type { Model, ProductSeries, ProductGroup } from "@/types/product";
import type { ProjectInfoFormData, DesignConditionsFormData, VRFLayout } from "@/types/selection";
import { floorRooms } from "@/types/selection";
import type { SubmittalOption } from "@/types/submittal";
import type { UnitSystem } from "@/lib/stores/unit-store";
import { PRODUCT_SERIES } from "@/lib/mock-data/product-series";
import { PRODUCT_GROUPS } from "@/lib/mock-data/product-groups";
import { fToC, btuhToKw, cfmToM3h, gpmToLps, round } from "@/lib/utils/unit-conversions";
import { altitudeCorrectionFactor } from "@/lib/utils/altitude";

// ─── Brand palette (matched to the reference PDFs) ──────────────────────────
const COOLEX_CYAN = "#00AEEF";
const TITLE_BAR = "#9DC3E6"; // medium steel-blue band behind "PRODUCT SUBMITTAL"
const SECTION_BAR = "#C9D9EC"; // pale steel-blue section bands
const INK = "#1A1A1A";
const SUB_INK = "#333333";
const RULE = "#000000";
const SOFT_RULE = "#BFC7D2";

// ─── Styles ─────────────────────────────────────────────────────────────────
export const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 78,
    paddingBottom: 56,
    paddingHorizontal: 34,
    backgroundColor: "#FFFFFF",
    color: INK,
  },
  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    paddingHorizontal: 34,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  ricCo: { fontSize: 6, color: "#444", maxWidth: 120, marginLeft: 4 },
  coolexLogo: { width: 132, height: 34, objectFit: "contain" },
  coolexTag: { fontSize: 5.5, color: COOLEX_CYAN, letterSpacing: 1, textAlign: "right", marginTop: 1 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    paddingHorizontal: 34,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: RULE,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  footerCol: { fontSize: 6.5, color: "#222", fontFamily: "Helvetica-Bold" },
  footerColRight: { fontSize: 6.5, color: "#222", fontFamily: "Helvetica-Bold", textAlign: "right" },
  footerPage: { fontSize: 7, color: "#222" },
  // Title bar
  titleBar: {
    backgroundColor: TITLE_BAR,
    paddingVertical: 4,
    alignItems: "center",
    marginBottom: 0,
  },
  titleBarText: { fontSize: 12, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.5 },
  subtitle: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
    paddingVertical: 4,
    textDecoration: "underline",
  },
  // Section bar
  sectionBar: {
    backgroundColor: SECTION_BAR,
    paddingVertical: 3,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 2,
  },
  sectionBarText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.5 },
  subHead: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    textDecoration: "underline",
    marginTop: 5,
    marginBottom: 2,
  },
  // Info block (project / unit identification)
  infoRow: { flexDirection: "row", marginBottom: 2 },
  infoLabel: { width: 88, fontSize: 8, fontFamily: "Helvetica-Bold", color: INK },
  infoColon: { width: 8, fontSize: 8, fontFamily: "Helvetica-Bold" },
  infoValue: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SUB_INK,
    borderBottomWidth: 0.7,
    borderBottomColor: RULE,
    paddingBottom: 0.5,
    marginRight: 10,
  },
  // Data grid
  dataCol: { flex: 1 },
  dataRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 1.2 },
  dataLabel: { width: 96, fontSize: 7.6, fontFamily: "Helvetica-Bold", color: INK },
  dataValue: { flex: 1, fontSize: 7.6, color: SUB_INK },
  // Spec rows (long-form general specification)
  specRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 1.4 },
  specLabel: { width: 110, fontSize: 7.6, fontFamily: "Helvetica-Bold", color: INK },
  specValue: { flex: 1, fontSize: 7.6, color: SUB_INK },
  bullet: { fontSize: 7.8, color: SUB_INK, marginLeft: 14, marginBottom: 1.5 },
  // Tables (VRF report)
  tHead: { flexDirection: "row", backgroundColor: COOLEX_CYAN },
  tHeadCell: {
    fontSize: 6.6,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#FFFFFF",
    textAlign: "center",
  },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: SOFT_RULE },
  tCell: {
    fontSize: 6.8,
    color: SUB_INK,
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 0.5,
    borderRightColor: SOFT_RULE,
    textAlign: "center",
  },
  tBand: { flexDirection: "row", backgroundColor: "#EEF3F9" },
  tBandText: { fontSize: 6.8, fontFamily: "Helvetica-Bold", color: INK, paddingVertical: 2.5, paddingHorizontal: 4 },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 6, marginTop: 4 },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginTop: 8, marginBottom: 3 },
  // Layout page
  layoutBox: {
    borderWidth: 1,
    borderColor: RULE,
    marginTop: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  layoutImg: { width: 360, height: 260, objectFit: "contain" },
});

// ─── Logos ──────────────────────────────────────────────────────────────────

/** Approximated RIC corporate seal (no asset shipped) — gear ring + monogram. */
function RicSeal() {
  const teeth = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI * 2) / 16;
    const x1 = 18 + Math.cos(a) * 16;
    const y1 = 18 + Math.sin(a) * 16;
    const x2 = 18 + Math.cos(a) * 19;
    const y2 = 18 + Math.sin(a) * 19;
    return <Path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#1F5FA8" strokeWidth={2.4} />;
  });
  return (
    <Svg width={34} height={34} viewBox="0 0 36 36">
      <G>{teeth}</G>
      <Circle cx={18} cy={18} r={16} fill="#FFFFFF" stroke="#1F5FA8" strokeWidth={2} />
      <Circle cx={18} cy={18} r={11} fill="#1F5FA8" />
      <Path d="M11 22 L11 14 L14.5 14 L14.5 22 M18 14 L18 22 M21.5 22 L21.5 14 L25 19"
        stroke="#FFFFFF" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function PageHeader() {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>
        <RicSeal />
        <Text style={styles.ricCo}>Refrigeration Industries &amp; Storage and Oil Services Co. KSC</Text>
      </View>
      <View>
        <Image style={styles.coolexLogo} src="/coolex-logo.png" />
        <Text style={styles.coolexTag}>COMFORT BEYOND EXPECTATIONS</Text>
      </View>
    </View>
  );
}

export function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <View>
        <Text style={styles.footerCol}>Refrigeration Industries Storage and Oil Servises Co. KSC</Text>
        <Text style={styles.footerCol}>P.O. Box 2261 Safat 13083 Kuwait</Text>
      </View>
      <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      <View>
        <Text style={styles.footerColRight}>www.ric.com / www.coolex.com</Text>
        <Text style={styles.footerColRight}>Phone : +965 1833380 / Fax +965 24673562</Text>
      </View>
    </View>
  );
}

// ─── Primitives ─────────────────────────────────────────────────────────────

export function SectionBar({ title }: { title: string }) {
  return (
    <View style={styles.sectionBar}>
      <Text style={styles.sectionBarText}>{title}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoColon}>:</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
}

/** Two-column unit-identification block shown directly under the subtitle. */
function IdentityBlock({
  left,
  right,
}: {
  left: [string, string][];
  right: [string, string][];
}) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6, marginBottom: 2 }}>
      <View style={{ flex: 1 }}>
        {left.map(([l, v]) => (
          <InfoLine key={l} label={l} value={v} />
        ))}
      </View>
      <View style={{ flex: 1 }}>
        {right.map(([l, v]) => (
          <InfoLine key={l} label={l} value={v} />
        ))}
      </View>
    </View>
  );
}

export type Field = [string, string];

function DataPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

/** Column-major two-column grid (matches the catalogue layout). */
export function DataGrid({ fields }: { fields: Field[] }) {
  const half = Math.ceil(fields.length / 2);
  const left = fields.slice(0, half);
  const right = fields.slice(half);
  return (
    <View style={{ flexDirection: "row", marginTop: 1 }}>
      <View style={styles.dataCol}>
        {left.map(([l, v], i) => (
          <DataPair key={`${l}-${i}`} label={l} value={v} />
        ))}
      </View>
      <View style={styles.dataCol}>
        {right.map(([l, v], i) => (
          <DataPair key={`${l}-${i}`} label={l} value={v} />
        ))}
      </View>
    </View>
  );
}

export function SubSection({ title, fields }: { title: string; fields: Field[] }) {
  return (
    <View>
      <Text style={styles.subHead}>{title}</Text>
      <DataGrid fields={fields} />
    </View>
  );
}

/**
 * Two-column technical block where each column is an independent top-down list
 * (matches the catalogue form layout: coil details on the left, counts on the
 * right). Unlike `DataGrid`, fields are NOT split evenly — the caller decides
 * which fields land in which column.
 */
export function TechSection({
  title,
  left,
  right,
}: {
  title: string;
  left: Field[];
  right: Field[];
}) {
  return (
    <View>
      <Text style={styles.subHead}>{title}</Text>
      <View style={{ flexDirection: "row", marginTop: 1 }}>
        <View style={styles.dataCol}>
          {left.map(([l, v], i) => (
            <DataPair key={`${l}-${i}`} label={l} value={v} />
          ))}
        </View>
        <View style={styles.dataCol}>
          {right.map(([l, v], i) => (
            <DataPair key={`${l}-${i}`} label={l} value={v} />
          ))}
        </View>
      </View>
    </View>
  );
}

function SpecPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

// ─── Product resolution ─────────────────────────────────────────────────────

export type TemplateKind =
  | "ccu"
  | "spu"
  | "fapu"
  | "package"
  | "chiller"
  | "fancoil"
  | "split"
  | "crac"
  | "vrf";

export function resolveProduct(seriesId: string): {
  series: ProductSeries | null;
  group: ProductGroup | null;
} {
  const series = PRODUCT_SERIES.find((s) => s.id === seriesId) ?? null;
  const group = series
    ? PRODUCT_GROUPS.find((g) => g.id === series.groupId) ?? null
    : seriesId === "vrf"
    ? PRODUCT_GROUPS.find((g) => g.id === "vrf") ?? null
    : null;
  return { series, group };
}

export function templateKind(seriesId: string): TemplateKind {
  const { series, group } = resolveProduct(seriesId);
  if (seriesId === "vrf" || group?.id === "vrf") return "vrf";
  if (series?.id === "fapu") return "fapu";
  if (series?.id === "spu") return "spu";
  if (series?.isCCU || group?.id === "ccu") return "ccu";
  if (series?.isChiller || group?.id === "chiller") return "chiller";
  if (group?.id === "pac") return "package";
  if (group?.id === "fan-coil") return "fancoil";
  if (group?.id === "split") return "split";
  if (group?.id === "crac" || group?.id === "precision") return "crac";
  return "package";
}

// ─── Formatting helpers ─────────────────────────────────────────────────────
const FUSES = [15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800];
function stdFuse(mca: number): number {
  return FUSES.find((f) => f >= mca * 1.15) ?? FUSES[FUSES.length - 1];
}

function electrical(model: Model, voltage = 400) {
  const fla = (model.powerKW * 1000) / (voltage * Math.sqrt(3) * 0.85);
  const mca = round(fla * 1.25, 1);
  const mocp = stdFuse(mca);
  return { fla: round(fla, 1), mca, mocp };
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}

// ─── Per-template spec builder ──────────────────────────────────────────────

export interface UnitSpec {
  subtitle: string;
  performanceTitle: string;
  /** Optional underlined sub-heading shown above the performance grid (e.g. "PERFORMANCE RATING"). */
  performanceSubhead?: string;
  performance: Field[];
  performanceNote?: string;
  /**
   * Technical sub-sections. Provide `fields` for an evenly-split grid, OR
   * `left`/`right` to control column placement (catalogue form layout).
   */
  technical: { title: string; fields?: Field[]; left?: Field[]; right?: Field[] }[];
  electrical?: Field[];
  generalSpec?: { heading: string; fields: Field[] }[];
  /** Omit the "Qty" row from the top identity block (used when Qty is shown inside the performance grid instead). */
  omitIdentityQty?: boolean;
}

export function buildUnitSpec(
  model: Model,
  designConditions: DesignConditionsFormData | undefined,
  seriesId: string,
  unitSystem: UnitSystem,
  quantity: number = 1,
): UnitSpec {
  const kind = templateKind(seriesId);
  const { series } = resolveProduct(seriesId);
  const metric = unitSystem === "metric";
  const c = (designConditions ?? {}) as unknown as Record<string, unknown>;

  const refrig = model.refrigerant ?? series?.primaryRefrigerant ?? "R-410A";
  const powerSupply = (c.powerSupply as string) || "400V/3Ø/50Hz";
  const ambientF = num(c.ambientTempF) ?? 115;

  // Display helpers
  const temp = (f: number) => (metric ? `${round(fToC(f), 1)} °C` : `${round(f, 1)} °F`);
  const cap = (btuh: number) => (metric ? `${round(btuhToKw(btuh), 1)} kW` : `${Math.round(btuh).toLocaleString()} Btu/hr`);
  const air = (cfm: number) => (metric ? `${Math.round(cfmToM3h(cfm)).toLocaleString()} m³/h` : `${Math.round(cfm).toLocaleString()} CFM`);
  const esp = num(c.espInWG);

  // Altitude (from design conditions) and its capacity correction factor.
  const altitudeFt = num(c.altitudeFt) ?? 0;
  const altCorrection = altitudeCorrectionFactor(altitudeFt);
  const altitudeStr = metric
    ? `${Math.round(altitudeFt * 0.3048).toLocaleString()} m`
    : `${Math.round(altitudeFt).toLocaleString()} ft`;
  const espStr = esp != null ? (metric ? `${round(esp * 249.089, 0)} Pa` : `${esp} in WG`) : "-";

  const { mca, mocp, fla } = electrical(model);

  const Lmm = Math.round(model.lengthIn * 25.4);
  const Wmm = Math.round(model.widthIn * 25.4);
  const Hmm = Math.round(model.heightIn * 25.4);
  const wkg = model.operatingWeight_kg ?? Math.round(model.weightLbs * 0.4536);
  const compType = model.compressorType ?? "Hermetic Scroll";
  const onCoil = `${temp(num(c.enteringDBF) ?? 80)} / ${temp(num(c.enteringWBF) ?? 67)}`;

  // ── Coil geometry (matches the catalogue data sheets) ──────────────────────
  // Evaporator face area is sized for a nominal ~400 FPM design face velocity;
  // the displayed face velocity is then derived back from it so the two values
  // stay self-consistent (as on the reference reports).
  const evapFaceAreaFt2 = round(model.airflowCFM / 400, 1);
  const faceVelocityFPM = evapFaceAreaFt2 > 0 ? Math.round(model.airflowCFM / evapFaceAreaFt2) : 0;
  // Each condenser coil module is ~19.8 ft²; total scales with the coil count.
  const condFaceAreaFt2 = (coils: number) => round(19.8 * coils, 1);
  const faceArea = (ft2: number) => (metric ? `${round(ft2 * 0.092903, 2)} m²` : `${ft2}`);
  const faceVel = metric ? `${round(faceVelocityFPM * 0.00508, 2)} m/s` : `${faceVelocityFPM} FPM`;
  // Electric-heater step (kW) — a customer option; sized to the unit by default.
  const heaterKW = [10, 15, 20, 30, 40, 50, 60].find((k) => k >= model.nominalTons * 0.6) ?? 60;
  const qtyStr = String(quantity);

  // ── CCU – Condensing Unit ──────────────────────────────────────────────
  if (kind === "ccu") {
    return {
      subtitle: "COOLEX Condensing Unit",
      performanceTitle: "PERFORMANCE DATA",
      performance: [
        ["Ambient Temp", temp(ambientF)],
        ["Altitude", altitudeFt > 0 ? `${altitudeStr} (× ${altCorrection.toFixed(3)})` : altitudeStr],
        ["Capacity", cap(model.totalCapacityBtuh)],
        ["Refrigerant", refrig],
        ["Compressor KW Input", `${round(model.powerKW * 0.92, 1)} kW`],
        ["Total Power Input (KW)", `${round(model.powerKW, 1)} kW`],
      ],
      technical: [
        {
          title: "Outdoor Specifications",
          left: [
            ["Unit Model", model.modelNumber],
            ["Compressor", compType],
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Material", "Aluminum"],
            ["Coil Area (ft²)", faceArea(19.8)],
            ["Rows / Fin Spacing", `${model.coilRows ?? 3} / 14`],
            ["Coil Qty", String(Math.max(2, model.compressorCount * 2))],
            ["Refrigerant circuit", String(model.compressorCount)],
            ["Liquid Pipe Ø (in)", model.connectingLiquidPipe ?? '7/8'],
            ["Suction Pipe (in)", model.connectingGasPipe ?? '1 3/8'],
          ],
          right: [
            ["Refrigerant", refrig],
            ["Fan type", "Direct driven Propeller fan"],
            ["No. of fans", String(Math.max(2, model.compressorCount * 2))],
            ["Condenser Motor HP", "1.5"],
            ["Unit Weight (kgs)", `${wkg}`],
            ["Unit Dimension (LxWxH) mm", `${Lmm} x ${Wmm} x ${Hmm}`],
          ],
        },
      ],
      electrical: [
        ["Power Supply", powerSupply],
        ["Fan Motor FLA (each)", `${round(fla * 0.06, 1)} A`],
        ["Unit Ampacity (A)", `${mca}`],
        ["Max. Fuse Size (A)", `${mocp}`],
        ["Compressor Qty", String(model.compressorCount)],
        ["Compressor RLA / LRA", `${round(fla / model.compressorCount, 1)} / ${round((fla / model.compressorCount) * 6, 0)} A`],
      ],
      generalSpec: [
        {
          heading: "Condenser",
          fields: [
            ["Casing", "Painted Electro-static powder coat, oven baked"],
            ["Compressor Type", "Hermetic Scroll"],
            ["Compressor protection", "Inherent thermal protector, crankcase heater & external overload relay"],
            ["Condenser Coil", '3/8" Copper tubes mechanically bonded with Aluminum fins'],
            ["Fan Type", "Direct Driven Propeller fan"],
            ["Fan Motor", "TEAO with Class F motor insulation with inherent thermal protection"],
            ["Refrigerant Line", "Filter drier, sight glass, manual shut off valve"],
            ["Unit Controller", "Microprocessor based control with multi function safety features"],
          ],
        },
      ],
    };
  }

  // ── SPU – Special Package Unit ─────────────────────────────────────────
  if (kind === "spu" || kind === "package" || kind === "crac") {
    const eHeater = "10.0 KW";
    const isCrac = kind === "crac";
    return {
      subtitle:
        kind === "spu"
          ? `Special Package Unit - ${refrig}`
          : isCrac
          ? "Precision Cooling Unit"
          : `${series?.fullName ?? "Packaged Unit"}`,
      performanceTitle: "PERFORMANCE DATA",
      performanceSubhead: "PERFORMANCE RATING",
      performance: [
        ["Air Flow Rate", air(model.airflowCFM)],
        ["On Coil Temp (DB/WB)", onCoil],
        ["Altitude", altitudeStr],
        ["Total Cooling Capacity", cap(model.totalCapacityBtuh)],
        ["Sensible Capacity", cap(model.sensibleCapacityBtuh)],
        ["Face Velocity", faceVel],
        ["Leaving Air DB", temp(model.leavingDBF)],
        ["Leaving Air WB", temp(model.leavingWBF)],
        ["EER", `${round(model.eer, 1)}`],
        ["Power Supply", powerSupply],
        ["Ambient Temp", temp(ambientF)],
        ["Refrigerant", refrig],
        ["ESP", espStr],
        ["Electric Heater", eHeater],
        ["Total Power Input", `${round(model.powerKW, 1)} KW`],
        ["Unit MCA", `${mca} A`],
        ["Unit MOCP", `${mocp} A`],
      ],
      technical: [
        {
          title: "Compressor",
          fields: [
            ["Type", compType],
            ["Qty (Comp1)/(Comp2)", `${Math.ceil(model.compressorCount / 2)} / ${Math.floor(model.compressorCount / 2)}`],
            ["Size-HP (Comp1)/(Comp2)", `${round(model.nominalTons * 0.55, 1)} / ${round(model.nominalTons * 0.42, 1)}`],
            ["Refrigerant circuit", String(Math.max(1, Math.ceil(model.compressorCount / 2)))],
            ["Capacity Step", "0-50-100"],
          ],
        },
        {
          title: "Condenser & Fan Motor Assy.",
          left: [
            ["Rows", "3"],
            ["Fins per inch", "14"],
            ["Face Area (ft²)", faceArea(condFaceAreaFt2(Math.max(2, model.compressorCount * 2)))],
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Type", "Aluminum Fins"],
            ["Fan type", "Direct driven Propeller fan"],
            ["Fan Motor", "TEAO with Class F motor insulation with inherent thermal protection"],
          ],
          right: [
            ["No. of Condenser Coil", String(Math.max(2, model.compressorCount * 2))],
            ["Condenser Motor (HP)", "1.50"],
            ["No. of fans", String(Math.max(2, model.compressorCount * 2))],
          ],
        },
        {
          title: "Evaporator & Blower Motor Assy.",
          left: [
            ["Rows", "4"],
            ["Fins per inch", "12"],
            ["Face Area (ft²)", faceArea(evapFaceAreaFt2)],
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Type", "Copper Fins"],
            ["Blower type", "DWDI Forward curve centrifugal fan"],
            ["Blower Motor", "Totally Enclosed Fan Cooled (TEFC) type, IP 55 Protected, class F insulation"],
            ["Drive type", "Belt driven"],
            ["Casing", "Double skin construction with 25 mm thick fiberglass insulation"],
            ["Pre Filter", '2" Aluminum washable'],
          ],
          right: [
            ["No. of Evaporator Coil", String(Math.max(1, Math.ceil(model.compressorCount / 2)))],
            ["Blower Motor (KW)", `${round(model.powerKW * 0.12, 1)}`],
            ["No. of blower", "1"],
          ],
        },
      ],
    };
  }

  // ── FAPU – Fresh Air Package Unit ──────────────────────────────────────
  if (kind === "fapu") {
    const condCoils = Math.max(1, model.compressorCount);
    return {
      subtitle: "Fresh Air Package Unit",
      performanceTitle: "PERFORMANCE DATA",
      // Qty lives in the performance grid here, so drop it from the identity block.
      omitIdentityQty: true,
      performance: [
        ["Unit Model", model.modelNumber],
        ["Entering Air Temp (DB)", temp(num(c.enteringDBF) ?? 115)],
        ["Entering Air Temp (WB)", temp(num(c.enteringWBF) ?? 80)],
        ["Altitude", altitudeStr],
        ["Total Cooling Capacity", cap(model.totalCapacityBtuh)],
        ["Sensible Capacity", cap(model.sensibleCapacityBtuh)],
        ["Air Flow", air(model.airflowCFM)],
        ["Face Velocity", faceVel],
        ["Leaving Air DB", temp(model.leavingDBF)],
        ["Leaving Air WB", temp(model.leavingWBF)],
        ["Qty", qtyStr],
        ["Power Supply", powerSupply],
        ["Refrigerant", refrig],
        ["ESP", espStr],
        ["Electric Heater", `${heaterKW}.0 KW`],
        ["Total Power Input", `${round(model.powerKW, 1)} KW`],
        ["Unit MCA", `${mca} A`],
        ["Unit MOCP", `${mocp} A`],
        ["EER", `${round(model.eer, 1)}`],
      ],
      technical: [
        {
          title: "Compressor",
          fields: [
            ["Type", compType],
            ["Qty (Comp1)/(Comp2)", `${model.compressorCount} / -`],
            ["Size-HP (Comp1)/(Comp2)", `${round(model.nominalTons * 0.85, 1)} / -`],
            ["Refrigerant circuit", String(model.compressorCount)],
            ["Capacity Step", "0-50-100"],
          ],
        },
        {
          title: "Condenser & Fan Motor Assy.",
          left: [
            ["Rows", "3"],
            ["Fins per inch", "14"],
            ["Face Area (ft²)", faceArea(condFaceAreaFt2(condCoils))],
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Type", "Aluminum"],
            ["Fan type", "Direct driven Propeller fan"],
            ["Fan Motor", "TEAO with Class F motor insulation with inherent thermal protection"],
          ],
          right: [
            ["No. of Condenser Coil", String(condCoils)],
            ["Condenser Motor (HP)", "1.50"],
            ["No. of fans", String(condCoils)],
          ],
        },
        {
          title: "Evaporator",
          left: [
            ["Rows", "5"],
            ["Fins per inch", "12"],
            ["Face Area (ft²)", faceArea(evapFaceAreaFt2)],
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Type", "Aluminum"],
            ["Blower type", "DWDI Backward curve centrifugal fan"],
            ["Blower Motor", "Totally Enclosed Fan Cooled (TEFC) type, IP 55 Protected, 2 Pole class F insulation"],
            ["Drive type", "Belt driven with adjustable motor pulley"],
            ["Casing", "Single skin construction with 15 mm thick fiberglass insulation"],
            ["Pre Filter", '2" Aluminum washable'],
            ["Final Filter", "High efficiency synthetic bag filter"],
          ],
          right: [
            ["Blower Motor (KW)", `${round(model.powerKW * 0.11, 1)}`],
            ["No. of fans", "1"],
          ],
        },
      ],
    };
  }

  // ── Chiller ────────────────────────────────────────────────────────────
  if (kind === "chiller") {
    const ewt = num(c.enteringWaterTempF) ?? 54;
    const lwt = num(c.leavingWaterTempF) ?? 44;
    const gpm = num(c.waterFlowRateGPM) ?? round(model.totalCapacityBtuh / 12000 * 2.4, 1);
    const cop = round(model.eer / 3.412, 2);
    const hx =
      series?.id === "acsc"
        ? "Shell & Tube"
        : series?.fullName?.includes("Shell")
        ? "Shell & Tube"
        : "Brazed Plate";
    const compr = series?.id === "acsc" ? "Semi-hermetic Screw" : "Hermetic Scroll";
    return {
      subtitle: `Air-Cooled Chiller - ${refrig}`,
      performanceTitle: "PERFORMANCE DATA",
      performance: [
        ["Cooling Capacity", cap(model.totalCapacityBtuh)],
        ["Capacity (TR)", `${round(model.nominalTons, 1)}`],
        ["Entering Water Temp", temp(ewt)],
        ["Leaving Water Temp", temp(lwt)],
        ["Water Flow Rate", metric ? `${round(gpmToLps(gpm), 2)} L/s` : `${round(gpm, 1)} GPM`],
        ["Ambient Temp", temp(ambientF)],
        ["Refrigerant", refrig],
        ["Total Power Input", `${round(model.powerKW, 1)} kW`],
        ["EER", `${round(model.eer, 2)}`],
        ["COP", `${cop} W/W`],
        ["Power Supply", powerSupply],
        ["Unit MCA / MOCP", `${mca} / ${mocp} A`],
      ],
      technical: [
        {
          title: "Compressor",
          fields: [
            ["Type", compr],
            ["No. of Compressors", String(model.compressorCount)],
            ["No. of Refrigerant Circuits", String(Math.max(1, Math.ceil(model.compressorCount / 2)))],
            ["Capacity Control", "Stepless / Step (per circuit)"],
            ["Starter", "Star-Delta / Soft Start"],
          ],
        },
        {
          title: "Evaporator",
          fields: [
            ["Type", `${hx} Heat Exchanger`],
            ["Material", "Stainless Steel / Copper"],
            ["Insulation", "Closed-cell elastomeric"],
            ["Expansion Device", "Electronic Expansion Valve"],
            ["Water Connection", "Victaulic / Flanged"],
          ],
        },
        {
          title: "Condenser & Fan Motor Assy.",
          fields: [
            ["Coil Type", '3/8" Ø IGT Copper'],
            ["Fin Material", "Aluminum (optional copper)"],
            ["Fan Type", "Direct driven axial fan"],
            ["Fan Motor", "TEAO, Class F insulation"],
            ["Unit Weight (kg)", `${wkg}`],
            ["Unit Dimension (LxWxH) mm", `${Lmm} x ${Wmm} x ${Hmm}`],
          ],
        },
      ],
      generalSpec: [
        {
          heading: "Construction",
          fields: [
            ["Frame", "Galvanized steel, powder-coated"],
            ["Controller", "Microprocessor with BMS interface (Modbus)"],
            ["Safety", "HP/LP switches, flow switch, anti-freeze, phase protection"],
          ],
        },
      ],
    };
  }

  // ── Fan Coil ───────────────────────────────────────────────────────────
  if (kind === "fancoil") {
    const ewt = num(c.enteringWaterTempF) ?? num((c as Record<string, unknown>).leavingWaterTempF) ?? 44;
    const gpm = model.matrixWaterFlowGPM ?? round(model.totalCapacityBtuh / 12000 * 2.4, 1);
    const wpd = model.matrixWaterPressureDropFtH2O;
    return {
      subtitle: "Chilled Water Fan Coil Unit",
      performanceTitle: "PERFORMANCE DATA",
      performance: [
        ["Air Flow Rate", air(model.airflowCFM)],
        ["ESP", espStr],
        ["Total Cooling Capacity", cap(model.totalCapacityBtuh)],
        ["Sensible Capacity", cap(model.sensibleCapacityBtuh)],
        ["Entering Water Temp", temp(ewt)],
        ["Leaving Air DB", temp(model.leavingDBF)],
        ["Leaving Air WB", temp(model.leavingWBF)],
        ["Water Flow Rate", metric ? `${round(gpmToLps(gpm), 2)} L/s` : `${round(gpm, 1)} GPM`],
        ...(wpd != null ? ([["Water Pressure Drop", metric ? `${round(wpd * 2.989, 0)} kPa` : `${round(wpd, 1)} ft.wg`]] as Field[]) : []),
        ["Motor Power", `${round(model.powerKW, 2)} kW`],
        ["Power Supply", powerSupply],
      ],
      technical: [
        {
          title: "Coil",
          fields: [
            ["Rows", String(model.coilRows ?? 3)],
            ["Fins per inch", "12"],
            ["Tube Material", '3/8" Copper'],
            ["Fin Material", "Aluminum"],
            ["Coil Connection", "Header with vent & drain"],
          ],
        },
        {
          title: "Fan & Motor",
          fields: [
            ["Fan Type", "DIDW Forward-curve centrifugal"],
            ["Drive", "Belt driven"],
            ["Motor", "TEFC, Class F insulation"],
            ["Casing", "Galvanized steel with fibreglass insulation"],
            ["Filter", '1" Aluminum washable'],
            ["Unit Weight (kg)", `${wkg}`],
          ],
        },
      ],
    };
  }

  // ── Split ──────────────────────────────────────────────────────────────
  return {
    subtitle: series?.fullName ?? "Ducted Split System",
    performanceTitle: "PERFORMANCE DATA",
    performance: [
      ["Air Flow Rate", air(model.airflowCFM)],
      ["On Coil Temp (DB/WB)", onCoil],
      ["Total Cooling Capacity", cap(model.totalCapacityBtuh)],
      ["Sensible Capacity", cap(model.sensibleCapacityBtuh)],
      ["Leaving Air DB", temp(model.leavingDBF)],
      ["Leaving Air WB", temp(model.leavingWBF)],
      ["EER", `${round(model.eer, 1)}`],
      ["Ambient Temp", temp(ambientF)],
      ["Refrigerant", refrig],
      ["ESP", espStr],
      ["Total Power Input", `${round(model.powerKW, 1)} kW`],
      ["Unit MCA / MOCP", `${mca} / ${mocp} A`],
    ],
    technical: [
      {
        title: "Compressor (Outdoor)",
        fields: [
          ["Type", compType],
          ["No. of Compressors", String(model.compressorCount)],
          ["Coil Type", '3/8" Ø IGT Copper'],
          ["Fan Type", "Direct driven Propeller fan"],
        ],
      },
      {
        title: "Indoor (Evaporator)",
        fields: [
          ["Coil Type", '3/8" Ø IGT Copper'],
          ["Fin Material", "Aluminum"],
          ["Blower", "DWDI Forward-curve centrifugal"],
          ["Drive", "Belt driven"],
          ["Filter", '2" Aluminum washable'],
          ["Unit Weight (kg)", `${wkg}`],
        ],
      },
    ],
  };
}

// ─── Unit data-sheet + layout pages (single unit) ───────────────────────────

export interface UnitSubmittalProps {
  model: Model;
  projectInfo: ProjectInfoFormData;
  designConditions?: DesignConditionsFormData;
  selectedOptions: SubmittalOption[];
  revisionNumber: string;
  generatedBy: string;
  unitSystem: UnitSystem;
  /** Override the seriesId used for template resolution (defaults to model.seriesId). */
  seriesId?: string;
  /** Tag / qty overrides when rendered inside a project combined PDF. */
  unitTag?: string;
  quantity?: number;
}

export function UnitSubmittalPages(props: UnitSubmittalProps) {
  const { model, projectInfo, designConditions, selectedOptions, revisionNumber, generatedBy, unitSystem } = props;
  const seriesId = props.seriesId ?? model.seriesId;
  const qty = props.quantity ?? Number(projectInfo.quantity ?? 1);
  const spec = buildUnitSpec(model, designConditions, seriesId, unitSystem, qty);
  const { series } = resolveProduct(seriesId);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  const tag = props.unitTag ?? projectInfo.unitTag ?? "-";

  return (
    <>
      {/* ── PAGE 1 — DATA SHEET ─────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />

        <View style={styles.titleBar}>
          <Text style={styles.titleBarText}>PRODUCT SUBMITTAL</Text>
        </View>
        <Text style={styles.subtitle}>{spec.subtitle}</Text>

        <IdentityBlock
          left={[
            ["Project Name", projectInfo.projectName],
            ["Reference No.", projectInfo.unitReference ?? "-"],
            ["Revision No.", revisionNumber],
            ["Date", today],
          ]}
          right={[
            ["Unit Model", model.modelNumber],
            ["Tag No.", tag],
            ...(spec.omitIdentityQty ? [] : ([["Qty", String(qty)]] as [string, string][])),
            ["Sales Engineer", projectInfo.salesEngineer ?? "-"],
            ["Prepared by", generatedBy || "-"],
          ]}
        />

        <SectionBar title={spec.performanceTitle} />
        {spec.performanceSubhead && <Text style={styles.subHead}>{spec.performanceSubhead}</Text>}
        <DataGrid fields={spec.performance} />
        {spec.performanceNote && (
          <Text style={{ fontSize: 6.5, color: "#555", marginTop: 2 }}>{spec.performanceNote}</Text>
        )}

        <SectionBar title="TECHNICAL DATA" />
        {spec.technical.map((sub) =>
          sub.left || sub.right ? (
            <TechSection key={sub.title} title={sub.title} left={sub.left ?? []} right={sub.right ?? []} />
          ) : (
            <SubSection key={sub.title} title={sub.title} fields={sub.fields ?? []} />
          ),
        )}

        {spec.electrical && (
          <>
            <SectionBar title="ELECTRICAL DATA" />
            <DataGrid fields={spec.electrical} />
          </>
        )}

        {spec.generalSpec && (
          <>
            <SectionBar title="GENERAL SPECIFICATION" />
            {spec.generalSpec.map((g) => (
              <View key={g.heading}>
                <Text style={styles.subHead}>{g.heading}</Text>
                {g.fields.map(([l, v]) => (
                  <SpecPair key={l} label={l} value={v} />
                ))}
              </View>
            ))}
          </>
        )}

        <SectionBar title="ADDITIONAL OPTIONS" />
        {selectedOptions.length === 0 ? (
          <Text style={styles.bullet}>- None</Text>
        ) : (
          selectedOptions.map((o) => (
            <Text key={o.id} style={styles.bullet}>- {o.label}</Text>
          ))
        )}
      </Page>

      {/* ── PAGE 2 — UNIT LAYOUT ────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />

        <SectionBar title="UNIT LAYOUT" />
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Text style={[styles.subHead, { width: 70, marginTop: 0 }]}>Model :</Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: INK }}>{model.modelNumber}</Text>
        </View>

        <View style={styles.layoutBox}>
          {series?.imageUrl ? (
            <Image style={styles.layoutImg} src={series.imageUrl} />
          ) : (
            <View style={{ height: 220, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#94A3B8", fontSize: 9 }}>[ Unit drawing not available ]</Text>
            </View>
          )}
          <Text style={{ fontSize: 7, color: "#555", marginTop: 6 }}>(ALL DIMENSIONS ARE IN MM)</Text>
        </View>

        <View style={{ flexDirection: "row", marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <DataPair label="Length (L)" value={`${Math.round(model.lengthIn * 25.4)} mm`} />
            <DataPair label="Width (W)" value={`${Math.round(model.widthIn * 25.4)} mm`} />
            <DataPair label="Height (H)" value={`${Math.round(model.heightIn * 25.4)} mm`} />
          </View>
          <View style={{ flex: 1 }}>
            <DataPair label="Operating Weight" value={`${model.operatingWeight_kg ?? Math.round(model.weightLbs * 0.4536)} kg`} />
            <DataPair label="Refrigerant" value={model.refrigerant ?? series?.primaryRefrigerant ?? "R-410A"} />
            <DataPair label="Connections" value={`${model.connectingLiquidPipe ?? '7/8"'} liq / ${model.connectingGasPipe ?? '1 3/8"'} suction`} />
          </View>
        </View>
      </Page>
    </>
  );
}

// ─── VRF system report ──────────────────────────────────────────────────────

const IDU_TYPE_LABEL: Record<string, string> = {
  "ducted-split-low-static": "Concealed Ducted Low Static",
  "ducted-split-high-static": "Concealed Ducted High Static",
  "ducted-split-inverter": "Concealed Ducted Inverter",
  cassette: "4-Way Cassette",
  "wall-mounted": "Wall Mounted",
};

export interface VRFReportProps {
  outdoorModel: Model;
  projectInfo: ProjectInfoFormData;
  vrfLayout: VRFLayout;
  revisionNumber: string;
  generatedBy: string;
}

export function VRFReportPages({ outdoorModel, projectInfo, vrfLayout, revisionNumber }: VRFReportProps) {
  const rooms = vrfLayout.floors.flatMap((f) =>
    floorRooms(f).map((r) => ({ floor: f.name, room: r.name, type: r.indoorType, capacity: r.capacity ?? 0 })),
  );
  const totalKbtuh = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalKw = round(btuhToKw(totalKbtuh * 1000), 1);
  const oduKw = round(btuhToKw(outdoorModel.totalCapacityBtuh), 1);
  const combo = totalKbtuh > 0 ? Math.round((totalKbtuh / (outdoorModel.totalCapacityBtuh / 1000)) * 100) : 0;
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Aggregate identical indoor types into a quotation list.
  const byType = new Map<string, number>();
  rooms.forEach((r) => byType.set(r.type ?? "cassette", (byType.get(r.type ?? "cassette") ?? 0) + 1));

  const colHeader = (cells: string[], widths: number[]) => (
    <View style={styles.tHead}>
      {cells.map((c, i) => (
        <Text key={c} style={[styles.tHeadCell, { flex: widths[i] }]}>{c}</Text>
      ))}
    </View>
  );

  return (
    <>
      {/* ── COVER ───────────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />
        <View style={{ marginTop: 60, alignItems: "center" }}>
          <Image src="/coolex-logo.png" style={{ width: 200, height: 50, objectFit: "contain", marginBottom: 30 }} />
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: INK, textAlign: "center", lineHeight: 1.4 }}>
            VRF SYSTEM{"\n"}DESIGN REPORT AND{"\n"}PERFORMANCE SHEET
          </Text>
          <Text style={{ fontSize: 11, color: SUB_INK, marginTop: 24 }}>{projectInfo.projectName}</Text>
          <Text style={{ fontSize: 9, color: "#666", marginTop: 4 }}>Revision {revisionNumber} · {today}</Text>
        </View>
      </Page>

      {/* ── PROJECT INFO + DESIGN PARAMETERS ────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />
        <Text style={styles.h1}>Project Information</Text>
        <View style={{ borderWidth: 0.5, borderColor: SOFT_RULE }}>
          {([
            ["Project Name", projectInfo.projectName],
            ["Project Location", projectInfo.country ?? "-"],
            ["Customer", projectInfo.clientName ?? "-"],
            ["Project Consultant", projectInfo.submittedFor ?? "-"],
            ["Project Designer", projectInfo.salesEngineer ?? "-"],
          ] as Field[]).map(([l, v], i) => (
            <View key={l} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
              <Text style={[styles.tCell, { flex: 1, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[styles.tCell, { flex: 1.4, textAlign: "left", borderRightWidth: 0 }]}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h1}>Air-conditioning design parameters</Text>
        <View style={{ borderWidth: 0.5, borderColor: SOFT_RULE }}>
          {([
            ["Summer outdoor DB", `${round(fToC(vrfLayout.summer?.outdoorDBF ?? 115), 0)} °C`],
            ["Summer indoor DB", `${round(fToC(vrfLayout.summer?.indoorDBF ?? 75), 0)} °C`],
            ["Winter outdoor DB", `${round(fToC(vrfLayout.winter?.outdoorDBF ?? 46), 1)} °C`],
            ["Winter indoor DB", `${round(fToC(vrfLayout.winter?.indoorDBF ?? 68), 0)} °C`],
            ["Ambient (design)", `${round(fToC(vrfLayout.ambientTempF ?? 115), 0)} °C`],
          ] as Field[]).map(([l, v], i) => (
            <View key={l} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
              <Text style={[styles.tCell, { flex: 1, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[styles.tCell, { flex: 1.4, textAlign: "left", borderRightWidth: 0 }]}>{v}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ── QUOTATION LIST ──────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />
        <Text style={styles.h1}>Equipment List</Text>
        {colHeader(["Model", "Type", "Quantity", "Unit"], [2, 2.4, 1, 1])}
        <View style={styles.tBand}><Text style={styles.tBandText}>ODU</Text></View>
        <View style={styles.tRow}>
          <Text style={[styles.tCell, { flex: 2, textAlign: "left" }]}>{outdoorModel.modelNumber}</Text>
          <Text style={[styles.tCell, { flex: 2.4, textAlign: "left" }]}>VRF Outdoor Unit</Text>
          <Text style={[styles.tCell, { flex: 1 }]}>1</Text>
          <Text style={[styles.tCell, { flex: 1, borderRightWidth: 0 }]}>pc</Text>
        </View>
        <View style={styles.tBand}><Text style={styles.tBandText}>IDU</Text></View>
        {Array.from(byType.entries()).map(([type, qty], i) => (
          <View key={type} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
            <Text style={[styles.tCell, { flex: 2, textAlign: "left" }]}>{IDU_TYPE_LABEL[type] ?? type}</Text>
            <Text style={[styles.tCell, { flex: 2.4, textAlign: "left" }]}>VRF Indoor Unit</Text>
            <Text style={[styles.tCell, { flex: 1 }]}>{qty}</Text>
            <Text style={[styles.tCell, { flex: 1, borderRightWidth: 0 }]}>pc</Text>
          </View>
        ))}
        <View style={[styles.tRow, { backgroundColor: "#EEF3F9" }]}>
          <Text style={[styles.tCell, { flex: 4.4, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>Total Indoor Units</Text>
          <Text style={[styles.tCell, { flex: 1, fontFamily: "Helvetica-Bold" }]}>{rooms.length}</Text>
          <Text style={[styles.tCell, { flex: 1, borderRightWidth: 0 }]}> </Text>
        </View>
      </Page>

      {/* ── SYSTEM INFORMATION + INDOOR UNIT LIST ───────────────────────── */}
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <PageFooter />
        <Text style={styles.h1}>Air-conditioning system</Text>
        <Text style={styles.h2}>System Information</Text>
        <View style={{ borderWidth: 0.5, borderColor: SOFT_RULE }}>
          {([
            ["Total room numbers", String(rooms.length)],
            ["ODU model", outdoorModel.modelNumber],
            ["IDU quantity", String(rooms.length)],
            ["Nominal cooling capacity (kW)", `${oduKw}`],
            ["Total indoor load (kW)", `${totalKw}`],
            ["Combination ratio (%)", `${combo}%`],
            ["System EER", `${round(outdoorModel.eer, 2)}`],
            ["Refrigerant", outdoorModel.refrigerant ?? "R-410A"],
          ] as Field[]).map(([l, v], i) => (
            <View key={l} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
              <Text style={[styles.tCell, { flex: 1.4, textAlign: "left", fontFamily: "Helvetica-Bold" }]}>{l}</Text>
              <Text style={[styles.tCell, { flex: 1, textAlign: "left", borderRightWidth: 0 }]}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Indoor Unit List</Text>
        {colHeader(["Floor", "Room", "IDU Type", "Cooling (kW)"], [1, 1.2, 2, 1])}
        {rooms.map((r, i) => (
          <View key={`${r.floor}-${r.room}-${i}`} style={[styles.tRow, i % 2 ? { backgroundColor: "#F6F9FC" } : {}]}>
            <Text style={[styles.tCell, { flex: 1, textAlign: "left" }]}>{r.floor}</Text>
            <Text style={[styles.tCell, { flex: 1.2, textAlign: "left" }]}>{r.room}</Text>
            <Text style={[styles.tCell, { flex: 2, textAlign: "left" }]}>{IDU_TYPE_LABEL[r.type ?? "cassette"] ?? r.type}</Text>
            <Text style={[styles.tCell, { flex: 1, borderRightWidth: 0 }]}>{round(btuhToKw(r.capacity * 1000), 1)}</Text>
          </View>
        ))}
      </Page>
    </>
  );
}

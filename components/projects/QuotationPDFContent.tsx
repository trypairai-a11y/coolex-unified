"use client";

/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer <Image> has no alt prop */

/**
 * COOLEX quotation PDF.
 *
 * Recreates the modern card-style quotation house style (QT-2026-0155 reference):
 * dual-logo header with a blue divider, centred title + quote number, two info
 * panels (project details / quotation information), a navy-headed line-item
 * table with product thumbnails, a totals block with a navy TOTAL AMOUNT card,
 * payment instructions, terms, signature lines, and a navy footer bar.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  G,
  PDFViewer,
} from "@react-pdf/renderer";
import type { QuotationInfo, QuotationLine } from "@/types/quotation";
import { formatKWD } from "@/lib/utils/pricing";

// ─── Palette (matched to the reference) ─────────────────────────────────────
const NAVY = "#0A1628";
const BLUE = "#0057B8";
const CYAN = "#00A3E0";
const INK = "#1E293B";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const PANEL = "#F8FAFC";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 92,
    paddingBottom: 64,
    paddingHorizontal: 34,
    backgroundColor: "#FFFFFF",
    color: INK,
  },

  // Header (fixed)
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: 250 },
  ricCo: { fontSize: 6, color: "#475569", maxWidth: 150 },
  ricCoBold: { fontSize: 6.5, color: "#334155", fontFamily: "Helvetica-Bold", maxWidth: 150 },
  coolexLogo: { width: 132, height: 34, objectFit: "contain" },
  coolexTag: { fontSize: 5, color: CYAN, letterSpacing: 1, textAlign: "right", marginTop: 1 },
  headerRule: {
    position: "absolute",
    top: 66,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: NAVY,
  },
  headerAccent: {
    position: "absolute",
    top: 69,
    left: 0,
    width: 150,
    height: 3,
    backgroundColor: CYAN,
  },

  // Footer (fixed)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 44,
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 6.5, color: "rgba(255,255,255,0.82)" },
  footerRight: { fontSize: 6.5, color: "rgba(255,255,255,0.82)", textAlign: "right" },
  footerBold: { fontSize: 7, color: "#FFFFFF", fontFamily: "Helvetica-Bold", textAlign: "right" },

  // Title
  title: { textAlign: "center", fontSize: 20, fontFamily: "Helvetica-Bold", color: NAVY, letterSpacing: 3 },
  titleNo: { textAlign: "center", fontSize: 9, fontFamily: "Helvetica-Bold", color: CYAN, letterSpacing: 2, marginTop: 3 },

  // Info panels
  panels: { flexDirection: "row", gap: 14, marginTop: 16 },
  panel: { flex: 1 },
  panelRight: { flex: 1, borderLeftWidth: 1, borderLeftColor: LINE, paddingLeft: 14 },
  panelHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: BLUE, letterSpacing: 1, marginBottom: 6 },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { width: 78, fontSize: 8, color: MUTED },
  infoValue: { flex: 1, fontSize: 8, color: INK },
  infoValueBold: { flex: 1, fontSize: 8, color: INK, fontFamily: "Helvetica-Bold" },

  // Table
  table: { marginTop: 18 },
  tHead: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FFFFFF", letterSpacing: 0.5 },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  rowAlt: { backgroundColor: PANEL },
  itemNo: { fontSize: 9, fontFamily: "Helvetica-Bold", color: BLUE },
  thumbBox: {
    width: 44,
    height: 34,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  thumb: { width: 40, height: 30, objectFit: "contain" },
  thumbPlaceholder: { fontSize: 5.5, color: MUTED },
  cellModel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK },
  cellDesc: { fontSize: 7.5, color: MUTED, marginTop: 1 },
  cellNum: { fontSize: 8.5, color: INK },
  cellNumBold: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK },
  price: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK },
  priceTotal: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: BLUE },
  kwd: { fontSize: 5.5, color: MUTED },

  // Totals
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totals: { width: 250 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 6 },
  totalLabel: { fontSize: 9, color: MUTED },
  totalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK },
  grand: {
    marginTop: 6,
    backgroundColor: NAVY,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandLabel: { fontSize: 8, color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  grandValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },

  // Payment box
  paymentBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 12,
  },
  boxHead: { fontSize: 8, fontFamily: "Helvetica-Bold", color: BLUE, letterSpacing: 1, marginBottom: 5 },
  boxBody: { fontSize: 8, color: INK, lineHeight: 1.4 },

  // Terms
  termsWrap: { marginTop: 14 },
  termsCols: { flexDirection: "row", gap: 20, marginTop: 5 },
  termCol: { flex: 1 },
  term: { flexDirection: "row", marginBottom: 3 },
  bullet: { fontSize: 7, color: CYAN, marginRight: 5, marginTop: 1 },
  termText: { flex: 1, fontSize: 7.5, color: "#475569", lineHeight: 1.35 },

  // Signatures
  sigWrap: { flexDirection: "row", gap: 30, marginTop: 24 },
  sigCol: { flex: 1 },
  sigHead: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: MUTED, letterSpacing: 1, marginBottom: 22 },
  sigLine: { borderTopWidth: 1, borderTopColor: INK, paddingTop: 4 },
  sigCaption: { fontSize: 7.5, color: MUTED },
});

/** Approximated RIC corporate seal — gear ring + monogram. */
function RicSeal() {
  const teeth = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI * 2) / 16;
    return (
      <Path
        key={i}
        d={`M${18 + Math.cos(a) * 16} ${18 + Math.sin(a) * 16} L${18 + Math.cos(a) * 19} ${18 + Math.sin(a) * 19}`}
        stroke="#1F5FA8"
        strokeWidth={2.4}
      />
    );
  });
  return (
    <Svg width={32} height={32} viewBox="0 0 36 36">
      <G>{teeth}</G>
      <Circle cx={18} cy={18} r={16} fill="#FFFFFF" stroke="#1F5FA8" strokeWidth={2} />
      <Circle cx={18} cy={18} r={11} fill="#1F5FA8" />
      <Path
        d="M11 22 L11 14 L14.5 14 L14.5 22 M18 14 L18 22 M21.5 22 L21.5 14 L25 19"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Column flex ratios — shared by header + rows so they line up.
const COL = { item: 0.5, unit: 0.9, desc: 2.9, cap: 1.3, qty: 0.7, unit_price: 1.5, total: 1.5 };

interface QuotationDocProps {
  projectName: string;
  projectId: string;
  info: QuotationInfo;
  lines: QuotationLine[];
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={bold ? s.infoValueBold : s.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function Term({ children }: { children: string }) {
  return (
    <View style={s.term}>
      <Text style={s.bullet}>{"●"}</Text>
      <Text style={s.termText}>{children}</Text>
    </View>
  );
}

export function QuotationDoc({ projectName, projectId, info, lines }: QuotationDocProps) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPriceKWD * l.quantity, 0);
  const vat = info.vatExclusive ? 0 : subtotal * (info.vatRate / 100);
  const total = subtotal + vat;
  const cur = info.currency || "KWD";

  return (
    <Document title={`COOLEX Quotation ${info.quotationNumber}`}>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            <RicSeal />
            <Text style={s.ricCoBold}>Refrigeration Industries &amp; Storage and Oil Services Co. K.S.C.</Text>
          </View>
          <View>
            <Image style={s.coolexLogo} src="/coolex-logo.png" />
            <Text style={s.coolexTag}>COMFORT BEYOND EXPECTATIONS</Text>
          </View>
        </View>
        <View style={s.headerRule} fixed />
        <View style={s.headerAccent} fixed />

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerText}>Refrigeration Industries &amp; Storage and Oil Services Co. K.S.C.</Text>
            <Text style={s.footerText}>
              Al Jahra Governorate, Industrial Sulaibiya, Block 1, Road 4, Plot No. 105 · P.O. Box: Safat 22261, 13083 Kuwait
            </Text>
          </View>
          <View>
            <Text style={s.footerRight}>+965 1833380</Text>
            <Text style={s.footerBold}>www.coolex.com.kw</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <Text style={s.title}>QUOTATION</Text>
        <Text style={s.titleNo}>{info.quotationNumber}</Text>

        {/* ── Info panels ── */}
        <View style={s.panels}>
          <View style={s.panel}>
            <Text style={s.panelHead}>PROJECT DETAILS</Text>
            <InfoRow label="Project Name" value={projectName} bold />
            <InfoRow label="Project ID" value={projectId} />
            <InfoRow label="Location" value={info.location} bold />
          </View>
          <View style={s.panelRight}>
            <Text style={s.panelHead}>QUOTATION INFORMATION</Text>
            <InfoRow label="Date" value={info.date} bold />
            <InfoRow label="Valid Until" value={`${info.validUntil} (${info.validDays} days)`} bold />
            <InfoRow label="Prepared By" value={info.preparedBy} bold />
            <InfoRow label="Department" value={info.department} />
            <InfoRow label="Branch" value={info.branch} />
            <InfoRow label="Currency" value={cur} bold />
          </View>
        </View>

        {/* ── Line-item table ── */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, { flex: COL.item }]}>ITEM</Text>
            <Text style={[s.th, { flex: COL.unit }]}>UNIT</Text>
            <Text style={[s.th, { flex: COL.desc }]}>MODEL &amp; DESCRIPTION</Text>
            <Text style={[s.th, { flex: COL.cap, textAlign: "center" }]}>CAPACITY (BTU/HR)</Text>
            <Text style={[s.th, { flex: COL.qty, textAlign: "center" }]}>QTY</Text>
            <Text style={[s.th, { flex: COL.unit_price, textAlign: "right" }]}>{`UNIT PRICE (${cur})`}</Text>
            <Text style={[s.th, { flex: COL.total, textAlign: "right" }]}>{`TOTAL (${cur})`}</Text>
          </View>

          {lines.map((l, i) => (
            <View key={l.id} style={[s.row, ...(i % 2 ? [s.rowAlt] : [])]} wrap={false}>
              <Text style={[s.itemNo, { flex: COL.item }]}>{String(i + 1).padStart(2, "0")}</Text>
              <View style={{ flex: COL.unit }}>
                <View style={s.thumbBox}>
                  {l.imageUrl ? (
                    <Image style={s.thumb} src={l.imageUrl} />
                  ) : (
                    <Text style={s.thumbPlaceholder}>Image</Text>
                  )}
                </View>
              </View>
              <View style={{ flex: COL.desc, paddingRight: 6 }}>
                <Text style={s.cellModel}>{l.model}</Text>
                <Text style={s.cellDesc}>{l.description}</Text>
              </View>
              <Text style={[s.cellNum, { flex: COL.cap, textAlign: "center" }]}>
                {l.capacityBtuh.toLocaleString("en-US")}
              </Text>
              <Text style={[s.cellNumBold, { flex: COL.qty, textAlign: "center" }]}>{l.quantity}</Text>
              <View style={{ flex: COL.unit_price, flexDirection: "row", justifyContent: "flex-end", alignItems: "baseline" }}>
                <Text style={s.price}>{formatKWD(l.unitPriceKWD)} </Text>
                <Text style={s.kwd}>{cur}</Text>
              </View>
              <View style={{ flex: COL.total, flexDirection: "row", justifyContent: "flex-end", alignItems: "baseline" }}>
                <Text style={s.priceTotal}>{formatKWD(l.unitPriceKWD * l.quantity)} </Text>
                <Text style={s.kwd}>{cur}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsWrap}>
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{`${formatKWD(subtotal)} ${cur}`}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>VAT</Text>
              <Text style={s.totalValue}>
                {info.vatExclusive ? "Exclusive" : `${formatKWD(vat)} ${cur} (${info.vatRate}%)`}
              </Text>
            </View>
            <View style={s.grand}>
              <Text style={s.grandLabel}>TOTAL AMOUNT</Text>
              <Text style={s.grandValue}>{`${cur} ${formatKWD(total)}`}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment instructions ── */}
        <View style={s.paymentBox}>
          <Text style={s.boxHead}>PAYMENT INSTRUCTIONS</Text>
          <Text style={s.boxBody}>
            Present this quotation to the COOLEX cashier for processing, quoting reference {info.quotationNumber}.
          </Text>
        </View>

        {/* ── Terms ── */}
        <View style={s.termsWrap}>
          <Text style={s.boxHead}>TERMS &amp; CONDITIONS</Text>
          <View style={s.termsCols}>
            <View style={s.termCol}>
              <Term>{`Quotation valid for ${info.validDays} calendar days from the date above.`}</Term>
              <Term>Delivery lead time: 6 months from order confirmation.</Term>
              <Term>{info.vatExclusive ? "Prices are exclusive of VAT." : `Prices are inclusive of ${info.vatRate}% VAT.`}</Term>
            </View>
            <View style={s.termCol}>
              <Term>Warranty as per COOLEX standard warranty terms.</Term>
              <Term>Subject to change without prior notice.</Term>
            </View>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={s.sigWrap}>
          <View style={s.sigCol}>
            <Text style={s.sigHead}>PREPARED BY</Text>
            <View style={s.sigLine}>
              <Text style={s.sigCaption}>{`${info.preparedBy} · ${info.department}`}</Text>
            </View>
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigHead}>CUSTOMER ACCEPTANCE</Text>
            <View style={s.sigLine}>
              <Text style={s.sigCaption}>Name, signature &amp; date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Default export: PDFViewer wrapper (used by dynamic import in QuotationDialog).
export default function QuotationPDFContent(props: QuotationDocProps) {
  return (
    <PDFViewer width="100%" height={550} style={{ border: "none" }}>
      <QuotationDoc {...props} />
    </PDFViewer>
  );
}

/** Editable header fields for a generated quotation. */
export interface QuotationInfo {
  quotationNumber: string;
  /** Display date, e.g. "28 Jun 2026". */
  date: string;
  /** Display date the quote lapses, derived from `date` + `validDays`. */
  validUntil: string;
  validDays: number;
  preparedBy: string;
  department: string;
  branch: string;
  currency: string;
  location: string;
  /** When true, prices are shown VAT-exclusive (no VAT line added to the total). */
  vatExclusive: boolean;
  /** VAT percentage applied when `vatExclusive` is false. */
  vatRate: number;
}

/** One priced line item on a quotation. */
export interface QuotationLine {
  id: string;
  /** Product thumbnail (public path); rendered as a bordered image cell. */
  imageUrl?: string;
  /** Model number, shown bold. */
  model: string;
  /** Short descriptor under the model (e.g. "Concealed Ducted Split Unit"). */
  description: string;
  capacityBtuh: number;
  quantity: number;
  unitPriceKWD: number;
}

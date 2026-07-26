import { round2 } from "@/lib/pricing";
import type { SettingsMap } from "@/lib/settings";
import type { QuotePdfData } from "@/lib/pdf/quoteTemplate";

interface QuoteRow {
  quote_number: string | null;
  client_name: string;
  client_contact: string | null;
  created_at: string;
  valid_until: string | null;
  delivery_estimate_date: string | null;
  notes: string | null;
  project_summary: string | null;
  pdf_summary_mode: "resumen" | "desglose";
  pdf_summary_label: string | null;
  pdf_show_tiers: boolean;
  pdf_show_extras: boolean;
  pdf_show_project_summary: boolean;
  pdf_show_notes: boolean;
}

interface QuoteItemRow {
  description: string | null;
  quantity: number;
  base_unit_price: number;
  item_type: "producto" | "extra";
  sort_order: number;
}

interface TierRow {
  min_qty: number;
  max_qty: number | null;
  unit_price: number;
}

function buildLine(description: string, quantity: number, unitPrice: number) {
  return {
    description,
    quantity,
    unitPrice: round2(unitPrice),
    totalPrice: round2(unitPrice * quantity),
  };
}

// Comparte esta lógica entre la ruta de descarga del PDF y la vista previa
// del admin, para que ambas muestren exactamente lo mismo.
export function buildQuotePdfData(params: {
  quote: QuoteRow;
  items: QuoteItemRow[];
  tiers: TierRow[];
  settings: SettingsMap;
  logoUrl: string | null;
}): QuotePdfData {
  const { quote, items, tiers, settings, logoUrl } = params;

  const productos = items
    .filter((i) => i.item_type === "producto")
    .sort((a, b) => a.sort_order - b.sort_order);
  const extras = items
    .filter((i) => i.item_type === "extra")
    .sort((a, b) => a.sort_order - b.sort_order);

  let itemLines: ReturnType<typeof buildLine>[];
  if (quote.pdf_summary_mode === "resumen" && productos.length > 0) {
    const totalQty = productos.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = productos.reduce((sum, i) => sum + i.base_unit_price * i.quantity, 0);
    const label =
      quote.pdf_summary_label?.trim() || productos[0].description || "Ítems del proyecto";
    itemLines = totalQty > 0 ? [buildLine(label, totalQty, totalPrice / totalQty)] : [];
  } else {
    itemLines = productos.map((i) => buildLine(i.description ?? "Ítem", i.quantity, i.base_unit_price));
  }

  const extraLines = extras.map((i) =>
    buildLine(i.description ?? "Adicional", i.quantity, i.base_unit_price)
  );

  return {
    quoteNumber: quote.quote_number,
    clientName: quote.client_name,
    clientContact: quote.client_contact,
    createdAt: new Date(quote.created_at).toLocaleDateString("es-UY"),
    validUntil: quote.valid_until,
    deliveryEstimateDate: quote.delivery_estimate_date,
    notes: quote.notes,
    projectSummary: quote.project_summary,
    items: itemLines,
    extras: extraLines,
    tiers: tiers.map((t) => ({ minQty: t.min_qty, maxQty: t.max_qty, unitPrice: t.unit_price })),
    showTiers: quote.pdf_show_tiers,
    showExtras: quote.pdf_show_extras,
    showProjectSummary: quote.pdf_show_project_summary,
    showNotes: quote.pdf_show_notes,
    legalText: (settings.quote_legal_text as string) ?? "",
    paymentTerms: (settings.quote_payment_terms as string) ?? "",
    leadTimeText: (settings.quote_lead_time_text as string) ?? "",
    logoUrl,
    ivaPct: Number(settings.iva_pct ?? 0),
    companyRut: (settings.company_rut as string) ?? "",
    companyAddress: (settings.company_address as string) ?? "",
    companyPhone: (settings.company_phone as string) ?? "",
  };
}

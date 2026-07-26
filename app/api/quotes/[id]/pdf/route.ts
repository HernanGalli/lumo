import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { generateQuotePdfBuffer } from "@/lib/pdf/generateQuotePdf";
import type { QuotePdfData } from "@/lib/pdf/quoteTemplate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Esta ruta vive fuera de /admin/*, así que el middleware no la protege:
  // el chequeo de sesión acá es obligatorio, no defensivo.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [{ data: quote }, { data: items }, { data: tiers }, { data: settingsRows }] =
    await Promise.all([
      supabase.from("quotes").select("*").eq("id", id).single(),
      supabase
        .from("quote_items")
        .select("description, quantity, base_unit_price, sort_order")
        .eq("quote_id", id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("quote_price_tiers")
        .select("min_qty, max_qty, unit_price, sort_order")
        .eq("quote_id", id)
        .order("sort_order", { ascending: true }),
      supabase.from("settings").select("key, value"),
    ]);

  if (!quote) {
    return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
  }

  const settings = settingsRowsToMap(settingsRows ?? []);

  const data: QuotePdfData = {
    quoteNumber: quote.quote_number,
    clientName: quote.client_name,
    clientContact: quote.client_contact,
    createdAt: new Date(quote.created_at).toLocaleDateString("es-UY"),
    validUntil: quote.valid_until,
    deliveryEstimateDate: quote.delivery_estimate_date,
    notes: quote.notes,
    items: (items ?? []).map((item) => ({
      description: item.description ?? "Ítem",
      quantity: item.quantity,
      basePrice: item.base_unit_price,
    })),
    tiers: (tiers ?? []).map((tier) => ({
      minQty: tier.min_qty,
      maxQty: tier.max_qty,
      unitPrice: tier.unit_price,
    })),
    legalText: (settings.quote_legal_text as string) ?? "",
    paymentTerms: (settings.quote_payment_terms as string) ?? "",
    leadTimeText: (settings.quote_lead_time_text as string) ?? "",
  };

  const pdfBuffer = await generateQuotePdfBuffer(data);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="presupuesto-${quote.quote_number ?? id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

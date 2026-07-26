import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { settingsRowsToMap } from "@/lib/settings";
import { generateQuotePdfBuffer } from "@/lib/pdf/generateQuotePdf";
import { buildQuotePdfData } from "@/lib/pdf/buildQuoteData";

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
        .select("description, quantity, base_unit_price, item_type, sort_order")
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

  const data = buildQuotePdfData({
    quote,
    items: items ?? [],
    tiers: tiers ?? [],
    settings,
    logoUrl: getPublicUrl(supabase, "branding", (settings.quote_logo_path as string) ?? null),
  });

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

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { deleteQuoteItem, regenerateTiers, updateQuoteTierPrice } from "@/lib/actions/quotes";
import { AddQuoteItemForm } from "@/components/admin/AddQuoteItemForm";
import { QuoteExportPanel } from "@/components/admin/QuoteExportPanel";
import { QuoteStatusSelect } from "@/components/admin/QuoteStatusSelect";

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

export default async function PresupuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: quote },
    { data: items },
    { data: tiers },
    { data: materials },
    { data: printers },
    { data: settingsRows },
  ] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase
      .from("quote_price_tiers")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
    supabase.from("materials").select("id, name").order("name"),
    supabase.from("printers").select("id, name").order("name"),
    supabase.from("settings").select("key, value"),
  ]);

  if (!quote) notFound();

  const settings = settingsRowsToMap(settingsRows ?? []);
  const defaultMargenPct = Number(settings.default_margin_pct ?? 0);
  const suggestedBasePrice = items?.[0]?.base_unit_price ?? 0;

  const previewData = {
    quoteNumber: quote.quote_number,
    clientName: quote.client_name,
    clientContact: quote.client_contact,
    createdAtLabel: new Date(quote.created_at).toLocaleDateString("es-UY"),
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

  return (
    <div className="max-w-4xl flex flex-col gap-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
          <h1 className="text-2xl font-semibold">
            {quote.quote_number ?? id.slice(0, 8)} — {quote.client_name}
          </h1>
          <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
        </div>
        <p className="text-foreground-muted text-sm">
          {quote.client_contact ?? "Sin contacto cargado"}
          {quote.delivery_estimate_date && ` · Entrega estimada: ${quote.delivery_estimate_date}`}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-4">Ítems</h2>
        <div className="flex flex-col gap-2 mb-2">
          {(items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-2 text-sm"
            >
              <div>
                <p>{item.description ?? "Ítem"}</p>
                <p className="text-xs text-foreground-muted">
                  Cantidad: {item.quantity} · Costo total: {formatoMoneda.format(item.costo_total)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{formatoMoneda.format(item.base_unit_price)}</span>
                <form action={deleteQuoteItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <button type="submit" className="text-xs text-rojo hover:underline">
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(items ?? []).length === 0 && (
            <p className="text-sm text-foreground-muted">Todavía no hay ítems.</p>
          )}
        </div>
      </section>

      <AddQuoteItemForm
        quoteId={quote.id}
        materials={materials ?? []}
        printers={printers ?? []}
        defaultMargenPct={quote.margin_pct ?? defaultMargenPct}
      />

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-1">Precios por cantidad</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Se generan a partir de las reglas por defecto en Configuración; podés ajustar cada
          precio manualmente después.
        </p>

        <form
          action={regenerateTiers}
          className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-border"
        >
          <input type="hidden" name="quoteId" value={quote.id} />
          <div>
            <label className="block text-xs text-foreground-muted mb-1" htmlFor="basePrice">
              Precio base por unidad
            </label>
            <input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              min={0}
              defaultValue={suggestedBasePrice}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
          >
            Generar tabla de precios
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {(tiers ?? []).map((tier) => (
            <form
              key={tier.id}
              action={updateQuoteTierPrice}
              className="flex items-center gap-3 text-sm"
            >
              <input type="hidden" name="id" value={tier.id} />
              <input type="hidden" name="quoteId" value={quote.id} />
              <span className="w-40 text-foreground-muted">
                {tier.max_qty ? `${tier.min_qty} - ${tier.max_qty} unidades` : `${tier.min_qty}+ unidades`}
              </span>
              <input
                name="unitPrice"
                type="number"
                step="0.01"
                min={0}
                defaultValue={tier.unit_price}
                className="rounded-md border border-border bg-background px-3 py-1.5 w-32"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 hover:border-azul"
              >
                Guardar
              </button>
            </form>
          ))}
          {(tiers ?? []).length === 0 && (
            <p className="text-sm text-foreground-muted">
              Todavía no hay tabla de precios generada.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-4">Exportar</h2>
        <QuoteExportPanel quoteId={quote.id} data={previewData} />
      </section>
    </div>
  );
}

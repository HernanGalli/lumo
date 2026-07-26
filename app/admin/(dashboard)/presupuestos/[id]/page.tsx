import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { settingsRowsToMap } from "@/lib/settings";
import { regenerateTiers, updateQuoteTierPrice } from "@/lib/actions/quotes";
import { sendQuoteEmail } from "@/lib/actions/gmail";
import { isGmailConnected } from "@/lib/gmail/client";
import { buildQuotePdfData } from "@/lib/pdf/buildQuoteData";
import { QuoteItemsSection } from "@/components/admin/QuoteItemsSection";
import { QuoteExportPanel } from "@/components/admin/QuoteExportPanel";
import { QuoteStatusSelect } from "@/components/admin/QuoteStatusSelect";
import { QuoteDetailsForm } from "@/components/admin/QuoteDetailsForm";
import { QuotePdfOptionsForm } from "@/components/admin/QuotePdfOptionsForm";

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
    gmailStatus,
    { data: emailLog },
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
    isGmailConnected(),
    supabase
      .from("email_log")
      .select("id, to_email, subject, status, sent_at")
      .eq("quote_id", id)
      .order("sent_at", { ascending: false }),
  ]);

  if (!quote) notFound();

  const settings = settingsRowsToMap(settingsRows ?? []);
  const defaultMargenPct = Number(settings.default_margin_pct ?? 0);
  const suggestedBasePrice = items?.[0]?.base_unit_price ?? 0;
  const logoUrl = getPublicUrl(supabase, "branding", (settings.quote_logo_path as string) ?? null);

  const previewData = buildQuotePdfData({
    quote,
    items: items ?? [],
    tiers: tiers ?? [],
    settings,
    logoUrl,
  });

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

      <QuoteDetailsForm quote={quote} />

      <QuoteItemsSection
        quoteId={quote.id}
        items={items ?? []}
        materials={materials ?? []}
        printers={printers ?? []}
        defaultMargenPct={quote.margin_pct ?? defaultMargenPct}
      />

      <QuotePdfOptionsForm quote={quote} />

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

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-1">Enviar por mail</h2>
        {gmailStatus.connected ? (
          <>
            <p className="text-sm text-foreground-muted mb-4">
              Se manda como PDF adjunto desde {gmailStatus.email}.
            </p>
            <form action={sendQuoteEmail} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <div>
                <label className="block text-xs text-foreground-muted mb-1" htmlFor="toEmail">
                  Email del cliente
                </label>
                <input
                  id="toEmail"
                  name="toEmail"
                  type="email"
                  required
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-foreground-muted">
            Conectá Gmail en{" "}
            <a href="/admin/configuracion" className="text-azul hover:underline">
              Configuración
            </a>{" "}
            para poder mandar el presupuesto por mail.
          </p>
        )}

        {(emailLog ?? []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-1.5">
            <p className="text-xs text-foreground-muted mb-1">Historial</p>
            {(emailLog ?? []).map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs">
                <span>
                  {log.to_email} · {new Date(log.sent_at).toLocaleString("es-UY")}
                </span>
                <span className={log.status === "sent" ? "text-green-600" : "text-rojo"}>
                  {log.status === "sent" ? "Enviado" : "Falló"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

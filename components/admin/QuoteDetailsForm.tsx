import { updateQuoteDetails } from "@/lib/actions/quotes";

interface QuoteDetails {
  id: string;
  quote_number: string | null;
  project_label: string | null;
  project_summary: string | null;
  client_name: string;
  client_contact: string | null;
  delivery_estimate_date: string | null;
  valid_until: string | null;
  margin_pct: number | null;
  notes: string | null;
}

export function QuoteDetailsForm({ quote }: { quote: QuoteDetails }) {
  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-1">Datos del presupuesto</h2>
      <p className="text-sm text-foreground-muted mb-4">
        Todo acá es editable, incluido el código — solo tiene que quedar único.
      </p>
      <form action={updateQuoteDetails} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={quote.id} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="quoteNumber">
              Código
            </label>
            <input
              id="quoteNumber"
              name="quoteNumber"
              defaultValue={quote.quote_number ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="projectLabel">
              Proyecto
            </label>
            <input
              id="projectLabel"
              name="projectLabel"
              defaultValue={quote.project_label ?? ""}
              placeholder="Llaveros, Cuadros, Merchandising..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="clientName">
              Cliente
            </label>
            <input
              id="clientName"
              name="clientName"
              required
              defaultValue={quote.client_name}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="clientContact">
              Contacto
            </label>
            <input
              id="clientContact"
              name="clientContact"
              defaultValue={quote.client_contact ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="deliveryEstimateDate">
              Entrega estimada
            </label>
            <input
              id="deliveryEstimateDate"
              name="deliveryEstimateDate"
              type="date"
              defaultValue={quote.delivery_estimate_date ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="validUntil">
              Válido hasta
            </label>
            <input
              id="validUntil"
              name="validUntil"
              type="date"
              defaultValue={quote.valid_until ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="marginPct">
              Margen de ganancia (%)
            </label>
            <input
              id="marginPct"
              name="marginPct"
              type="number"
              step="0.1"
              defaultValue={quote.margin_pct ?? undefined}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="projectSummary">
            Concepto del proyecto (para el PDF: filamento, resistencia, relieve, argolla reforzada, etc.)
          </label>
          <textarea
            id="projectSummary"
            name="projectSummary"
            rows={3}
            defaultValue={quote.project_summary ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={quote.notes ?? ""}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Guardar datos
        </button>
      </form>
    </section>
  );
}

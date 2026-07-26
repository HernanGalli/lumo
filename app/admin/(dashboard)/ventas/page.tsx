import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuoteStatusSelect } from "@/components/admin/QuoteStatusSelect";

const COLUMNS = [
  { status: "cotizado", label: "Cotizado" },
  { status: "aceptado", label: "Aceptado" },
  { status: "en_produccion", label: "En producción" },
  { status: "entregado", label: "Entregado" },
  { status: "cancelado", label: "Cancelado" },
] as const;

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, client_name, status, delivery_estimate_date")
    .order("delivery_estimate_date", { ascending: true, nullsFirst: false });

  const byStatus = new Map<string, typeof quotes>();
  for (const column of COLUMNS) byStatus.set(column.status, []);
  for (const quote of quotes ?? []) {
    byStatus.get(quote.status)?.push(quote);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Ventas</h1>
      <p className="text-foreground-muted mb-6">
        Pipeline de presupuestos por estado, ordenados por fecha de entrega.
      </p>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const items = byStatus.get(column.status) ?? [];
          return (
            <div key={column.status} className="w-72 shrink-0">
              <h2 className="mb-3 text-sm font-medium text-foreground-muted">
                {column.label} <span className="text-foreground-muted/70">({items.length})</span>
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((quote) => (
                  <div
                    key={quote.id}
                    className="rounded-lg border border-border bg-surface p-3 text-sm"
                  >
                    <Link
                      href={`/admin/presupuestos/${quote.id}`}
                      className="font-medium text-azul hover:underline"
                    >
                      {quote.quote_number ?? quote.id.slice(0, 8)}
                    </Link>
                    <p className="truncate">{quote.client_name}</p>
                    <p className="mb-2 text-xs text-foreground-muted">
                      {quote.delivery_estimate_date ?? "Sin fecha de entrega"}
                    </p>
                    <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-foreground-muted">Sin presupuestos.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

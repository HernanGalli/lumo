import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  cotizado: "Cotizado",
  aceptado: "Aceptado",
  en_produccion: "En producción",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  cotizado: "bg-amarillo/20 text-amarillo",
  aceptado: "bg-azul/15 text-azul",
  en_produccion: "bg-azul/15 text-azul",
  entregado: "bg-green-500/15 text-green-600",
  cancelado: "bg-rojo/15 text-rojo",
};

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, quote_number, client_name, status, delivery_estimate_date, created_at")
    .order("delivery_estimate_date", { ascending: true, nullsFirst: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Presupuestos</h1>
          <p className="text-foreground-muted">Ordenados por fecha de entrega estimada.</p>
        </div>
        <Link
          href="/admin/presupuestos/nuevo"
          className="rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Nuevo presupuesto
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground-muted border-b border-border">
              <th className="px-4 py-3 font-medium">N°</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Entrega estimada</th>
            </tr>
          </thead>
          <tbody>
            {(quotes ?? []).map((q) => (
              <tr key={q.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/presupuestos/${q.id}`} className="text-azul hover:underline">
                    {q.quote_number ?? q.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3">{q.client_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[q.status] ?? ""}`}
                  >
                    {STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {q.delivery_estimate_date ?? "—"}
                </td>
              </tr>
            ))}
            {(quotes ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-foreground-muted">
                  Todavía no hay presupuestos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

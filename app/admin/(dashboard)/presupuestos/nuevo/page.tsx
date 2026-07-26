import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { createQuote } from "@/lib/actions/quotes";

export default async function NuevoPresupuestoPage() {
  const supabase = await createClient();
  const { data: settingsRows } = await supabase.from("settings").select("key, value");
  const settings = settingsRowsToMap(settingsRows ?? []);
  const defaultMargenPct = Number(settings.default_margin_pct ?? 0);

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-sm text-foreground-muted mb-1";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Nuevo presupuesto</h1>
      <p className="text-foreground-muted mb-6">
        Después de crearlo vas a poder agregar ítems y generar la tabla de precios.
      </p>

      <form action={createQuote} className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="clientName">
            Cliente
          </label>
          <input id="clientName" name="clientName" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="clientContact">
            Contacto (teléfono/email)
          </label>
          <input id="clientContact" name="clientContact" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="deliveryEstimateDate">
              Entrega estimada
            </label>
            <input
              id="deliveryEstimateDate"
              name="deliveryEstimateDate"
              type="date"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="validUntil">
              Válido hasta
            </label>
            <input id="validUntil" name="validUntil" type="date" className={inputClass} />
          </div>
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
            defaultValue={defaultMargenPct}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="notes">
            Notas
          </label>
          <textarea id="notes" name="notes" rows={3} className={inputClass} />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Crear presupuesto
        </button>
      </form>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { SETTINGS_FIELDS, settingsRowsToMap } from "@/lib/settings";
import {
  createTierRule,
  deleteTierRule,
  updateSettings,
  updateTierRule,
} from "@/lib/actions/settings";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  const [{ data: settingsRows }, { data: tierRules }] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase
      .from("price_tier_rules")
      .select("id, min_qty, max_qty, adjustment_pct")
      .eq("is_default", true)
      .order("min_qty", { ascending: true }),
  ]);

  const settings = settingsRowsToMap(settingsRows ?? []);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Configuración</h1>
      <p className="text-foreground-muted mb-8">
        Estos valores alimentan la calculadora de costos y la plantilla de presupuestos.
      </p>

      <form action={updateSettings} className="rounded-lg border border-border bg-surface p-6 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SETTINGS_FIELDS.map((field) => (
            <div
              key={field.key}
              className={field.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              <label className="block text-sm text-foreground-muted mb-1" htmlFor={field.key}>
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  name={field.key}
                  rows={3}
                  defaultValue={(settings[field.key] as string) ?? ""}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul"
                />
              ) : (
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  defaultValue={settings[field.key] ?? (field.type === "number" ? 0 : "")}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul"
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-6 rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Guardar configuración
        </button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-1">Reglas de precio por cantidad</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Porcentaje de ajuste sobre el precio base para cada rango de cantidad. Dejá
          &quot;Hasta&quot; vacío para un tramo sin tope (ej. &quot;50+&quot;).
        </p>

        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 text-xs text-foreground-muted px-1">
            <span>Desde</span>
            <span>Hasta</span>
            <span>Ajuste %</span>
            <span />
            <span />
          </div>
          {(tierRules ?? []).map((rule) => (
            <form
              key={rule.id}
              action={updateTierRule}
              className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-center"
            >
              <input type="hidden" name="id" value={rule.id} />
              <input
                name="minQty"
                type="number"
                min={1}
                defaultValue={rule.min_qty}
                required
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <input
                name="maxQty"
                type="number"
                min={1}
                defaultValue={rule.max_qty ?? ""}
                placeholder="Sin tope"
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <input
                name="adjustmentPct"
                type="number"
                step="0.01"
                defaultValue={rule.adjustment_pct}
                required
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-2 text-sm hover:border-azul"
              >
                Guardar
              </button>
              <button
                formAction={deleteTierRule}
                className="rounded-md border border-border px-3 py-2 text-sm text-rojo hover:border-rojo"
              >
                Borrar
              </button>
            </form>
          ))}
        </div>

        <form
          action={createTierRule}
          className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-center mt-4 pt-4 border-t border-border"
        >
          <input
            name="minQty"
            type="number"
            min={1}
            placeholder="Desde"
            required
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <input
            name="maxQty"
            type="number"
            min={1}
            placeholder="Hasta (opcional)"
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <input
            name="adjustmentPct"
            type="number"
            step="0.01"
            placeholder="Ajuste %"
            required
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 rounded-md bg-azul px-3 py-2 text-sm text-white hover:bg-azul-claro"
          >
            Agregar tramo
          </button>
          <span />
        </form>
      </div>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { QuoteCalculatorForm } from "@/components/admin/QuoteCalculatorForm";

export default async function CalculadoraPage() {
  const supabase = await createClient();

  const [{ data: materials }, { data: printers }, { data: supplies }, { data: settingsRows }] =
    await Promise.all([
      supabase.from("materials").select("id, name, cost_per_kg").order("name"),
      supabase.from("printers").select("id, name, watts").order("name"),
      supabase.from("supplies").select("id, name, unit_cost").eq("active", true).order("name"),
      supabase.from("settings").select("key, value"),
    ]);

  const settings = settingsRowsToMap(settingsRows ?? []);
  const tarifaUteKwh = Number(settings.ute_tariff_kwh ?? 0);
  const defaultMargenPct = Number(settings.default_margin_pct ?? 0);
  const defaultValorHora = Number(settings.labor_hourly_rate ?? 0);

  const faltaConfig = !materials?.length || !printers?.length;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Calculadora de costos</h1>
      <p className="text-foreground-muted mb-6">
        Costo real y precio sugerido de una pieza según peso, tiempo de impresión y energía.
      </p>

      {faltaConfig && (
        <div className="mb-6 rounded-md border border-amarillo/50 bg-amarillo/10 px-4 py-3 text-sm">
          Cargá al menos un material y una impresora en{" "}
          <Link href="/admin/materiales" className="underline text-azul">
            Materiales e impresoras
          </Link>{" "}
          para poder calcular.
        </div>
      )}

      <QuoteCalculatorForm
        materials={materials ?? []}
        printers={printers ?? []}
        supplies={supplies ?? []}
        tarifaUteKwh={tarifaUteKwh}
        defaultMargenPct={defaultMargenPct}
        defaultValorHora={defaultValorHora}
      />
    </div>
  );
}

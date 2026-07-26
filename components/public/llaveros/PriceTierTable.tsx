import { getPublicPriceTiers } from "@/lib/actions/publicPricing";

// Tabla pública de "cuantos más llaveros, menor precio por unidad", sin
// exponer costos internos ni precios exactos — solo la estructura de tramos
// que ya se carga en /admin/configuracion (price_tier_rules), vía la vista
// pública public_price_tiers. Ver requerimientos-lumo-llaveros-v2.md §4.
function describeAdjustment(pct: number): string {
  if (pct === 0) return "Precio base";
  if (pct < 0) return "Descuento por volumen";
  return "Precio ajustado";
}

export async function PriceTierTable() {
  const tiers = await getPublicPriceTiers();
  if (tiers.length === 0) return null;

  return (
    <section className="contenedor py-12">
      <h2 className="titulo-seccion">Precios que bajan con la cantidad</h2>
      <div className="max-w-xl mx-auto overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-background-secundario">
              <th className="text-left px-4 py-3">Cantidad</th>
              <th className="text-left px-4 py-3">Precio por unidad</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">
                  {tier.max_qty ? `${tier.min_qty} – ${tier.max_qty} unidades` : `${tier.min_qty} o más unidades`}
                </td>
                <td className="px-4 py-3">{describeAdjustment(tier.adjustment_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-xs text-foreground-muted mt-4">
        Los valores exactos dependen del producto y material elegido — contanos tu idea y te
        pasamos el precio final.
      </p>
    </section>
  );
}

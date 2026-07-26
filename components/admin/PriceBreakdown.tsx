"use client";

const formatoMoneda = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
});

export function PriceBreakdown({
  costoMaterial,
  costoEnergia,
  costoManoObra,
  costoTotal,
  precioSugerido,
}: {
  costoMaterial: number;
  costoEnergia: number;
  costoManoObra: number;
  costoTotal: number;
  precioSugerido: number;
}) {
  const rows: [string, number][] = [
    ["Costo material", costoMaterial],
    ["Costo energía", costoEnergia],
    ["Costo mano de obra", costoManoObra],
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-4">Desglose</h2>
      <dl className="flex flex-col gap-2 text-sm mb-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-foreground-muted">{label}</dt>
            <dd>{formatoMoneda.format(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between border-t border-border pt-3 text-sm font-medium">
        <span>Costo total</span>
        <span>{formatoMoneda.format(costoTotal)}</span>
      </div>
      <div className="flex justify-between mt-3 rounded-md bg-background-secundario px-3 py-2">
        <span className="font-medium">Precio sugerido</span>
        <span className="font-semibold text-azul">{formatoMoneda.format(precioSugerido)}</span>
      </div>
    </div>
  );
}

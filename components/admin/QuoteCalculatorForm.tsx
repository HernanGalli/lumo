"use client";

import { useMemo, useState } from "react";
import {
  calcCostoBreakdown,
  calcCostosExtras,
  calcCostoTotal,
  calcGananciaNeta,
  calcPrecioSugerido,
  calcPrecioUnidad,
  calcPrecioVenta,
  round2,
} from "@/lib/pricing";
import { PriceBreakdown } from "@/components/admin/PriceBreakdown";

interface Material {
  id: string;
  name: string;
  cost_per_kg: number;
}

interface Printer {
  id: string;
  name: string;
  watts: number;
}

interface Supply {
  id: string;
  name: string;
  unit_cost: number;
}

export function QuoteCalculatorForm({
  materials,
  printers,
  supplies,
  tarifaUteKwh,
  defaultMargenPct,
  defaultValorHora,
}: {
  materials: Material[];
  printers: Printer[];
  supplies: Supply[];
  tarifaUteKwh: number;
  defaultMargenPct: number;
  defaultValorHora: number;
}) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [printerId, setPrinterId] = useState(printers[0]?.id ?? "");
  const [pesoGramos, setPesoGramos] = useState(0);
  const [tiempoHoras, setTiempoHoras] = useState(0);
  const [tiempoDisenoHoras, setTiempoDisenoHoras] = useState(0);
  const [valorHora, setValorHora] = useState(defaultValorHora);
  const [margenPct, setMargenPct] = useState(defaultMargenPct);
  const [selectedSupplies, setSelectedSupplies] = useState<Record<string, number>>({});
  const [costoExtrasManual, setCostoExtrasManual] = useState(0);
  const [loteQuantity, setLoteQuantity] = useState(1);

  const material = materials.find((m) => m.id === materialId);
  const printer = printers.find((p) => p.id === printerId);

  const breakdown = useMemo(() => {
    const result = calcCostoBreakdown({
      pesoGramos: pesoGramos || 0,
      costoPorKg: material?.cost_per_kg ?? 0,
      tiempoHoras: tiempoHoras || 0,
      consumoWatts: printer?.watts ?? 0,
      tarifaUteKwh,
      tiempoDisenoHoras: tiempoDisenoHoras || 0,
      valorHora: valorHora || 0,
    });
    return {
      ...result,
      costoMaterial: round2(result.costoMaterial),
      costoEnergia: round2(result.costoEnergia),
      costoManoObra: round2(result.costoManoObra),
      costoTotal: round2(result.costoTotal),
    };
  }, [pesoGramos, material, tiempoHoras, printer, tarifaUteKwh, tiempoDisenoHoras, valorHora]);

  const precioSugerido = round2(calcPrecioSugerido(breakdown.costoTotal, margenPct || 0));

  const costosExtras = useMemo(
    () =>
      round2(
        calcCostosExtras(
          Object.entries(selectedSupplies).map(([supplyId, quantity]) => ({
            unitCost: supplies.find((s) => s.id === supplyId)?.unit_cost ?? 0,
            quantity,
          }))
        ) + (costoExtrasManual || 0)
      ),
    [selectedSupplies, supplies, costoExtrasManual]
  );

  const costoTotalConInsumos = round2(
    breakdown.costoManoObra + calcCostoTotal(breakdown.costoMaterial, breakdown.costoEnergia, costosExtras)
  );
  const gananciaNeta = round2(calcGananciaNeta(costoTotalConInsumos, margenPct || 0));
  const precioVenta = round2(calcPrecioVenta(costoTotalConInsumos, gananciaNeta));
  const precioUnidad = loteQuantity > 0 ? round2(calcPrecioUnidad(precioVenta, loteQuantity)) : null;

  function toggleSupply(supplyId: string, checked: boolean) {
    setSelectedSupplies((prev) => {
      const next = { ...prev };
      if (checked) next[supplyId] = next[supplyId] ?? 1;
      else delete next[supplyId];
      return next;
    });
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-sm text-foreground-muted mb-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="material">
            Material
          </label>
          <select
            id="material"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className={inputClass}
          >
            {materials.length === 0 && <option value="">Sin materiales cargados</option>}
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="printer">
            Impresora
          </label>
          <select
            id="printer"
            value={printerId}
            onChange={(e) => setPrinterId(e.target.value)}
            className={inputClass}
          >
            {printers.length === 0 && <option value="">Sin impresoras cargadas</option>}
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.watts}W)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="peso">
              Peso (gramos)
            </label>
            <input
              id="peso"
              type="number"
              min={0}
              step="0.1"
              value={pesoGramos}
              onChange={(e) => setPesoGramos(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tiempo">
              Tiempo de impresión (hs)
            </label>
            <input
              id="tiempo"
              type="number"
              min={0}
              step="0.1"
              value={tiempoHoras}
              onChange={(e) => setTiempoHoras(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="tiempoDiseno">
              Tiempo de diseño (hs)
            </label>
            <input
              id="tiempoDiseno"
              type="number"
              min={0}
              step="0.1"
              value={tiempoDisenoHoras}
              onChange={(e) => setTiempoDisenoHoras(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="valorHora">
              Valor hora ($)
            </label>
            <input
              id="valorHora"
              type="number"
              min={0}
              step="0.01"
              value={valorHora}
              onChange={(e) => setValorHora(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="margen">
            Margen de ganancia (%)
          </label>
          <input
            id="margen"
            type="number"
            min={0}
            step="0.1"
            value={margenPct}
            onChange={(e) => setMargenPct(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <p className="text-xs text-foreground-muted">
          Tarifa UTE actual: ${tarifaUteKwh}/kWh (editable en Configuración).
        </p>

        <div className="pt-4 border-t border-border">
          <p className={labelClass}>Insumos usados (argolla, cadena, packaging, mano de obra...)</p>
          {supplies.length === 0 && (
            <p className="text-xs text-foreground-muted">
              Todavía no cargaste insumos en /admin/insumos.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {supplies.map((s) => {
              const checked = s.id in selectedSupplies;
              return (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleSupply(s.id, e.target.checked)}
                    />
                    {s.name} (${s.unit_cost})
                  </label>
                  {checked && (
                    <input
                      type="number"
                      min={1}
                      value={selectedSupplies[s.id]}
                      onChange={(e) =>
                        setSelectedSupplies((prev) => ({ ...prev, [s.id]: Number(e.target.value) || 1 }))
                      }
                      className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="costoExtrasManual">
            Costos Extras ($U)
          </label>
          <input
            id="costoExtrasManual"
            type="number"
            min={0}
            step="0.01"
            value={costoExtrasManual}
            onChange={(e) => setCostoExtrasManual(Number(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-foreground-muted mt-1">
            Costo adicional en pesos, sin necesidad de que sea un insumo dado de alta.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="loteQuantity">
            Cantidad de piezas del lote
          </label>
          <input
            id="loteQuantity"
            type="number"
            min={1}
            step="1"
            value={loteQuantity}
            onChange={(e) => setLoteQuantity(Number(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-foreground-muted mt-1">
            Cuántas unidades salieron de este cálculo (distinto de la cantidad que pide un
            cliente puntual en un presupuesto).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <PriceBreakdown
          costoMaterial={breakdown.costoMaterial}
          costoEnergia={breakdown.costoEnergia}
          costoManoObra={breakdown.costoManoObra}
          costoTotal={breakdown.costoTotal}
          precioSugerido={precioSugerido}
        />

        <div className="rounded-lg border border-azul/40 bg-azul/5 p-6 flex flex-col gap-2 text-sm">
          <h3 className="font-medium mb-1">Con insumos y lote</h3>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Costos Extras (insumos + manual)</span>
            <span>${costosExtras}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Costo Total</span>
            <span>${costoTotalConInsumos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Ganancia Neta ({margenPct}%)</span>
            <span>${gananciaNeta}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Precio Venta</span>
            <span>${precioVenta}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 mt-1 text-base font-semibold text-azul">
            <span>Precio Unidad</span>
            <span>{precioUnidad !== null ? `$${precioUnidad}` : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

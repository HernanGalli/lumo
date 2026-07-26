"use client";

import { useMemo, useState } from "react";
import { calcCostoBreakdown, calcPrecioSugerido, round2 } from "@/lib/pricing";
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

export function QuoteCalculatorForm({
  materials,
  printers,
  tarifaUteKwh,
  defaultMargenPct,
  defaultValorHora,
}: {
  materials: Material[];
  printers: Printer[];
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
      </div>

      <PriceBreakdown
        costoMaterial={breakdown.costoMaterial}
        costoEnergia={breakdown.costoEnergia}
        costoManoObra={breakdown.costoManoObra}
        costoTotal={breakdown.costoTotal}
        precioSugerido={precioSugerido}
      />
    </div>
  );
}

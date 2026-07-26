"use client";

import { useState } from "react";
import { addQuoteItem } from "@/lib/actions/quotes";

interface Material {
  id: string;
  name: string;
}

interface Printer {
  id: string;
  name: string;
}

export function AddQuoteItemForm({
  quoteId,
  materials,
  printers,
  defaultMargenPct,
}: {
  quoteId: string;
  materials: Material[];
  printers: Printer[];
  defaultMargenPct: number;
}) {
  const [mode, setMode] = useState<"calculado" | "manual">("calculado");

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <form action={addQuoteItem} className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-4">Agregar ítem</h2>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("calculado")}
          className={`rounded-md px-3 py-1.5 text-sm ${mode === "calculado" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
        >
          Calcular desde material
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-md px-3 py-1.5 text-sm ${mode === "manual" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
        >
          Precio manual
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="description">
            Descripción
          </label>
          <input id="description" name="description" className={inputClass} />
        </div>

        {mode === "calculado" ? (
          <>
            <div>
              <label className={labelClass} htmlFor="materialId">
                Material
              </label>
              <select id="materialId" name="materialId" className={inputClass}>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="printerId">
                Impresora
              </label>
              <select id="printerId" name="printerId" className={inputClass}>
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pesoGramos">
                Peso (g)
              </label>
              <input
                id="pesoGramos"
                name="pesoGramos"
                type="number"
                step="0.1"
                min={0}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tiempoHoras">
                Tiempo impresión (hs)
              </label>
              <input
                id="tiempoHoras"
                name="tiempoHoras"
                type="number"
                step="0.1"
                min={0}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tiempoDisenoHoras">
                Tiempo diseño (hs)
              </label>
              <input
                id="tiempoDisenoHoras"
                name="tiempoDisenoHoras"
                type="number"
                step="0.1"
                min={0}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="margenPct">
                Margen (%)
              </label>
              <input
                id="margenPct"
                name="margenPct"
                type="number"
                step="0.1"
                defaultValue={defaultMargenPct}
                className={inputClass}
              />
            </div>
          </>
        ) : (
          <div>
            <label className={labelClass} htmlFor="basePriceManual">
              Precio unitario
            </label>
            <input
              id="basePriceManual"
              name="basePriceManual"
              type="number"
              step="0.01"
              min={0}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="quantity">
            Cantidad
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            defaultValue={1}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
      >
        Agregar ítem
      </button>
    </form>
  );
}

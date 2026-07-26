"use client";

import { useState } from "react";

interface Material {
  id: string;
  name: string;
}

interface Printer {
  id: string;
  name: string;
}

interface Supply {
  id: string;
  name: string;
  unit_cost: number;
}

export interface ExistingQuoteItem {
  id: string;
  description: string | null;
  material_id: string | null;
  printer_id: string | null;
  peso_gramos: number | null;
  tiempo_horas: number | null;
  tiempo_diseno_horas: number | null;
  base_unit_price: number;
  quantity: number;
  item_type: "producto" | "extra";
  lote_quantity?: number | null;
  costo_extras_manual?: number | null;
  suppliesUsed?: { supply_id: string; quantity: number }[];
}

export function QuoteItemForm({
  quoteId,
  materials,
  printers,
  supplies,
  defaultMargenPct,
  action,
  item,
  onCancel,
}: {
  quoteId: string;
  materials: Material[];
  printers: Printer[];
  supplies: Supply[];
  defaultMargenPct: number;
  action: (formData: FormData) => void | Promise<void>;
  item?: ExistingQuoteItem;
  onCancel?: () => void;
}) {
  const [mode, setMode] = useState<"calculado" | "manual">(
    item && !item.material_id ? "manual" : "calculado"
  );
  const [itemType, setItemType] = useState<"producto" | "extra">(item?.item_type ?? "producto");
  const [selectedSupplies, setSelectedSupplies] = useState<Record<string, number>>(
    Object.fromEntries((item?.suppliesUsed ?? []).map((s) => [s.supply_id, s.quantity]))
  );

  function toggleSupply(supplyId: string, checked: boolean) {
    setSelectedSupplies((prev) => {
      const next = { ...prev };
      if (checked) next[supplyId] = next[supplyId] ?? 1;
      else delete next[supplyId];
      return next;
    });
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-4">{item ? "Editar ítem" : "Agregar ítem"}</h2>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="itemType" value={itemType} />
      {item && <input type="hidden" name="id" value={item.id} />}

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

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setItemType("producto")}
          className={`rounded-md px-3 py-1.5 text-sm ${itemType === "producto" ? "bg-azul-claro text-white" : "border border-border text-foreground-muted"}`}
        >
          Producto
        </button>
        <button
          type="button"
          onClick={() => setItemType("extra")}
          className={`rounded-md px-3 py-1.5 text-sm ${itemType === "extra" ? "bg-azul-claro text-white" : "border border-border text-foreground-muted"}`}
        >
          Adicional (aros, embalaje, envío)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="description">
            Descripción
          </label>
          <input
            id="description"
            name="description"
            defaultValue={item?.description ?? ""}
            className={inputClass}
          />
        </div>

        {mode === "calculado" ? (
          <>
            <div>
              <label className={labelClass} htmlFor="materialId">
                Material
              </label>
              <select
                id="materialId"
                name="materialId"
                defaultValue={item?.material_id ?? undefined}
                className={inputClass}
              >
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
              <select
                id="printerId"
                name="printerId"
                defaultValue={item?.printer_id ?? undefined}
                className={inputClass}
              >
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
                defaultValue={item?.peso_gramos ?? undefined}
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
                defaultValue={item?.tiempo_horas ?? undefined}
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
                defaultValue={item?.tiempo_diseno_horas ?? undefined}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="costoExtrasManual">
                Costos Extras ($U)
              </label>
              <input
                id="costoExtrasManual"
                name="costoExtrasManual"
                type="number"
                step="0.01"
                min={0}
                defaultValue={item?.costo_extras_manual ?? ""}
                placeholder="Opcional"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground-muted">
                Costo adicional en pesos, sumado al total antes del margen (packaging, envío,
                mano de obra puntual...).
              </p>
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
            <div>
              <label className={labelClass} htmlFor="loteQuantity">
                Cantidad de piezas del lote
              </label>
              <input
                id="loteQuantity"
                name="loteQuantity"
                type="number"
                min={1}
                step="1"
                defaultValue={item?.lote_quantity ?? ""}
                placeholder="Opcional"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-border">
              <p className={labelClass}>Insumos usados (argolla, cadena, packaging, mano de obra...)</p>
              {supplies.length === 0 && (
                <p className="text-xs text-foreground-muted">
                  Todavía no cargaste insumos en /admin/insumos.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
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
                            setSelectedSupplies((prev) => ({
                              ...prev,
                              [s.id]: Number(e.target.value) || 1,
                            }))
                          }
                          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.entries(selectedSupplies).map(([supplyId, qty]) => (
                <span key={supplyId}>
                  <input type="hidden" name="supplyIds" value={supplyId} />
                  <input type="hidden" name="supplyQuantities" value={qty} />
                </span>
              ))}
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
              defaultValue={mode === "manual" ? item?.base_unit_price : undefined}
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
            defaultValue={item?.quantity ?? 1}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          {item ? "Guardar cambios" : "Agregar ítem"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm hover:border-azul"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

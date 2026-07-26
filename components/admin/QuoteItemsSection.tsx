"use client";

import { useState } from "react";
import { addQuoteItem, deleteQuoteItem, updateQuoteItem } from "@/lib/actions/quotes";
import { QuoteItemForm, type ExistingQuoteItem } from "@/components/admin/QuoteItemForm";
import { QuoteItemCostsTable, type QuoteItemCostRow } from "@/components/admin/QuoteItemCostsTable";

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

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

export function QuoteItemsSection({
  quoteId,
  items,
  materials,
  printers,
  supplies,
  costsByItem,
  defaultMargenPct,
}: {
  quoteId: string;
  items: (ExistingQuoteItem & { costo_total: number })[];
  materials: Material[];
  printers: Printer[];
  supplies: Supply[];
  costsByItem: Record<string, QuoteItemCostRow[]>;
  defaultMargenPct: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = items.find((i) => i.id === editingId);

  const productos = items.filter((i) => i.item_type !== "extra");
  const extras = items.filter((i) => i.item_type === "extra");

  function renderItem(item: (typeof items)[number]) {
    const costs = costsByItem[item.id] ?? [];
    return (
      <div key={item.id} className="rounded-md border border-border px-4 py-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p>{item.description ?? "Ítem"}</p>
            <p className="text-xs text-foreground-muted">
              Cantidad: {item.quantity} · Costo total: {formatoMoneda.format(item.costo_total)}
              {item.lote_quantity ? ` · Lote: ${item.lote_quantity} piezas` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium">{formatoMoneda.format(item.base_unit_price)}</span>
            <button
              type="button"
              className="text-xs text-azul hover:underline"
              onClick={() => setEditingId(item.id)}
            >
              Editar
            </button>
            <form action={deleteQuoteItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="quoteId" value={quoteId} />
              <button type="submit" className="text-xs text-rojo hover:underline">
                Borrar
              </button>
            </form>
          </div>
        </div>
        {costs.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-xs text-foreground-muted">
              Desglose de costos ({costs.length})
            </summary>
            <QuoteItemCostsTable quoteId={quoteId} costs={costs} />
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-4">Ítems</h2>
        <div className="flex flex-col gap-2 mb-2">
          {productos.map(renderItem)}
          {productos.length === 0 && <p className="text-sm text-foreground-muted">Todavía no hay ítems.</p>}
        </div>

        {extras.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2 text-foreground-muted">
              Adicionales (aros, embalaje, envío)
            </h3>
            <div className="flex flex-col gap-2">{extras.map(renderItem)}</div>
          </div>
        )}
      </section>

      <QuoteItemForm
        key={editingItem?.id ?? "new"}
        quoteId={quoteId}
        materials={materials}
        printers={printers}
        supplies={supplies}
        defaultMargenPct={defaultMargenPct}
        action={editingItem ? updateQuoteItem : addQuoteItem}
        item={editingItem}
        onCancel={editingItem ? () => setEditingId(null) : undefined}
      />
    </div>
  );
}

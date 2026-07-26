"use client";

import { useState } from "react";
import { addQuoteItem, deleteQuoteItem, updateQuoteItem } from "@/lib/actions/quotes";
import { QuoteItemForm, type ExistingQuoteItem } from "@/components/admin/QuoteItemForm";

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

interface Material {
  id: string;
  name: string;
}
interface Printer {
  id: string;
  name: string;
}

export function QuoteItemsSection({
  quoteId,
  items,
  materials,
  printers,
  defaultMargenPct,
}: {
  quoteId: string;
  items: (ExistingQuoteItem & { costo_total: number })[];
  materials: Material[];
  printers: Printer[];
  defaultMargenPct: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = items.find((i) => i.id === editingId);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-4">Ítems</h2>
        <div className="flex flex-col gap-2 mb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-2 text-sm"
            >
              <div>
                <p>{item.description ?? "Ítem"}</p>
                <p className="text-xs text-foreground-muted">
                  Cantidad: {item.quantity} · Costo total: {formatoMoneda.format(item.costo_total)}
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
          ))}
          {items.length === 0 && <p className="text-sm text-foreground-muted">Todavía no hay ítems.</p>}
        </div>
      </section>

      <QuoteItemForm
        key={editingItem?.id ?? "new"}
        quoteId={quoteId}
        materials={materials}
        printers={printers}
        defaultMargenPct={defaultMargenPct}
        action={editingItem ? updateQuoteItem : addQuoteItem}
        item={editingItem}
        onCancel={editingItem ? () => setEditingId(null) : undefined}
      />
    </div>
  );
}

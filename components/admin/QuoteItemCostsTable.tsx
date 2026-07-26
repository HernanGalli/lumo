"use client";

import { useRef } from "react";
import { toggleQuoteItemCostVisibility } from "@/lib/actions/quotes";

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

export interface QuoteItemCostRow {
  id: string;
  concept: string;
  amount: number;
  show_in_pdf: boolean;
}

function CostRow({ quoteId, row }: { quoteId: string; row: QuoteItemCostRow }) {
  const formRef = useRef<HTMLFormElement>(null);
  const isMargen = row.concept.startsWith("Margen");

  return (
    <tr className="border-t border-border">
      <td className="py-1.5 pr-3">{row.concept}</td>
      <td className="py-1.5 pr-3 text-right">{formatoMoneda.format(row.amount)}</td>
      <td className="py-1.5 text-center">
        {isMargen ? (
          <span className="text-xs text-foreground-muted" title="El margen nunca se muestra en el PDF del cliente">
            —
          </span>
        ) : (
          <form ref={formRef} action={toggleQuoteItemCostVisibility}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="quoteId" value={quoteId} />
            <input
              type="checkbox"
              name="showInPdf"
              defaultChecked={row.show_in_pdf}
              onChange={() => formRef.current?.requestSubmit()}
            />
          </form>
        )}
      </td>
    </tr>
  );
}

// Desglose de costos de un ítem con checkbox de visibilidad por fila — la
// fila de Margen nunca tiene checkbox (ver presupuestos-desglose-y-pdf.md
// §2). Se genera automáticamente al guardar el ítem (lib/actions/quotes.ts,
// syncItemCostsAndSupplies).
export function QuoteItemCostsTable({ quoteId, costs }: { quoteId: string; costs: QuoteItemCostRow[] }) {
  if (costs.length === 0) return null;

  return (
    <table className="w-full text-xs mt-2">
      <thead>
        <tr className="text-foreground-muted">
          <th className="text-left font-normal pb-1">Concepto</th>
          <th className="text-right font-normal pb-1">Monto</th>
          <th className="text-center font-normal pb-1">Mostrar en PDF</th>
        </tr>
      </thead>
      <tbody>
        {costs.map((row) => (
          <CostRow key={row.id} quoteId={quoteId} row={row} />
        ))}
      </tbody>
    </table>
  );
}

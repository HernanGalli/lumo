"use client";

import { useRef } from "react";
import { updateQuoteStatus } from "@/lib/actions/quotes";

const STATUS_OPTIONS = [
  { value: "cotizado", label: "Cotizado" },
  { value: "aceptado", label: "Aceptado" },
  { value: "en_produccion", label: "En producción" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateQuoteStatus} className="flex items-center gap-2">
      <input type="hidden" name="id" value={quoteId} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}

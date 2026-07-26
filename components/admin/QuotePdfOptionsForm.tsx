"use client";

import { useState } from "react";
import { updateQuotePdfOptions } from "@/lib/actions/quotes";

interface QuotePdfOptions {
  id: string;
  pdf_summary_mode: "resumen" | "desglose";
  pdf_summary_label: string | null;
  pdf_show_tiers: boolean;
  pdf_show_extras: boolean;
  pdf_show_project_summary: boolean;
  pdf_show_notes: boolean;
}

export function QuotePdfOptionsForm({ quote }: { quote: QuotePdfOptions }) {
  const [mode, setMode] = useState<"resumen" | "desglose">(quote.pdf_summary_mode);

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-1">Qué se ve en el PDF</h2>
      <p className="text-sm text-foreground-muted mb-4">
        Llaves para prender/apagar secciones sin borrar el contenido, más el modo de armado de los ítems.
      </p>
      <form action={updateQuotePdfOptions} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={quote.id} />

        <div>
          <span className={labelClass}>Ítems del proyecto</span>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setMode("resumen")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "resumen" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
            >
              Resumen (1 línea: nombre, cantidad, unitario y total)
            </button>
            <button
              type="button"
              onClick={() => setMode("desglose")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "desglose" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
            >
              Desglose (ítem por ítem)
            </button>
          </div>
          <input type="hidden" name="pdfSummaryMode" value={mode} />

          {mode === "resumen" && (
            <div>
              <label className={labelClass} htmlFor="pdfSummaryLabel">
                Nombre del ítem en el resumen (opcional, si no se arma automático)
              </label>
              <input
                id="pdfSummaryLabel"
                name="pdfSummaryLabel"
                defaultValue={quote.pdf_summary_label ?? ""}
                placeholder="Llavero personalizado — Escudo Nacional"
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pdfShowTiers" defaultChecked={quote.pdf_show_tiers} />
            Mostrar tabla de precios por cantidad (3-4 escalones)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pdfShowExtras" defaultChecked={quote.pdf_show_extras} />
            Mostrar adicionales (aros, embalaje, envío)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pdfShowProjectSummary"
              defaultChecked={quote.pdf_show_project_summary}
            />
            Mostrar concepto del proyecto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pdfShowNotes" defaultChecked={quote.pdf_show_notes} />
            Mostrar notas
          </label>
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Guardar opciones de PDF
        </button>
      </form>
    </section>
  );
}

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

const TOGGLE_OPTIONS: { key: keyof Pick<QuotePdfOptions, "pdf_show_tiers" | "pdf_show_extras" | "pdf_show_project_summary" | "pdf_show_notes">; name: string; title: string; description: string }[] = [
  {
    key: "pdf_show_tiers",
    name: "pdfShowTiers",
    title: "Tabla de precios por cantidad",
    description: "3-4 escalones de descuento por volumen.",
  },
  {
    key: "pdf_show_extras",
    name: "pdfShowExtras",
    title: "Adicionales",
    description: "Aros, embalaje, envío.",
  },
  {
    key: "pdf_show_project_summary",
    name: "pdfShowProjectSummary",
    title: "Concepto del proyecto",
    description: "El resumen del proyecto cargado en los detalles.",
  },
  {
    key: "pdf_show_notes",
    name: "pdfShowNotes",
    title: "Notas",
    description: "Notas internas que agregaste al presupuesto.",
  },
];

export function QuotePdfOptionsForm({ quote }: { quote: QuotePdfOptions }) {
  const [mode, setMode] = useState<"resumen" | "desglose">(quote.pdf_summary_mode);

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wide";

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-1">Qué se ve en el PDF</h2>
      <p className="text-sm text-foreground-muted mb-5">
        Llaves para prender/apagar secciones sin borrar el contenido, más el modo de armado de los
        ítems.
      </p>
      <form action={updateQuotePdfOptions} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={quote.id} />

        <div>
          <span className={labelClass}>Ítems del proyecto</span>
          <div className="inline-flex rounded-md border border-border p-1 mb-2">
            <button
              type="button"
              onClick={() => setMode("resumen")}
              className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "resumen" ? "bg-azul text-white" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Resumen
            </button>
            <button
              type="button"
              onClick={() => setMode("desglose")}
              className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "desglose" ? "bg-azul text-white" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Desglose
            </button>
          </div>
          <p className="text-xs text-foreground-muted mb-3">
            {mode === "resumen"
              ? "Todos los ítems en una sola línea: nombre, cantidad, precio unitario y total."
              : "Un renglón por ítem, cada uno con su propio desglose de costos si lo tildaste abajo en la sección de ítems."}
            {" "}Con un solo ítem, se ve igual en los dos modos.
          </p>
          <input type="hidden" name="pdfSummaryMode" value={mode} />

          {mode === "resumen" && (
            <div>
              <label className="block text-xs text-foreground-muted mb-1" htmlFor="pdfSummaryLabel">
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

        <div className="flex flex-col gap-3 pt-4 border-t border-border">
          {TOGGLE_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                name={opt.name}
                defaultChecked={quote[opt.key]}
                className="mt-0.5 h-4 w-4 shrink-0 accent-azul"
              />
              <span>
                <span className="block">{opt.title}</span>
                <span className="block text-xs text-foreground-muted">{opt.description}</span>
              </span>
            </label>
          ))}
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

"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QuoteDocumentPreview, type QuotePreviewData } from "@/components/admin/QuoteDocumentPreview";

export function QuoteExportPanel({
  quoteId,
  data,
}: {
  quoteId: string;
  data: QuotePreviewData;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExportImage() {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `presupuesto-${data.quoteNumber ?? quoteId}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={handleExportImage}
          disabled={exporting}
          className="rounded-md border border-border px-4 py-2 text-sm hover:border-azul disabled:opacity-60"
        >
          {exporting ? "Generando imagen..." : "Descargar imagen (WhatsApp)"}
        </button>
        <a
          href={`/api/quotes/${quoteId}/pdf`}
          className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Descargar PDF
        </a>
      </div>
      <QuoteDocumentPreview ref={previewRef} data={data} />
    </div>
  );
}

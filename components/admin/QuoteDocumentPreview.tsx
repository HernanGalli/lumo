import { forwardRef, Fragment } from "react";
import type { QuotePdfData, QuoteLine } from "@/lib/pdf/quoteTemplate";

const formatoMoneda = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
});

function LinesTable({ lines }: { lines: QuoteLine[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-azul text-azul">
          <th className="py-1 font-semibold">Descripción</th>
          <th className="py-1 font-semibold text-right">Cant.</th>
          <th className="py-1 font-semibold text-right">Precio unit.</th>
          <th className="py-1 font-semibold text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, i) => (
          <Fragment key={i}>
            <tr className="border-b border-[#eee]">
              <td className="py-1.5">{line.description}</td>
              <td className="py-1.5 text-right">{line.quantity}</td>
              <td className="py-1.5 text-right">{formatoMoneda.format(line.unitPrice)}</td>
              <td className="py-1.5 text-right font-semibold">{formatoMoneda.format(line.totalPrice)}</td>
            </tr>
            {line.costBreakdown?.map((cost, j) => (
              <tr key={j} className="border-b border-[#eee] text-[#666] text-xs">
                <td className="py-1 pl-4">{cost.concept}</td>
                <td />
                <td />
                <td className="py-1 text-right">{formatoMoneda.format(cost.amount)}</td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

export const QuoteDocumentPreview = forwardRef<HTMLDivElement, { data: QuotePdfData }>(
  function QuoteDocumentPreview({ data }, ref) {
    return (
      <div
        ref={ref}
        className="rounded-lg border border-border bg-white text-[#333] p-8 max-w-2xl mx-auto"
      >
        <div className="border-b-2 border-azul pb-3 mb-4">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="LUMO" style={{ height: 40, marginBottom: 6 }} />
          ) : (
            <p className="text-xl font-bold text-azul">LUMO</p>
          )}
          <p className="text-xs text-[#666]">Diseño e Impresión 3D — Montevideo, Uruguay</p>
          {(data.companyRut || data.companyAddress || data.companyPhone) && (
            <p className="text-xs text-[#666]">
              {[data.companyRut, data.companyAddress, data.companyPhone].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="text-sm mt-2">Propuesta comercial de diseño — {data.quoteNumber ?? ""}</p>
        </div>

        <div className="text-sm mb-4 flex flex-col gap-1">
          <p>
            <span className="text-[#666]">Cliente: </span>
            {data.clientName}
          </p>
          {data.clientContact && (
            <p>
              <span className="text-[#666]">Contacto: </span>
              {data.clientContact}
            </p>
          )}
          <p>
            <span className="text-[#666]">Fecha: </span>
            {data.createdAt}
          </p>
          {data.validUntil && (
            <p>
              <span className="text-[#666]">Válido hasta: </span>
              {data.validUntil}
            </p>
          )}
          {data.deliveryEstimateDate && (
            <p>
              <span className="text-[#666]">Entrega estimada: </span>
              {data.deliveryEstimateDate}
            </p>
          )}
        </div>

        {data.showProjectSummary && data.projectSummary && (
          <div className="mb-4 text-sm">
            <p className="font-semibold text-azul mb-1">Concepto del proyecto</p>
            <p className="whitespace-pre-line">{data.projectSummary}</p>
          </div>
        )}

        {data.items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-azul mb-2">Inversión del proyecto</p>
            <LinesTable lines={data.items} />
          </div>
        )}

        {data.showExtras && data.extras.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-azul mb-2">Adicionales</p>
            <LinesTable lines={data.extras} />
          </div>
        )}

        {data.totalGeneral > 0 && (
          <div className="mb-4 flex items-center justify-between rounded bg-[#0F172A] px-4 py-3 text-white">
            <span className="text-xs uppercase tracking-wide text-[#CBD5E1]">Total</span>
            <span className="text-xl font-bold text-[#FF6B00]">{formatoMoneda.format(data.totalGeneral)}</span>
          </div>
        )}

        {data.showTiers && data.tiers.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-azul mb-2">Precios por cantidad</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-azul text-azul">
                  <th className="py-1 font-semibold">Cantidad</th>
                  <th className="py-1 font-semibold text-right">Precio unit.</th>
                </tr>
              </thead>
              <tbody>
                {data.tiers.map((tier, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="py-1.5">
                      {tier.maxQty ? `${tier.minQty} - ${tier.maxQty} unidades` : `${tier.minQty}+ unidades`}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-azul">
                      {formatoMoneda.format(tier.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.ivaPct > 0 && (
              <p className="text-xs text-[#666] mt-1">Precios + IVA ({data.ivaPct}%)</p>
            )}
          </div>
        )}

        {data.showNotes && data.notes && (
          <div className="mb-4 text-sm">
            <p className="font-semibold text-azul mb-1">Notas</p>
            <p>{data.notes}</p>
          </div>
        )}

        {data.paymentTerms && (
          <div className="mb-4 text-sm bg-amarillo/10 border-l-4 border-amarillo p-3 rounded">
            <p className="font-semibold mb-1">Fases de pago</p>
            <p>{data.paymentTerms}</p>
          </div>
        )}

        <div className="border-t border-[#eee] pt-3 text-xs text-[#666] flex flex-col gap-0.5">
          {data.leadTimeText && <p>Tiempo de entrega: {data.leadTimeText}</p>}
          {data.legalText && <p>{data.legalText}</p>}
        </div>
      </div>
    );
  }
);

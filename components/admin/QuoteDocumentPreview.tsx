import { forwardRef } from "react";

const formatoMoneda = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
});

export interface QuotePreviewData {
  quoteNumber: string | null;
  clientName: string;
  clientContact: string | null;
  createdAtLabel: string;
  validUntil: string | null;
  deliveryEstimateDate: string | null;
  notes: string | null;
  items: { description: string; quantity: number; basePrice: number }[];
  tiers: { minQty: number; maxQty: number | null; unitPrice: number }[];
  legalText: string;
  paymentTerms: string;
  leadTimeText: string;
  logoUrl: string | null;
  ivaPct: number;
  companyRut: string;
  companyAddress: string;
  companyPhone: string;
}

export const QuoteDocumentPreview = forwardRef<HTMLDivElement, { data: QuotePreviewData }>(
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
          <p className="text-sm mt-2">Presupuesto {data.quoteNumber ?? ""}</p>
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
            {data.createdAtLabel}
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

        {data.items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-azul mb-2">Producto(s)</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-azul text-azul">
                  <th className="py-1 font-semibold">Descripción</th>
                  <th className="py-1 font-semibold text-right">Cant.</th>
                  <th className="py-1 font-semibold text-right">Precio unit.</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => (
                  <tr key={i} className="border-b border-[#eee]">
                    <td className="py-1.5">{item.description}</td>
                    <td className="py-1.5 text-right">{item.quantity}</td>
                    <td className="py-1.5 text-right">{formatoMoneda.format(item.basePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.tiers.length > 0 && (
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

        {data.notes && (
          <div className="mb-4 text-sm">
            <p className="font-semibold text-azul mb-1">Notas</p>
            <p>{data.notes}</p>
          </div>
        )}

        <div className="border-t border-[#eee] pt-3 text-xs text-[#666] flex flex-col gap-0.5">
          {data.leadTimeText && <p>Tiempo de entrega: {data.leadTimeText}</p>}
          {data.paymentTerms && <p>Forma de pago: {data.paymentTerms}</p>}
          {data.legalText && <p>{data.legalText}</p>}
        </div>
      </div>
    );
  }
);

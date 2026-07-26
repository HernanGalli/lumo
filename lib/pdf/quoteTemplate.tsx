import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Identidad "Tech Luminescente": header oscuro con acento naranja, cian como
// color secundario para destacar precios por cantidad. El cuerpo se mantiene
// claro para que el PDF siga siendo legible al imprimir/reenviar por mail.
const NAVY = "#0F172A";
const ORANGE = "#FF6B00";
const CYAN = "#06B6D4";
const MUTED = "#64748B";
const TEXT = "#1E293B";

const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 10, fontFamily: "Helvetica", color: TEXT },
  header: {
    backgroundColor: NAVY,
    color: "#ffffff",
    padding: "28 40",
  },
  headerAccent: { height: 4, backgroundColor: ORANGE },
  brand: { fontSize: 22, fontWeight: 700, color: "#ffffff" },
  subBrand: { fontSize: 9, color: "#CBD5E1", marginTop: 3 },
  quoteNumber: {
    fontSize: 11,
    marginTop: 10,
    color: ORANGE,
    fontWeight: 700,
  },
  body: { padding: "24 40 40" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionAccentLine: { height: 2, width: 32, backgroundColor: ORANGE, marginBottom: 8 },
  row: { flexDirection: "row" },
  label: { color: MUTED, width: 90 },
  value: { flex: 1 },
  concept: {
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    padding: 12,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: TEXT,
  },
  table: { display: "flex", width: "100%", marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #E2E8F0", paddingVertical: 7 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: `1.5 solid ${NAVY}`,
    paddingBottom: 6,
    fontWeight: 700,
    color: NAVY,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right", fontWeight: 700 },
  tierPrice: { fontWeight: 700, color: CYAN },
  footer: {
    marginTop: 8,
    paddingTop: 14,
    borderTop: "1 solid #E2E8F0",
    fontSize: 9,
    color: MUTED,
  },
  investmentBox: {
    marginTop: 4,
    padding: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 4,
    borderLeft: `3 solid ${ORANGE}`,
  },
  costSubRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingLeft: 12,
    fontSize: 8.5,
    color: MUTED,
  },
  totalGeneralBox: {
    marginTop: 4,
    marginBottom: 16,
    padding: "16 18",
    backgroundColor: NAVY,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalGeneralLabel: { fontSize: 12, color: "#CBD5E1", textTransform: "uppercase", letterSpacing: 0.5 },
  totalGeneralValue: { fontSize: 22, fontWeight: 700, color: ORANGE },
});

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Filas de quote_item_costs con show_in_pdf=true (nunca incluye Margen). */
  costBreakdown?: { concept: string; amount: number }[];
}

export interface QuotePdfData {
  quoteNumber: string | null;
  clientName: string;
  clientContact: string | null;
  createdAt: string;
  validUntil: string | null;
  deliveryEstimateDate: string | null;
  notes: string | null;
  projectSummary: string | null;
  items: QuoteLine[];
  extras: QuoteLine[];
  totalGeneral: number;
  tiers: {
    minQty: number;
    maxQty: number | null;
    unitPrice: number;
  }[];
  showTiers: boolean;
  showExtras: boolean;
  showProjectSummary: boolean;
  showNotes: boolean;
  legalText: string;
  paymentTerms: string;
  leadTimeText: string;
  logoUrl: string | null;
  ivaPct: number;
  companyRut: string;
  companyAddress: string;
  companyPhone: string;
}

function LinesTable({ lines }: { lines: QuoteLine[] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={styles.colDesc}>Descripción</Text>
        <Text style={styles.colQty}>Cantidad</Text>
        <Text style={styles.colUnit}>Precio unitario</Text>
        <Text style={styles.colTotal}>Total</Text>
      </View>
      {lines.map((line, i) => (
        <View key={i}>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colUnit}>{formatCurrency(line.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(line.totalPrice)}</Text>
          </View>
          {line.costBreakdown?.map((cost, j) => (
            <View style={styles.costSubRow} key={j}>
              <Text style={styles.colDesc}>{cost.concept}</Text>
              <Text style={styles.colTotal}>{formatCurrency(cost.amount)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const companyLine = [data.companyRut, data.companyAddress, data.companyPhone]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document title={`Presupuesto ${data.quoteNumber ?? ""}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.logoUrl ? (
            // Image acá es el componente de @react-pdf/renderer (no HTML <img>,
            // no aplica el atributo alt de accesibilidad web).
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={data.logoUrl} style={{ height: 32, marginBottom: 6 }} />
          ) : (
            <Text style={styles.brand}>LUMO</Text>
          )}
          <Text style={styles.subBrand}>Diseño e Impresión 3D — Montevideo, Uruguay</Text>
          {companyLine && <Text style={styles.subBrand}>{companyLine}</Text>}
          <Text style={styles.quoteNumber}>PROPUESTA COMERCIAL DE DISEÑO — {data.quoteNumber ?? ""}</Text>
        </View>
        <View style={styles.headerAccent} />

        <View style={styles.body}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Cliente</Text>
              <Text style={styles.value}>{data.clientName}</Text>
            </View>
            {data.clientContact && (
              <View style={styles.row}>
                <Text style={styles.label}>Contacto</Text>
                <Text style={styles.value}>{data.clientContact}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>{data.createdAt}</Text>
            </View>
            {data.validUntil && (
              <View style={styles.row}>
                <Text style={styles.label}>Válido hasta</Text>
                <Text style={styles.value}>{data.validUntil}</Text>
              </View>
            )}
            {data.deliveryEstimateDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Entrega estimada</Text>
                <Text style={styles.value}>{data.deliveryEstimateDate}</Text>
              </View>
            )}
          </View>

          {data.showProjectSummary && data.projectSummary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Concepto del proyecto</Text>
              <View style={styles.sectionAccentLine} />
              <View style={styles.concept}>
                <Text>{data.projectSummary}</Text>
              </View>
            </View>
          )}

          {data.items.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inversión del proyecto</Text>
              <View style={styles.sectionAccentLine} />
              <LinesTable lines={data.items} />
            </View>
          )}

          {data.showExtras && data.extras.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adicionales</Text>
              <View style={styles.sectionAccentLine} />
              <LinesTable lines={data.extras} />
            </View>
          )}

          {data.totalGeneral > 0 && (
            <View style={styles.totalGeneralBox}>
              <Text style={styles.totalGeneralLabel}>Total</Text>
              <Text style={styles.totalGeneralValue}>{formatCurrency(data.totalGeneral)}</Text>
            </View>
          )}

          {data.showTiers && data.tiers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Precios por cantidad</Text>
              <View style={styles.sectionAccentLine} />
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.colDesc}>Cantidad</Text>
                  <Text style={styles.colUnit}>Precio unitario</Text>
                </View>
                {data.tiers.map((tier, i) => (
                  <View style={styles.tableRow} key={i}>
                    <Text style={styles.colDesc}>
                      {tier.maxQty ? `${tier.minQty} - ${tier.maxQty} unidades` : `${tier.minQty}+ unidades`}
                    </Text>
                    <Text style={[styles.colUnit, styles.tierPrice]}>
                      {formatCurrency(tier.unitPrice)}
                    </Text>
                  </View>
                ))}
              </View>
              {data.ivaPct > 0 && (
                <Text style={[styles.subBrand, { color: MUTED, marginTop: 4 }]}>
                  Precios + IVA ({data.ivaPct}%)
                </Text>
              )}
            </View>
          )}

          {data.showNotes && data.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <View style={styles.sectionAccentLine} />
              <Text>{data.notes}</Text>
            </View>
          )}

          {data.paymentTerms && (
            <View style={styles.investmentBox}>
              <Text style={{ fontWeight: 700, color: NAVY, marginBottom: 3 }}>Fases de pago</Text>
              <Text>{data.paymentTerms}</Text>
            </View>
          )}

          <View style={styles.footer}>
            {data.leadTimeText && <Text>Tiempo de entrega: {data.leadTimeText}</Text>}
            {data.legalText && <Text style={{ marginTop: 3 }}>{data.legalText}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}

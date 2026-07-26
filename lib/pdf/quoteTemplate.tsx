import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#333333" },
  header: { marginBottom: 20, borderBottom: "2 solid #254b8a", paddingBottom: 12 },
  brand: { fontSize: 20, fontWeight: 700, color: "#254b8a" },
  subBrand: { fontSize: 9, color: "#666666", marginTop: 2 },
  quoteNumber: { fontSize: 11, marginTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#254b8a", marginBottom: 6 },
  row: { flexDirection: "row" },
  label: { color: "#666666", width: 90 },
  value: { flex: 1 },
  table: { display: "flex", width: "100%", marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #eeeeee", paddingVertical: 6 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1 solid #254b8a",
    paddingBottom: 6,
    fontWeight: 700,
    color: "#254b8a",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  tierPrice: { fontWeight: 700, color: "#254b8a" },
  footer: { marginTop: 24, paddingTop: 12, borderTop: "1 solid #eeeeee", fontSize: 9, color: "#666666" },
});

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface QuotePdfData {
  quoteNumber: string | null;
  clientName: string;
  clientContact: string | null;
  createdAt: string;
  validUntil: string | null;
  deliveryEstimateDate: string | null;
  notes: string | null;
  items: {
    description: string;
    quantity: number;
    basePrice: number;
  }[];
  tiers: {
    minQty: number;
    maxQty: number | null;
    unitPrice: number;
  }[];
  legalText: string;
  paymentTerms: string;
  leadTimeText: string;
}

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document title={`Presupuesto ${data.quoteNumber ?? ""}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>LUMO</Text>
          <Text style={styles.subBrand}>Diseño e Impresión 3D — Montevideo, Uruguay</Text>
          <Text style={styles.quoteNumber}>Presupuesto {data.quoteNumber ?? ""}</Text>
        </View>

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

        {data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Producto(s)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.colDesc}>Descripción</Text>
                <Text style={styles.colQty}>Cantidad</Text>
                <Text style={styles.colPrice}>Precio unitario</Text>
              </View>
              {data.items.map((item, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.colDesc}>{item.description}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{formatCurrency(item.basePrice)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.tiers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Precios por cantidad</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.colDesc}>Cantidad</Text>
                <Text style={styles.colPrice}>Precio unitario</Text>
              </View>
              {data.tiers.map((tier, i) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.colDesc}>
                    {tier.maxQty ? `${tier.minQty} - ${tier.maxQty} unidades` : `${tier.minQty}+ unidades`}
                  </Text>
                  <Text style={[styles.colPrice, styles.tierPrice]}>
                    {formatCurrency(tier.unitPrice)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {data.leadTimeText && <Text>Tiempo de entrega: {data.leadTimeText}</Text>}
          {data.paymentTerms && <Text>Forma de pago: {data.paymentTerms}</Text>}
          {data.legalText && <Text>{data.legalText}</Text>}
        </View>
      </Page>
    </Document>
  );
}

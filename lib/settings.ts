export const SETTINGS_FIELDS = [
  { key: "ute_tariff_kwh", label: "Tarifa eléctrica UTE ($/kWh)", type: "number" },
  { key: "default_margin_pct", label: "Margen de ganancia por defecto (%)", type: "number" },
  { key: "labor_hourly_rate", label: "Valor hora de mano de obra/diseño ($)", type: "number" },
  { key: "iva_pct", label: "IVA (%) — 0 si los precios ya lo incluyen o no aplica", type: "number" },
  { key: "currency_code", label: "Moneda (código ISO, ej. UYU)", type: "text" },
  { key: "company_rut", label: "RUT / identificación fiscal de LUMO", type: "text" },
  { key: "company_address", label: "Dirección de LUMO", type: "text" },
  { key: "company_phone", label: "Teléfono de contacto de LUMO", type: "text" },
  { key: "quote_lead_time_text", label: "Tiempo de entrega estimado", type: "text" },
  { key: "quote_payment_terms", label: "Forma de pago", type: "text" },
  { key: "quote_legal_text", label: "Condiciones / texto legal del presupuesto", type: "textarea" },
  {
    key: "email_reply_general",
    label: "Auto-respuesta — consulta de catálogo general",
    type: "textarea",
  },
  {
    key: "email_reply_empresa",
    label: "Auto-respuesta — consulta de proyecto para empresa",
    type: "textarea",
  },
] as const;

export type SettingsMap = Record<string, number | string>;

export function settingsRowsToMap(
  rows: { key: string; value: unknown }[]
): SettingsMap {
  const map: SettingsMap = {};
  for (const row of rows) {
    map[row.key] = row.value as number | string;
  }
  return map;
}

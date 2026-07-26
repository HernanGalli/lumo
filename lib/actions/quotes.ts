"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  calcCostoBreakdown,
  calcCostosExtras,
  calcCostoTotal,
  calcGananciaNeta,
  calcPrecioUnidad,
  calcPrecioVenta,
  generateTierTable,
  round2,
} from "@/lib/pricing";
import { settingsRowsToMap } from "@/lib/settings";
import { slugifyUpper } from "@/lib/slug";

const QUOTE_STATUSES = [
  "cotizado",
  "aceptado",
  "en_produccion",
  "entregado",
  "cancelado",
] as const;

// Código semántico: {PROJECT_LABEL|PROYECTO}-{CLIENTE}-{AÑO}-{secuencial del
// año, 2 dígitos}. Ej. LLAVEROS-EMPRESA-2026-01. Editable después desde
// updateQuoteDetails, esto solo arma la propuesta inicial.
async function nextQuoteNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientName: string,
  projectLabel?: string
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);

  const sequence = (count ?? 0) + 1;
  const prefix = slugifyUpper(projectLabel?.trim() || "PROYECTO") || "PROYECTO";
  const clientSlug = slugifyUpper(clientName) || "CLIENTE";
  return `${prefix}-${clientSlug}-${year}-${String(sequence).padStart(2, "0")}`;
}

const createQuoteSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  clientContact: z.string().trim().max(200).optional().or(z.literal("")),
  deliveryEstimateDate: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  marginPct: z.coerce.number().min(0).max(1000).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  projectLabel: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function createQuote(formData: FormData) {
  const supabase = await createClient();
  const parsed = createQuoteSchema.parse({
    clientName: formData.get("clientName"),
    clientContact: formData.get("clientContact") || "",
    deliveryEstimateDate: formData.get("deliveryEstimateDate") || "",
    validUntil: formData.get("validUntil") || "",
    marginPct: formData.get("marginPct") || undefined,
    notes: formData.get("notes") || "",
    projectLabel: formData.get("projectLabel") || "",
  });

  const quoteNumber = await nextQuoteNumber(supabase, parsed.clientName, parsed.projectLabel);

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      quote_number: quoteNumber,
      client_name: parsed.clientName,
      client_contact: parsed.clientContact || null,
      delivery_estimate_date: parsed.deliveryEstimateDate || null,
      valid_until: parsed.validUntil || null,
      margin_pct: parsed.marginPct ?? null,
      notes: parsed.notes || null,
      project_label: parsed.projectLabel || null,
      status: "cotizado",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo crear el presupuesto");

  revalidatePath("/admin/presupuestos");
  redirect(`/admin/presupuestos/${data.id}`);
}

const updateQuoteDetailsSchema = z.object({
  id: z.string().uuid(),
  quoteNumber: z
    .string()
    .trim()
    .min(3, "El código debe tener al menos 3 caracteres")
    .max(80)
    .regex(/^[A-Z0-9-]+$/, "Solo mayúsculas, números y guiones"),
  clientName: z.string().trim().min(1).max(200),
  clientContact: z.string().trim().max(200).optional().or(z.literal("")),
  deliveryEstimateDate: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  marginPct: z.coerce.number().min(0).max(1000).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  projectLabel: z.string().trim().max(60).optional().or(z.literal("")),
  projectSummary: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function updateQuoteDetails(formData: FormData) {
  const supabase = await createClient();
  const parsed = updateQuoteDetailsSchema.parse({
    id: formData.get("id"),
    quoteNumber: formData.get("quoteNumber"),
    clientName: formData.get("clientName"),
    clientContact: formData.get("clientContact") || "",
    deliveryEstimateDate: formData.get("deliveryEstimateDate") || "",
    validUntil: formData.get("validUntil") || "",
    marginPct: formData.get("marginPct") || undefined,
    notes: formData.get("notes") || "",
    projectLabel: formData.get("projectLabel") || "",
    projectSummary: formData.get("projectSummary") || "",
  });

  const { error } = await supabase
    .from("quotes")
    .update({
      quote_number: parsed.quoteNumber,
      client_name: parsed.clientName,
      client_contact: parsed.clientContact || null,
      delivery_estimate_date: parsed.deliveryEstimateDate || null,
      valid_until: parsed.validUntil || null,
      margin_pct: parsed.marginPct ?? null,
      notes: parsed.notes || null,
      project_label: parsed.projectLabel || null,
      project_summary: parsed.projectSummary || null,
    })
    .eq("id", parsed.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error(`Ya existe otro presupuesto con el código "${parsed.quoteNumber}"`);
    }
    throw new Error(error.message);
  }

  revalidatePath(`/admin/presupuestos/${parsed.id}`);
  revalidatePath("/admin/presupuestos");
}

const updateQuotePdfOptionsSchema = z.object({
  id: z.string().uuid(),
  pdfSummaryMode: z.enum(["resumen", "desglose"]),
  pdfSummaryLabel: z.string().trim().max(200).optional().or(z.literal("")),
  pdfShowTiers: z.coerce.boolean().optional(),
  pdfShowExtras: z.coerce.boolean().optional(),
  pdfShowProjectSummary: z.coerce.boolean().optional(),
  pdfShowNotes: z.coerce.boolean().optional(),
});

export async function updateQuotePdfOptions(formData: FormData) {
  const supabase = await createClient();
  const parsed = updateQuotePdfOptionsSchema.parse({
    id: formData.get("id"),
    pdfSummaryMode: formData.get("pdfSummaryMode"),
    pdfSummaryLabel: formData.get("pdfSummaryLabel") || "",
    pdfShowTiers: formData.get("pdfShowTiers") === "on",
    pdfShowExtras: formData.get("pdfShowExtras") === "on",
    pdfShowProjectSummary: formData.get("pdfShowProjectSummary") === "on",
    pdfShowNotes: formData.get("pdfShowNotes") === "on",
  });

  const { error } = await supabase
    .from("quotes")
    .update({
      pdf_summary_mode: parsed.pdfSummaryMode,
      pdf_summary_label: parsed.pdfSummaryLabel || null,
      pdf_show_tiers: parsed.pdfShowTiers ?? false,
      pdf_show_extras: parsed.pdfShowExtras ?? false,
      pdf_show_project_summary: parsed.pdfShowProjectSummary ?? false,
      pdf_show_notes: parsed.pdfShowNotes ?? false,
    })
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/presupuestos/${parsed.id}`);
}

const updateQuoteSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(QUOTE_STATUSES),
});

export async function updateQuoteStatus(formData: FormData) {
  const supabase = await createClient();
  const { id, status } = updateQuoteSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  if (status === "aceptado") {
    await deductStockIfNeeded(supabase, id);
  }

  revalidatePath(`/admin/presupuestos/${id}`);
  revalidatePath("/admin/presupuestos");
  revalidatePath("/admin/materiales");
}

// Descuenta el stock de materiales cuando un presupuesto se acepta, una sola
// vez por presupuesto (stock_deducted evita el doble descuento si se
// cancela y se vuelve a aceptar).
async function deductStockIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string
) {
  const { data: quote } = await supabase
    .from("quotes")
    .select("stock_deducted")
    .eq("id", quoteId)
    .single();
  if (!quote || quote.stock_deducted) return;

  const { data: items } = await supabase
    .from("quote_items")
    .select("material_id, peso_gramos, quantity")
    .eq("quote_id", quoteId)
    .not("material_id", "is", null);

  const gramsByMaterial = new Map<string, number>();
  for (const item of items ?? []) {
    if (!item.material_id) continue;
    const grams = (item.peso_gramos ?? 0) * item.quantity;
    gramsByMaterial.set(item.material_id, (gramsByMaterial.get(item.material_id) ?? 0) + grams);
  }

  for (const [materialId, grams] of gramsByMaterial) {
    if (grams <= 0) continue;
    const { data: material } = await supabase
      .from("materials")
      .select("quantity_on_hand")
      .eq("id", materialId)
      .single();
    if (!material) continue;
    await supabase
      .from("materials")
      .update({ quantity_on_hand: Math.max(0, material.quantity_on_hand - grams) })
      .eq("id", materialId);
  }

  await supabase.from("quotes").update({ stock_deducted: true }).eq("id", quoteId);
}

const addItemSchema = z.object({
  quoteId: z.string().uuid(),
  mode: z.enum(["calculado", "manual"]),
  itemType: z.enum(["producto", "extra"]).default("producto"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(100000).default(1),
  materialId: z.string().uuid().optional().or(z.literal("")),
  printerId: z.string().uuid().optional().or(z.literal("")),
  pesoGramos: z.coerce.number().min(0).max(1_000_000).optional(),
  tiempoHoras: z.coerce.number().min(0).max(10_000).optional(),
  tiempoDisenoHoras: z.coerce.number().min(0).max(10_000).optional(),
  margenPct: z.coerce.number().min(0).max(1000).optional(),
  basePriceManual: z.coerce.number().min(0).max(100_000_000).optional(),
  loteQuantity: z.coerce.number().int().min(1).max(1_000_000).optional(),
  supplyIds: z.array(z.string().uuid()).default([]),
  supplyQuantities: z.array(z.coerce.number().int().min(1).max(100_000)).default([]),
});

type QuoteItemFields = {
  quote_id: string;
  product_id: null;
  item_type: "producto" | "extra";
  description: string | null;
  peso_gramos: number | null;
  tiempo_horas: number | null;
  material_id: string | null;
  printer_id: string | null;
  tiempo_diseno_horas: number | null;
  costo_material: number;
  costo_energia: number;
  costo_mano_obra: number;
  costo_total: number;
  base_unit_price: number;
  quantity: number;
  lote_quantity: number | null;
};

interface InsumoUsadoConNombre {
  supplyId: string;
  name: string;
  unitCost: number;
  quantity: number;
}

async function loadInsumosUsados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parsed: z.infer<typeof addItemSchema>
): Promise<InsumoUsadoConNombre[]> {
  if (parsed.supplyIds.length === 0) return [];

  const { data: supplyRows } = await supabase
    .from("supplies")
    .select("id, name, unit_cost")
    .in("id", parsed.supplyIds);

  const byId = new Map((supplyRows ?? []).map((s) => [s.id, s]));
  return parsed.supplyIds
    .map((supplyId, i) => {
      const supply = byId.get(supplyId);
      if (!supply) return null;
      return {
        supplyId,
        name: supply.name,
        unitCost: supply.unit_cost,
        quantity: parsed.supplyQuantities[i] ?? 1,
      };
    })
    .filter((v): v is InsumoUsadoConNombre => v !== null);
}

async function buildQuoteItemFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parsed: z.infer<typeof addItemSchema>,
  insumosUsados: InsumoUsadoConNombre[]
): Promise<QuoteItemFields & { margenPctUsado: number; gananciaNeta: number }> {
  if (parsed.mode === "manual") {
    if (!parsed.basePriceManual) {
      throw new Error("Ingresá un precio manual");
    }
    return {
      quote_id: parsed.quoteId,
      product_id: null,
      item_type: parsed.itemType,
      description: parsed.description || "Ítem manual",
      peso_gramos: null,
      tiempo_horas: null,
      material_id: null,
      printer_id: null,
      tiempo_diseno_horas: null,
      costo_material: 0,
      costo_energia: 0,
      costo_mano_obra: 0,
      costo_total: 0,
      base_unit_price: round2(parsed.basePriceManual),
      quantity: parsed.quantity,
      lote_quantity: null,
      margenPctUsado: 0,
      gananciaNeta: 0,
    };
  }

  if (!parsed.materialId || !parsed.printerId) {
    throw new Error("Elegí material e impresora");
  }

  const [{ data: material }, { data: printer }, { data: settingsRows }] = await Promise.all([
    supabase.from("materials").select("cost_per_kg").eq("id", parsed.materialId).single(),
    supabase.from("printers").select("watts").eq("id", parsed.printerId).single(),
    supabase.from("settings").select("key, value"),
  ]);

  if (!material || !printer) throw new Error("Material o impresora no encontrados");

  const settings = settingsRowsToMap(settingsRows ?? []);
  const tarifaUteKwh = Number(settings.ute_tariff_kwh ?? 0);
  const defaultValorHora = Number(settings.labor_hourly_rate ?? 0);
  const defaultMargenPct = Number(settings.default_margin_pct ?? 0);
  const margenPctUsado = parsed.margenPct ?? defaultMargenPct;

  const breakdown = calcCostoBreakdown({
    pesoGramos: parsed.pesoGramos ?? 0,
    costoPorKg: material.cost_per_kg,
    tiempoHoras: parsed.tiempoHoras ?? 0,
    consumoWatts: printer.watts,
    tarifaUteKwh,
    tiempoDisenoHoras: parsed.tiempoDisenoHoras ?? 0,
    valorHora: defaultValorHora,
  });

  // Costos Extras (insumos) se suman al costo total además de material,
  // eléctrico y mano de obra de diseño — ver calculadora-costos-e-insumos.md.
  const costosExtras = calcCostosExtras(
    insumosUsados.map((i) => ({ unitCost: i.unitCost, quantity: i.quantity }))
  );
  const costoTotal =
    breakdown.costoManoObra + calcCostoTotal(breakdown.costoMaterial, breakdown.costoEnergia, costosExtras);

  const gananciaNeta = calcGananciaNeta(costoTotal, margenPctUsado);
  const precioVenta = calcPrecioVenta(costoTotal, gananciaNeta);
  // Si se cargó "cantidad de piezas del lote", el precio unitario es el
  // Precio Venta repartido entre esas piezas; si no, se mantiene el
  // comportamiento de siempre (precioVenta es el precio de este ítem tal
  // cual, sin dividir).
  const basePrice = parsed.loteQuantity ? calcPrecioUnidad(precioVenta, parsed.loteQuantity) : precioVenta;

  return {
    quote_id: parsed.quoteId,
    product_id: null,
    item_type: parsed.itemType,
    description: parsed.description || null,
    peso_gramos: parsed.pesoGramos ?? null,
    tiempo_horas: parsed.tiempoHoras ?? null,
    material_id: parsed.materialId,
    printer_id: parsed.printerId,
    tiempo_diseno_horas: parsed.tiempoDisenoHoras ?? null,
    costo_material: round2(breakdown.costoMaterial),
    costo_energia: round2(breakdown.costoEnergia),
    costo_mano_obra: round2(breakdown.costoManoObra),
    costo_total: round2(costoTotal),
    base_unit_price: round2(basePrice),
    quantity: parsed.quantity,
    lote_quantity: parsed.loteQuantity ?? null,
    margenPctUsado,
    gananciaNeta: round2(gananciaNeta),
  };
}

function parseItemForm(formData: FormData) {
  return addItemSchema.parse({
    quoteId: formData.get("quoteId"),
    mode: formData.get("mode"),
    itemType: formData.get("itemType") || "producto",
    description: formData.get("description") || "",
    quantity: formData.get("quantity") || 1,
    materialId: formData.get("materialId") || "",
    printerId: formData.get("printerId") || "",
    pesoGramos: formData.get("pesoGramos") || undefined,
    tiempoHoras: formData.get("tiempoHoras") || undefined,
    tiempoDisenoHoras: formData.get("tiempoDisenoHoras") || undefined,
    margenPct: formData.get("margenPct") || undefined,
    basePriceManual: formData.get("basePriceManual") || undefined,
    loteQuantity: formData.get("loteQuantity") || undefined,
    supplyIds: formData.getAll("supplyIds"),
    supplyQuantities: formData.getAll("supplyQuantities"),
  });
}

// Regenera calc_supplies_used y quote_item_costs para un ítem (delete +
// insert, mismo patrón que regenerateTiers con quote_price_tiers) — se
// llama después de insertar/actualizar el quote_item, porque necesita su id.
async function syncItemCostsAndSupplies(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
  fields: QuoteItemFields & { margenPctUsado: number; gananciaNeta: number },
  insumosUsados: InsumoUsadoConNombre[]
) {
  await supabase.from("calc_supplies_used").delete().eq("quote_item_id", itemId);
  if (insumosUsados.length > 0) {
    await supabase.from("calc_supplies_used").insert(
      insumosUsados.map((i) => ({
        quote_item_id: itemId,
        supply_id: i.supplyId,
        quantity: i.quantity,
        unit_cost_snapshot: i.unitCost,
      }))
    );
  }

  await supabase.from("quote_item_costs").delete().eq("quote_item_id", itemId);

  const rows: { concept: string; amount: number; show_in_pdf: boolean; sort_order: number }[] = [];
  let sortOrder = 0;

  if (fields.material_id) {
    rows.push({ concept: "Costo Material", amount: fields.costo_material, show_in_pdf: false, sort_order: sortOrder++ });
    rows.push({ concept: "Costo Eléctrico", amount: fields.costo_energia, show_in_pdf: false, sort_order: sortOrder++ });
    if (fields.costo_mano_obra > 0) {
      rows.push({
        concept: "Mano de obra (diseño)",
        amount: fields.costo_mano_obra,
        show_in_pdf: false,
        sort_order: sortOrder++,
      });
    }
    for (const insumo of insumosUsados) {
      rows.push({
        concept: insumo.name,
        amount: round2(insumo.unitCost * insumo.quantity),
        show_in_pdf: false,
        sort_order: sortOrder++,
      });
    }
    // Margen/Ganancia Neta: nunca show_in_pdf=true — ni siquiera se expone
    // el checkbox en la UI (ver presupuestos-desglose-y-pdf.md §2).
    rows.push({
      concept: `Margen (${fields.margenPctUsado}%)`,
      amount: fields.gananciaNeta,
      show_in_pdf: false,
      sort_order: sortOrder++,
    });
  }

  rows.push({ concept: "Precio Unidad", amount: fields.base_unit_price, show_in_pdf: true, sort_order: sortOrder++ });
  rows.push({
    concept: "Precio Total",
    amount: round2(fields.base_unit_price * fields.quantity),
    show_in_pdf: true,
    sort_order: sortOrder++,
  });

  await supabase.from("quote_item_costs").insert(rows.map((r) => ({ ...r, quote_item_id: itemId })));
}

export async function addQuoteItem(formData: FormData) {
  const supabase = await createClient();
  const parsed = parseItemForm(formData);
  const insumosUsados = await loadInsumosUsados(supabase, parsed);
  const fields = await buildQuoteItemFields(supabase, parsed, insumosUsados);
  const { margenPctUsado, gananciaNeta, ...item } = fields;
  void margenPctUsado;
  void gananciaNeta;

  const { data, error } = await supabase.from("quote_items").insert(item).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo crear el ítem");

  await syncItemCostsAndSupplies(supabase, data.id, fields, insumosUsados);

  revalidatePath(`/admin/presupuestos/${parsed.quoteId}`);
}

export async function updateQuoteItem(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = parseItemForm(formData);
  const insumosUsados = await loadInsumosUsados(supabase, parsed);
  const fields = await buildQuoteItemFields(supabase, parsed, insumosUsados);
  const { margenPctUsado, gananciaNeta, ...item } = fields;
  void margenPctUsado;
  void gananciaNeta;

  const { error } = await supabase.from("quote_items").update(item).eq("id", id);
  if (error) throw new Error(error.message);

  await syncItemCostsAndSupplies(supabase, id, fields, insumosUsados);

  revalidatePath(`/admin/presupuestos/${parsed.quoteId}`);
}

export async function deleteQuoteItem(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const quoteId = z.string().uuid().parse(formData.get("quoteId"));

  const { error } = await supabase.from("quote_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/presupuestos/${quoteId}`);
}

const regenerateTiersSchema = z.object({
  quoteId: z.string().uuid(),
  basePrice: z.coerce.number().min(0).max(100_000_000),
});

export async function regenerateTiers(formData: FormData) {
  const supabase = await createClient();
  const { quoteId, basePrice } = regenerateTiersSchema.parse({
    quoteId: formData.get("quoteId"),
    basePrice: formData.get("basePrice"),
  });

  const { data: rules } = await supabase
    .from("price_tier_rules")
    .select("min_qty, max_qty, adjustment_pct")
    .eq("is_default", true)
    .order("min_qty", { ascending: true });

  const table = generateTierTable(
    basePrice,
    (rules ?? []).map((r) => ({
      minQty: r.min_qty,
      maxQty: r.max_qty,
      adjustmentPct: r.adjustment_pct,
    }))
  );

  await supabase.from("quote_price_tiers").delete().eq("quote_id", quoteId);

  if (table.length > 0) {
    const { error } = await supabase.from("quote_price_tiers").insert(
      table.map((row, index) => ({
        id: randomUUID(),
        quote_id: quoteId,
        min_qty: row.minQty,
        max_qty: row.maxQty,
        unit_price: row.unitPrice,
        sort_order: index,
      }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/presupuestos/${quoteId}`);
}

const updateTierPriceSchema = z.object({
  id: z.string().uuid(),
  quoteId: z.string().uuid(),
  unitPrice: z.coerce.number().min(0).max(100_000_000),
});

export async function updateQuoteTierPrice(formData: FormData) {
  const supabase = await createClient();
  const { id, quoteId, unitPrice } = updateTierPriceSchema.parse({
    id: formData.get("id"),
    quoteId: formData.get("quoteId"),
    unitPrice: formData.get("unitPrice"),
  });

  const { error } = await supabase
    .from("quote_price_tiers")
    .update({ unit_price: round2(unitPrice) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/presupuestos/${quoteId}`);
}

const toggleCostVisibilitySchema = z.object({
  id: z.string().uuid(),
  quoteId: z.string().uuid(),
  showInPdf: z.coerce.boolean(),
});

// El Margen/Ganancia Neta nunca tiene opción de mostrarse en el PDF del
// cliente — ni el checkbox debe existir para esa fila (ver
// presupuestos-desglose-y-pdf.md §2). El chequeo acá es defensa en
// profundidad además de que la UI no renderiza el checkbox para esa fila.
export async function toggleQuoteItemCostVisibility(formData: FormData) {
  const supabase = await createClient();
  const { id, quoteId, showInPdf } = toggleCostVisibilitySchema.parse({
    id: formData.get("id"),
    quoteId: formData.get("quoteId"),
    showInPdf: formData.get("showInPdf") === "on",
  });

  const { data: row } = await supabase.from("quote_item_costs").select("concept").eq("id", id).single();
  if (!row) throw new Error("Fila de costo no encontrada");
  if (row.concept.startsWith("Margen")) {
    throw new Error("El Margen no se puede mostrar en el PDF del cliente");
  }

  const { error } = await supabase
    .from("quote_item_costs")
    .update({ show_in_pdf: showInPdf })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/presupuestos/${quoteId}`);
}

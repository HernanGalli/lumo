"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  calcCostoBreakdown,
  calcPrecioSugerido,
  generateTierTable,
  round2,
} from "@/lib/pricing";
import { settingsRowsToMap } from "@/lib/settings";

const QUOTE_STATUSES = [
  "cotizado",
  "aceptado",
  "en_produccion",
  "entregado",
  "cancelado",
] as const;

async function nextQuoteNumber(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);

  const sequence = (count ?? 0) + 1;
  return `LUMO-${year}-${String(sequence).padStart(4, "0")}`;
}

const createQuoteSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  clientContact: z.string().trim().max(200).optional().or(z.literal("")),
  deliveryEstimateDate: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  marginPct: z.coerce.number().min(0).max(1000).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
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
  });

  const quoteNumber = await nextQuoteNumber(supabase);

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
      status: "cotizado",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "No se pudo crear el presupuesto");

  revalidatePath("/admin/presupuestos");
  redirect(`/admin/presupuestos/${data.id}`);
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
  description: z.string().trim().max(500).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(100000).default(1),
  materialId: z.string().uuid().optional().or(z.literal("")),
  printerId: z.string().uuid().optional().or(z.literal("")),
  pesoGramos: z.coerce.number().min(0).max(1_000_000).optional(),
  tiempoHoras: z.coerce.number().min(0).max(10_000).optional(),
  tiempoDisenoHoras: z.coerce.number().min(0).max(10_000).optional(),
  margenPct: z.coerce.number().min(0).max(1000).optional(),
  basePriceManual: z.coerce.number().min(0).max(100_000_000).optional(),
});

type QuoteItemFields = {
  quote_id: string;
  product_id: null;
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
};

async function buildQuoteItemFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parsed: z.infer<typeof addItemSchema>
): Promise<QuoteItemFields> {
  if (parsed.mode === "manual") {
    if (!parsed.basePriceManual) {
      throw new Error("Ingresá un precio manual");
    }
    return {
      quote_id: parsed.quoteId,
      product_id: null,
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

  const breakdown = calcCostoBreakdown({
    pesoGramos: parsed.pesoGramos ?? 0,
    costoPorKg: material.cost_per_kg,
    tiempoHoras: parsed.tiempoHoras ?? 0,
    consumoWatts: printer.watts,
    tarifaUteKwh,
    tiempoDisenoHoras: parsed.tiempoDisenoHoras ?? 0,
    valorHora: defaultValorHora,
  });
  const basePrice = calcPrecioSugerido(breakdown.costoTotal, parsed.margenPct ?? defaultMargenPct);

  return {
    quote_id: parsed.quoteId,
    product_id: null,
    description: parsed.description || null,
    peso_gramos: parsed.pesoGramos ?? null,
    tiempo_horas: parsed.tiempoHoras ?? null,
    material_id: parsed.materialId,
    printer_id: parsed.printerId,
    tiempo_diseno_horas: parsed.tiempoDisenoHoras ?? null,
    costo_material: round2(breakdown.costoMaterial),
    costo_energia: round2(breakdown.costoEnergia),
    costo_mano_obra: round2(breakdown.costoManoObra),
    costo_total: round2(breakdown.costoTotal),
    base_unit_price: round2(basePrice),
    quantity: parsed.quantity,
  };
}

function parseItemForm(formData: FormData) {
  return addItemSchema.parse({
    quoteId: formData.get("quoteId"),
    mode: formData.get("mode"),
    description: formData.get("description") || "",
    quantity: formData.get("quantity") || 1,
    materialId: formData.get("materialId") || "",
    printerId: formData.get("printerId") || "",
    pesoGramos: formData.get("pesoGramos") || undefined,
    tiempoHoras: formData.get("tiempoHoras") || undefined,
    tiempoDisenoHoras: formData.get("tiempoDisenoHoras") || undefined,
    margenPct: formData.get("margenPct") || undefined,
    basePriceManual: formData.get("basePriceManual") || undefined,
  });
}

export async function addQuoteItem(formData: FormData) {
  const supabase = await createClient();
  const parsed = parseItemForm(formData);
  const item = await buildQuoteItemFields(supabase, parsed);

  const { error } = await supabase.from("quote_items").insert(item);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/presupuestos/${parsed.quoteId}`);
}

export async function updateQuoteItem(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = parseItemForm(formData);
  const item = await buildQuoteItemFields(supabase, parsed);

  const { error } = await supabase.from("quote_items").update(item).eq("id", id);
  if (error) throw new Error(error.message);

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

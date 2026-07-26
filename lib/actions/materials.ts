"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const materialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  unit: z.string().trim().min(1).max(20).default("kg"),
  costPerKg: z.coerce.number().min(0).max(10_000_000),
  quantityOnHand: z.coerce.number().min(0).max(100_000_000).default(0),
  supplier: z.string().trim().max(200).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().min(0).max(100_000_000).default(0),
});

function parseMaterialForm(formData: FormData) {
  const parsed = materialSchema.parse({
    name: formData.get("name"),
    unit: formData.get("unit") || "kg",
    costPerKg: formData.get("costPerKg"),
    quantityOnHand: formData.get("quantityOnHand") || 0,
    supplier: formData.get("supplier") || "",
    lowStockThreshold: formData.get("lowStockThreshold") || 0,
  });
  return {
    name: parsed.name,
    unit: parsed.unit,
    cost_per_kg: parsed.costPerKg,
    quantity_on_hand: parsed.quantityOnHand,
    supplier: parsed.supplier || null,
    low_stock_threshold: parsed.lowStockThreshold,
  };
}

export async function createMaterial(formData: FormData) {
  const supabase = await createClient();
  const material = parseMaterialForm(formData);

  const { error } = await supabase.from("materials").insert(material);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}

export async function updateMaterial(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const material = parseMaterialForm(formData);

  const { error } = await supabase.from("materials").update(material).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}

export async function deleteMaterial(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/materiales");
  revalidatePath("/admin/calculadora");
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Insumos: costo puro (argolla, cadena, mosquetón, packaging, mano de obra
// de ensamblado). A propósito NO llevan peso ni tocan stock_deducted de
// materials — ver presupuestos-desglose-y-pdf.md §1.
const supplySchema = z.object({
  name: z.string().trim().min(1).max(120),
  unitCost: z.coerce.number().min(0).max(10_000_000),
  active: z.coerce.boolean().default(true),
});

function parseSupplyForm(formData: FormData) {
  const parsed = supplySchema.parse({
    name: formData.get("name"),
    unitCost: formData.get("unitCost"),
    active: formData.get("active") === "on",
  });
  return {
    name: parsed.name,
    unit_cost: parsed.unitCost,
    active: parsed.active,
  };
}

export async function createSupply(formData: FormData) {
  const supabase = await createClient();
  const supply = parseSupplyForm(formData);

  const { error } = await supabase.from("supplies").insert(supply);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/insumos");
  revalidatePath("/admin/calculadora");
}

export async function updateSupply(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const supply = parseSupplyForm(formData);

  const { error } = await supabase.from("supplies").update(supply).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/insumos");
  revalidatePath("/admin/calculadora");
}

export async function deleteSupply(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("supplies").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/insumos");
  revalidatePath("/admin/calculadora");
}

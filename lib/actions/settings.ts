"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SETTINGS_FIELDS } from "@/lib/settings";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  const rows = SETTINGS_FIELDS.map((field) => {
    const raw = formData.get(field.key);
    if (field.type === "number") {
      const value = z.coerce.number().min(0).max(1_000_000).parse(raw ?? 0);
      return { key: field.key, value };
    }
    const value = z.string().max(4000).parse(raw ?? "");
    return { key: field.key, value };
  });

  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/calculadora");
}

const tierRuleSchema = z.object({
  minQty: z.coerce.number().int().min(1),
  maxQty: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  adjustmentPct: z.coerce.number().min(-100).max(1000),
});

function parseTierRuleForm(formData: FormData) {
  const parsed = tierRuleSchema.parse({
    minQty: formData.get("minQty"),
    maxQty: formData.get("maxQty") || undefined,
    adjustmentPct: formData.get("adjustmentPct"),
  });
  return {
    min_qty: parsed.minQty,
    max_qty: parsed.maxQty === "" || parsed.maxQty === undefined ? null : Number(parsed.maxQty),
    adjustment_pct: parsed.adjustmentPct,
  };
}

export async function createTierRule(formData: FormData) {
  const supabase = await createClient();
  const rule = parseTierRuleForm(formData);

  const { error } = await supabase
    .from("price_tier_rules")
    .insert({ ...rule, is_default: true, sort_order: rule.min_qty });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

export async function updateTierRule(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const rule = parseTierRuleForm(formData);

  const { error } = await supabase
    .from("price_tier_rules")
    .update({ ...rule, sort_order: rule.min_qty })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

export async function deleteTierRule(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("price_tier_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

"use server";

import { createClient } from "@/lib/supabase/server";

export interface PublicPriceTier {
  min_qty: number;
  max_qty: number | null;
  adjustment_pct: number;
}

// Lee la vista pública public_price_tiers (0007_multisegmento.sql) — solo
// expone tramo_desde/tramo_hasta/% de ajuste de price_tier_rules, nunca
// costos internos. Se usa en la landing de /llaveros para mostrar "cuantos
// más llaveros, menor precio por unidad" sin exponer los costos.
export async function getPublicPriceTiers(): Promise<PublicPriceTier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_price_tiers")
    .select("min_qty, max_qty, adjustment_pct");
  if (error) throw new Error(error.message);
  return data ?? [];
}

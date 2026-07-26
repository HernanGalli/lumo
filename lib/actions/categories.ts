"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const nameSchema = z.string().trim().min(1).max(60);
const kindSchema = z.enum(["catalogo", "segmento"]).default("catalogo");
const segmentSchema = z
  .enum(["empresa", "emprendimiento", "escuela", "evento_social", "grupo"])
  .optional()
  .or(z.literal(""));

function parseKindAndSegment(formData: FormData) {
  const kind = kindSchema.parse(formData.get("kind") || "catalogo");
  const segmentRaw = segmentSchema.parse(formData.get("segment") || "");
  return { kind, segment: kind === "segmento" && segmentRaw ? segmentRaw : null };
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = nameSchema.parse(formData.get("name"));
  const slug = slugify(name);
  const { kind, segment } = parseKindAndSegment(formData);

  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .insert({ name, slug, kind, segment, sort_order: (maxRow?.sort_order ?? -1) + 1 });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
}

export async function renameCategory(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const name = nameSchema.parse(formData.get("name"));
  const { kind, segment } = parseKindAndSegment(formData);

  const { error } = await supabase.from("categories").update({ name, kind, segment }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
}

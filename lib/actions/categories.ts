"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

const nameSchema = z.string().trim().min(1).max(60);

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = nameSchema.parse(formData.get("name"));
  const slug = slugify(name);

  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("categories")
    .insert({ name, slug, sort_order: (maxRow?.sort_order ?? -1) + 1 });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
}

export async function renameCategory(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const name = nameSchema.parse(formData.get("name"));

  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
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

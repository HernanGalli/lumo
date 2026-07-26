"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/storage";

export async function createClientLogo(formData: FormData) {
  const supabase = await createClient();
  const name = z.string().trim().max(120).optional().parse(formData.get("name") || undefined);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Elegí una imagen de logo");
  }
  const storagePath = await uploadToBucket(supabase, "client-logos", file, "image");

  const { data: maxRow } = await supabase
    .from("client_logos")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("client_logos").insert({
    name: name || null,
    storage_path: storagePath,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/logos-clientes");
  revalidatePath("/empresas");
}

export async function deleteClientLogo(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: logo } = await supabase
    .from("client_logos")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (logo) await deleteFromBucket(supabase, "client-logos", logo.storage_path);

  const { error } = await supabase.from("client_logos").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/logos-clientes");
  revalidatePath("/empresas");
}

export async function reorderClientLogos(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("client_logos").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidatePath("/admin/logos-clientes");
  revalidatePath("/empresas");
}

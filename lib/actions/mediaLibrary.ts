"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteFromBucket, getPublicUrl, uploadToBucket, type UploadKind } from "@/lib/supabase/storage";

export interface MediaAssetRow {
  id: string;
  mediaType: "image" | "video";
  fileName: string | null;
  tags: string[];
  url: string;
}

export async function listMediaAssets(): Promise<MediaAssetRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("id, media_type, storage_path, file_name, tags")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    mediaType: row.media_type as "image" | "video",
    fileName: row.file_name,
    tags: row.tags ?? [],
    url: getPublicUrl(supabase, "media-library", row.storage_path) ?? "",
  }));
}

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function uploadMediaAsset(formData: FormData): Promise<MediaAssetRow> {
  const supabase = await createClient();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Elegí una imagen o video para subir");
  }

  const mediaType: UploadKind = file.type.startsWith("video/") ? "video" : "image";
  const storagePath = await uploadToBucket(supabase, "media-library", file, mediaType);

  const tags = parseTags(formData.get("tags"));
  const fileName = z.string().trim().max(200).optional().parse(formData.get("fileName") || undefined);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      media_type: mediaType,
      storage_path: storagePath,
      file_name: fileName || file.name || null,
      tags,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo guardar en la biblioteca");

  revalidatePath("/admin/biblioteca");

  return {
    id: data.id,
    mediaType,
    fileName: fileName || file.name || null,
    tags,
    url: getPublicUrl(supabase, "media-library", storagePath) ?? "",
  };
}

// Wrapper sin valor de retorno para usar directo como `action` de un <form>
// (la versión que devuelve el asset creado es para el MediaPicker, que la
// llama directo como función, no como action de formulario).
export async function uploadMediaAssetForm(formData: FormData): Promise<void> {
  await uploadMediaAsset(formData);
}

export async function deleteMediaAsset(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (asset) await deleteFromBucket(supabase, "media-library", asset.storage_path);

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/biblioteca");
}

// Copia una pieza de la biblioteca al bucket propio de la entidad que la usa
// (banners/products/showcase), en vez de referenciarla directo — así borrar
// algo de la biblioteca nunca rompe un banner o una publicación que ya la usa.
export async function copyMediaAssetToBucket(
  mediaAssetId: string,
  targetBucket: string
): Promise<{ storagePath: string; mediaType: "image" | "video" }> {
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path, media_type, file_name")
    .eq("id", mediaAssetId)
    .single();
  if (!asset) throw new Error("La imagen/video elegido ya no existe en la biblioteca");

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("media-library")
    .download(asset.storage_path);
  if (downloadError || !fileBlob) {
    throw new Error(downloadError?.message ?? "No se pudo leer el archivo de la biblioteca");
  }

  const ext = asset.storage_path.split(".").pop() ?? "bin";
  const file = new File([fileBlob], asset.file_name ?? `biblioteca.${ext}`, {
    type: fileBlob.type,
  });

  const storagePath = await uploadToBucket(
    supabase,
    targetBucket,
    file,
    asset.media_type as UploadKind
  );

  return { storagePath, mediaType: asset.media_type as "image" | "video" };
}

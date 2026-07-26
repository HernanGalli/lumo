"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/storage";

const bannerSchema = z.object({
  mediaType: z.enum(["image", "video"]),
  pageTarget: z.enum(["home", "empresas"]).default("home"),
  headline: z.string().trim().max(200).optional().or(z.literal("")),
  bodyText: z.string().trim().max(600).optional().or(z.literal("")),
  ctaText: z.string().trim().max(120).optional().or(z.literal("")),
  ctaUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.coerce.boolean().optional(),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
});

function parseBannerForm(formData: FormData) {
  return bannerSchema.parse({
    mediaType: formData.get("mediaType"),
    pageTarget: formData.get("pageTarget") || "home",
    headline: formData.get("headline") || "",
    bodyText: formData.get("bodyText") || "",
    ctaText: formData.get("ctaText") || "",
    ctaUrl: formData.get("ctaUrl") || "",
    isActive: formData.get("isActive") === "on",
    startsAt: formData.get("startsAt") || "",
    endsAt: formData.get("endsAt") || "",
  });
}

export async function createBanner(formData: FormData) {
  const supabase = await createClient();
  const parsed = parseBannerForm(formData);

  const preUploadedPath = formData.get("preUploadedPath");
  let storagePath: string;
  if (typeof preUploadedPath === "string" && preUploadedPath) {
    storagePath = preUploadedPath;
  } else {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Subí una imagen o video para el banner, o elegí uno de la biblioteca");
    }
    storagePath = await uploadToBucket(supabase, "banners", file, parsed.mediaType);
  }

  let posterStoragePath: string | null = null;
  const posterFile = formData.get("posterFile");
  if (parsed.mediaType === "video" && posterFile instanceof File && posterFile.size > 0) {
    posterStoragePath = await uploadToBucket(supabase, "banners", posterFile, "image");
  }

  const { data: maxRow } = await supabase
    .from("banners")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("banners").insert({
    media_type: parsed.mediaType,
    page_target: parsed.pageTarget,
    headline: parsed.headline || null,
    body_text: parsed.bodyText || null,
    storage_path: storagePath,
    poster_storage_path: posterStoragePath,
    cta_text: parsed.ctaText || null,
    cta_url: parsed.ctaUrl || null,
    is_active: parsed.isActive ?? false,
    starts_at: parsed.startsAt || null,
    ends_at: parsed.endsAt || null,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}

export async function updateBanner(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = parseBannerForm(formData);

  const { data: current } = await supabase
    .from("banners")
    .select("storage_path, poster_storage_path")
    .eq("id", id)
    .single();

  let storagePath = current?.storage_path ?? null;
  const preUploadedPath = formData.get("preUploadedPath");
  const file = formData.get("file");
  if (typeof preUploadedPath === "string" && preUploadedPath) {
    storagePath = preUploadedPath;
    if (current?.storage_path) await deleteFromBucket(supabase, "banners", current.storage_path);
  } else if (file instanceof File && file.size > 0) {
    storagePath = await uploadToBucket(supabase, "banners", file, parsed.mediaType);
    if (current?.storage_path) await deleteFromBucket(supabase, "banners", current.storage_path);
  }

  let posterStoragePath = current?.poster_storage_path ?? null;
  const posterFile = formData.get("posterFile");
  if (parsed.mediaType === "video" && posterFile instanceof File && posterFile.size > 0) {
    posterStoragePath = await uploadToBucket(supabase, "banners", posterFile, "image");
    if (current?.poster_storage_path) {
      await deleteFromBucket(supabase, "banners", current.poster_storage_path);
    }
  }

  const { error } = await supabase
    .from("banners")
    .update({
      media_type: parsed.mediaType,
      page_target: parsed.pageTarget,
      headline: parsed.headline || null,
      body_text: parsed.bodyText || null,
      storage_path: storagePath,
      poster_storage_path: posterStoragePath,
      cta_text: parsed.ctaText || null,
      cta_url: parsed.ctaUrl || null,
      is_active: parsed.isActive ?? false,
      starts_at: parsed.startsAt || null,
      ends_at: parsed.endsAt || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
  revalidatePath(`/admin/banners/${id}`);
}

export async function deleteBanner(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: current } = await supabase
    .from("banners")
    .select("storage_path, poster_storage_path")
    .eq("id", id)
    .single();
  if (current) {
    await deleteFromBucket(supabase, "banners", current.storage_path);
    await deleteFromBucket(supabase, "banners", current.poster_storage_path);
  }

  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/banners");
}

export async function reorderBanners(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("banners").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidatePath("/admin/banners");
}

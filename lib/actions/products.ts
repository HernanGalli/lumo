"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/storage";

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priceOriginal: z.coerce.number().min(0).max(100_000_000),
  priceOffer: z.union([z.coerce.number().min(0).max(100_000_000), z.literal("")]).optional(),
  isOffer: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(["draft", "published"]),
});

function parseCategoryIds(formData: FormData): string[] {
  return formData.getAll("categoryIds").map(String).filter(Boolean);
}

async function syncProductCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  categoryIds: string[]
) {
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (categoryIds.length === 0) return;

  const { data: maxRows } = await supabase
    .from("product_categories")
    .select("category_id, sort_order")
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: false });

  const maxByCategory = new Map<string, number>();
  for (const row of maxRows ?? []) {
    if (!maxByCategory.has(row.category_id)) maxByCategory.set(row.category_id, row.sort_order);
  }

  const rows = categoryIds.map((categoryId) => ({
    product_id: productId,
    category_id: categoryId,
    sort_order: (maxByCategory.get(categoryId) ?? -1) + 1,
  }));

  const { error } = await supabase.from("product_categories").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    priceOriginal: formData.get("priceOriginal"),
    priceOffer: formData.get("priceOffer") || "",
    isOffer: formData.get("isOffer") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    status: formData.get("status"),
  });
  const categoryIds = parseCategoryIds(formData);

  const baseSlug = slugify(parsed.name);
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${++attempt}`;
  }

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      name: parsed.name,
      slug,
      description: parsed.description || null,
      price_original: parsed.priceOriginal,
      price_offer: parsed.priceOffer === "" ? null : parsed.priceOffer,
      is_offer: parsed.isOffer ?? false,
      is_featured: parsed.isFeatured ?? false,
      status: parsed.status,
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(error?.message ?? "No se pudo crear el producto");

  await syncProductCategories(supabase, inserted.id, categoryIds);

  revalidatePath("/admin/catalogo");
  redirect(`/admin/catalogo/${inserted.id}`);
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    priceOriginal: formData.get("priceOriginal"),
    priceOffer: formData.get("priceOffer") || "",
    isOffer: formData.get("isOffer") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    status: formData.get("status"),
  });
  const categoryIds = parseCategoryIds(formData);

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.name,
      description: parsed.description || null,
      price_original: parsed.priceOriginal,
      price_offer: parsed.priceOffer === "" ? null : parsed.priceOffer,
      is_offer: parsed.isOffer ?? false,
      is_featured: parsed.isFeatured ?? false,
      status: parsed.status,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncProductCategories(supabase, id, categoryIds);

  revalidatePath("/admin/catalogo");
  revalidatePath(`/admin/catalogo/${id}`);
}

export async function deleteProduct(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  for (const image of images ?? []) {
    await deleteFromBucket(supabase, "products", image.storage_path);
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/catalogo");
}

export async function reorderProductsInCategory(categoryId: string, orderedProductIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedProductIds.map((productId, index) =>
      supabase
        .from("product_categories")
        .update({ sort_order: index })
        .eq("product_id", productId)
        .eq("category_id", categoryId)
    )
  );
  revalidatePath("/admin/catalogo");
}

export async function addProductImage(formData: FormData) {
  const supabase = await createClient();
  const productId = z.string().uuid().parse(formData.get("productId"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Elegí una imagen para subir");
  }

  const storagePath = await uploadToBucket(supabase, "products", file, "image");

  const { data: maxRow } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/catalogo/${productId}`);
}

export async function deleteProductImage(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const productId = z.string().uuid().parse(formData.get("productId"));

  const { data: image } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (image) await deleteFromBucket(supabase, "products", image.storage_path);

  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/catalogo/${productId}`);
}

export async function reorderProductImages(productId: string, orderedImageIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedImageIds.map((imageId, index) =>
      supabase.from("product_images").update({ sort_order: index }).eq("id", imageId)
    )
  );
  revalidatePath(`/admin/catalogo/${productId}`);
}

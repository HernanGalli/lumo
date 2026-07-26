"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/storage";

const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  categoryId: z.union([z.string().uuid(), z.literal("")]).optional(),
  status: z.enum(["draft", "published"]),
  showOnHome: z.coerce.boolean().optional(),
});

export async function createShowcasePost(formData: FormData) {
  const supabase = await createClient();
  const parsed = postSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    categoryId: formData.get("categoryId") || "",
    status: formData.get("status"),
    showOnHome: formData.get("showOnHome") === "on",
  });

  const baseSlug = slugify(parsed.title);
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("showcase_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${++attempt}`;
  }

  const { data: maxRow } = await supabase
    .from("showcase_posts")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from("showcase_posts")
    .insert({
      title: parsed.title,
      slug,
      description: parsed.description || null,
      category_id: parsed.categoryId || null,
      status: parsed.status,
      show_on_home: parsed.showOnHome ?? false,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(error?.message ?? "No se pudo crear la publicación");

  revalidatePath("/admin/showcase");
  redirect(`/admin/showcase/${inserted.id}`);
}

export async function updateShowcasePost(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const parsed = postSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    categoryId: formData.get("categoryId") || "",
    status: formData.get("status"),
    showOnHome: formData.get("showOnHome") === "on",
  });

  const { error } = await supabase
    .from("showcase_posts")
    .update({
      title: parsed.title,
      description: parsed.description || null,
      category_id: parsed.categoryId || null,
      status: parsed.status,
      show_on_home: parsed.showOnHome ?? false,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/showcase");
  revalidatePath(`/admin/showcase/${id}`);
}

export async function deleteShowcasePost(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: images } = await supabase
    .from("showcase_post_images")
    .select("storage_path")
    .eq("showcase_post_id", id);
  for (const image of images ?? []) {
    await deleteFromBucket(supabase, "showcase", image.storage_path);
  }

  const { error } = await supabase.from("showcase_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/showcase");
}

export async function reorderShowcasePosts(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("showcase_posts").update({ sort_order: index }).eq("id", id)
    )
  );
  revalidatePath("/admin/showcase");
}

export async function addShowcaseImage(formData: FormData) {
  const supabase = await createClient();
  const postId = z.string().uuid().parse(formData.get("postId"));

  const preUploadedPath = formData.get("preUploadedPath");
  let storagePath: string;
  if (typeof preUploadedPath === "string" && preUploadedPath) {
    storagePath = preUploadedPath;
  } else {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Elegí una imagen para subir");
    }
    storagePath = await uploadToBucket(supabase, "showcase", file, "image", {
      skipFilter: formData.get("skipFilter") === "on",
    });
  }

  const { data: maxRow } = await supabase
    .from("showcase_post_images")
    .select("sort_order")
    .eq("showcase_post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("showcase_post_images").insert({
    showcase_post_id: postId,
    storage_path: storagePath,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/showcase/${postId}`);
}

export async function deleteShowcaseImage(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const postId = z.string().uuid().parse(formData.get("postId"));

  const { data: image } = await supabase
    .from("showcase_post_images")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (image) await deleteFromBucket(supabase, "showcase", image.storage_path);

  const { error } = await supabase.from("showcase_post_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/showcase/${postId}`);
}

export async function reorderShowcaseImages(postId: string, orderedImageIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedImageIds.map((imageId, index) =>
      supabase.from("showcase_post_images").update({ sort_order: index }).eq("id", imageId)
    )
  );
  revalidatePath(`/admin/showcase/${postId}`);
}

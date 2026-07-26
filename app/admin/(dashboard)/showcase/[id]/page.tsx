import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  addShowcaseImage,
  deleteShowcaseImage,
  deleteShowcasePost,
  reorderShowcaseImages,
  updateShowcasePost,
} from "@/lib/actions/showcase";
import { ShowcaseForm } from "@/components/admin/ShowcaseForm";
import { GalleryManager } from "@/components/admin/GalleryManager";

export default async function EditarShowcasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("showcase_posts").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
    supabase
      .from("showcase_post_images")
      .select("id, storage_path")
      .eq("showcase_post_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!post) notFound();

  const imageRows = (images ?? []).map((img) => ({
    id: img.id,
    url: getPublicUrl(supabase, "showcase", img.storage_path) ?? "",
  }));

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <form action={deleteShowcasePost}>
          <input type="hidden" name="id" value={post.id} />
          <button type="submit" className="text-sm text-rojo hover:underline">
            Borrar publicación
          </button>
        </form>
      </div>

      <ShowcaseForm
        action={updateShowcasePost}
        categories={categories ?? []}
        post={post}
        submitLabel="Guardar cambios"
      />

      <GalleryManager
        entityId={post.id}
        entityFieldName="postId"
        bucket="showcase"
        images={imageRows}
        addAction={addShowcaseImage}
        deleteAction={deleteShowcaseImage}
        reorderAction={reorderShowcaseImages}
      />
    </div>
  );
}

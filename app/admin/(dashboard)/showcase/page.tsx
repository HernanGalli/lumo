import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ShowcaseReorderList } from "@/components/admin/ShowcaseReorderList";

export default async function ShowcasePage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("showcase_posts")
      .select("id, title, status, category_id")
      .order("sort_order", { ascending: true }),
    supabase.from("categories").select("id, name"),
  ]);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: images } = postIds.length
    ? await supabase
        .from("showcase_post_images")
        .select("showcase_post_id, storage_path, sort_order")
        .in("showcase_post_id", postIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const firstImageByPost = new Map<string, string>();
  for (const img of images ?? []) {
    if (!firstImageByPost.has(img.showcase_post_id)) {
      firstImageByPost.set(img.showcase_post_id, img.storage_path);
    }
  }

  const rows = (posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    categoryName: p.category_id ? categoryNameById.get(p.category_id) ?? null : null,
    thumbUrl: getPublicUrl(supabase, "showcase", firstImageByPost.get(p.id) ?? null),
  }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Showcase</h1>
          <p className="text-foreground-muted">
            Trabajos a medida sin precio visible — portfolio para clientes corporativos.
          </p>
        </div>
        <Link
          href="/admin/showcase/nuevo"
          className="rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Nueva publicación
        </Link>
      </div>

      {rows.length > 0 ? (
        <ShowcaseReorderList posts={rows} />
      ) : (
        <p className="text-sm text-foreground-muted">Todavía no hay publicaciones.</p>
      )}
    </div>
  );
}

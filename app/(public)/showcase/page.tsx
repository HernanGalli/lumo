import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ShowcaseCard } from "@/components/public/ShowcaseCard";
import { FadeInSection } from "@/components/public/FadeInSection";

export default async function ShowcaseListPage() {
  const supabase = await createClient();

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from("showcase_posts")
      .select("id, slug, title, description, category_id")
      .eq("status", "published")
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
    slug: p.slug,
    title: p.title,
    description: p.description,
    categoryLabel: p.category_id ? categoryNameById.get(p.category_id) ?? null : null,
    imageUrl: getPublicUrl(supabase, "showcase", firstImageByPost.get(p.id) ?? null),
  }));

  return (
    <section className="catalogo contenedor">
      <h1 className="titulo-seccion">A Medida / Empresas</h1>
      <FadeInSection>
        <div className="showcase-grid">
          {rows.map((post) => (
            <ShowcaseCard key={post.slug} post={post} />
          ))}
        </div>
        {rows.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--foreground-muted)" }}>
            Todavía no hay publicaciones cargadas.
          </p>
        )}
      </FadeInSection>
    </section>
  );
}

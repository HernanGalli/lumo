import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ConsultarButton } from "@/components/public/ConsultarButton";

export default async function ShowcaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("showcase_posts")
    .select("id, title, description, category_id, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) notFound();

  const [{ data: images }, { data: category }] = await Promise.all([
    supabase
      .from("showcase_post_images")
      .select("storage_path")
      .eq("showcase_post_id", post.id)
      .order("sort_order", { ascending: true }),
    post.category_id
      ? supabase.from("categories").select("name").eq("id", post.category_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const imageUrls = (images ?? [])
    .map((img) => getPublicUrl(supabase, "showcase", img.storage_path))
    .filter((url): url is string => Boolean(url));

  return (
    <section className="catalogo contenedor" style={{ maxWidth: 800 }}>
      {category && <p className="producto-card__categoria">{category.name}</p>}
      <h1 className="titulo-seccion" style={{ marginBottom: "20px" }}>
        {post.title}
      </h1>

      <div className="showcase-grid" style={{ marginBottom: "40px" }}>
        {imageUrls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={post.title}
            className="foto-armonia"
            style={{ width: "100%", borderRadius: 8, aspectRatio: "1 / 1", objectFit: "cover" }}
          />
        ))}
      </div>

      {post.description && (
        <p style={{ fontSize: "18px", marginBottom: "30px" }}>{post.description}</p>
      )}

      <ConsultarButton label="Consultar por este trabajo" />
    </section>
  );
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { isBannerActiveNow } from "@/lib/banners";
import type { SegmentConfig } from "@/lib/segments";
import type { CategoriaConPosts } from "@/components/public/llaveros/CatalogoPorSegmento";
import type { ClientLogo } from "@/components/public/empresas/ClientLogosCarousel";
import type { EmpresasBanner } from "@/components/public/empresas/PromoBanner";

export interface SegmentContentRow {
  segment: string;
  hero_title: string;
  hero_subtitle: string;
  pilar_1_titulo: string;
  pilar_1_texto: string;
  pilar_2_titulo: string;
  pilar_2_texto: string;
  pilar_3_titulo: string;
  pilar_3_texto: string;
  pilar_4_titulo: string;
  pilar_4_texto: string;
  whatsapp_message: string;
}

export interface SegmentPageData {
  content: SegmentContentRow | null;
  grupos: CategoriaConPosts[];
  logos: ClientLogo[];
  promoBanner: EmpresasBanner | null;
}

// El carrusel de logos y el banner promocional son, hoy, exclusivos de
// Empresas (client_logos no distingue segmento todavía, y banners.page_target
// solo admite 'home'/'empresas' — ver 0004_fase4.sql). Se muestran solo ahí;
// generalizarlos a los otros 4 segmentos queda fuera del alcance de los
// documentos de esta fase.
export async function getSegmentPageData(segment: SegmentConfig): Promise<SegmentPageData> {
  const supabase = await createClient();
  const isEmpresas = segment.slug === "empresas";

  const [{ data: contentRow }, { data: categories }, { data: logoRows }, { data: bannerRows }] =
    await Promise.all([
      supabase.from("segment_content").select("*").eq("segment", segment.dbValue).maybeSingle(),
      supabase
        .from("categories")
        .select("id, slug, name")
        .eq("kind", "segmento")
        .eq("segment", segment.dbValue)
        .order("sort_order", { ascending: true }),
      isEmpresas
        ? supabase.from("client_logos").select("id, name, storage_path").order("sort_order", { ascending: true })
        : Promise.resolve({ data: [] as { id: string; name: string | null; storage_path: string }[] }),
      isEmpresas
        ? supabase
            .from("banners")
            .select("id, headline, body_text, cta_text, cta_url, is_active, starts_at, ends_at")
            .eq("is_active", true)
            .eq("page_target", "empresas")
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const categoryIds = (categories ?? []).map((c) => c.id as string);
  const { data: posts } = categoryIds.length
    ? await supabase
        .from("showcase_posts")
        .select("id, slug, title, description, category_id")
        .in("category_id", categoryIds)
        .eq("status", "published")
        .order("sort_order", { ascending: true })
    : { data: [] };

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

  const grupos: CategoriaConPosts[] = (categories ?? []).map((cat) => ({
    slug: cat.slug,
    label: cat.name,
    posts: (posts ?? [])
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        categoryLabel: cat.name,
        imageUrl: getPublicUrl(supabase, "showcase", firstImageByPost.get(p.id) ?? null),
      })),
  }));

  const logos: ClientLogo[] = (logoRows ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    url: getPublicUrl(supabase, "client-logos", l.storage_path),
  }));

  const activeBanner = (bannerRows ?? []).filter(isBannerActiveNow)[0] ?? null;
  const promoBanner: EmpresasBanner | null = activeBanner
    ? {
        id: activeBanner.id,
        headline: activeBanner.headline,
        bodyText: activeBanner.body_text,
        ctaText: activeBanner.cta_text,
        ctaUrl: activeBanner.cta_url,
      }
    : null;

  return { content: contentRow ?? null, grupos, logos, promoBanner };
}

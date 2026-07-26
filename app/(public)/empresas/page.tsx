import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { isBannerActiveNow } from "@/lib/banners";
import { HeroCorporativo } from "@/components/public/empresas/HeroCorporativo";
import { PromoBanner } from "@/components/public/empresas/PromoBanner";
import { PilaresGrid } from "@/components/public/empresas/PilaresGrid";
import { SolucionesCatalogo, type SolucionGrupo } from "@/components/public/empresas/SolucionesCatalogo";
import { ClientLogosCarousel } from "@/components/public/empresas/ClientLogosCarousel";
import { ProcesoSteps } from "@/components/public/empresas/ProcesoSteps";
import { CorporateLeadForm } from "@/components/public/CorporateLeadForm";
import { FadeInSection } from "@/components/public/FadeInSection";

const B2B_CATEGORY_SLUGS = [
  { slug: "merchandising-onboarding", label: "Merchandising & Onboarding" },
  { slug: "presencia-de-marca", label: "Presencia de Marca" },
  { slug: "premios-reconocimientos", label: "Premios & Reconocimientos" },
  { slug: "prototipado-tecnico", label: "Prototipado Técnico" },
];

export const metadata = {
  title: "LUMO Empresas — Merchandising y proyectos a medida",
  description:
    "Merchandising, regalos corporativos y señalética 3D personalizada, fabricados con materiales sustentables.",
};

export default async function EmpresasPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: logoRows }, { data: bannerRows }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug")
      .in("slug", B2B_CATEGORY_SLUGS.map((c) => c.slug)),
    supabase.from("client_logos").select("id, name, storage_path").order("sort_order", { ascending: true }),
    supabase
      .from("banners")
      .select("id, headline, body_text, cta_text, cta_url, is_active, starts_at, ends_at")
      .eq("is_active", true)
      .eq("page_target", "empresas")
      .order("sort_order", { ascending: true }),
  ]);

  const activeBanner = (bannerRows ?? []).filter(isBannerActiveNow)[0] ?? null;
  const promoBanner = activeBanner
    ? {
        id: activeBanner.id,
        headline: activeBanner.headline,
        bodyText: activeBanner.body_text,
        ctaText: activeBanner.cta_text,
        ctaUrl: activeBanner.cta_url,
      }
    : null;

  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id as string]));
  const categoryIds = [...categoryIdBySlug.values()];

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

  const grupos: SolucionGrupo[] = B2B_CATEGORY_SLUGS.map(({ slug, label }) => {
    const categoryId = categoryIdBySlug.get(slug);
    const grupoPosts = (posts ?? [])
      .filter((p) => p.category_id === categoryId)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        categoryLabel: label,
        imageUrl: getPublicUrl(supabase, "showcase", firstImageByPost.get(p.id) ?? null),
      }));
    return { slug, label, posts: grupoPosts };
  });

  const logos = (logoRows ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    url: getPublicUrl(supabase, "client-logos", l.storage_path),
  }));

  return (
    <>
      <PromoBanner banner={promoBanner} />
      <HeroCorporativo />
      <FadeInSection>
        <PilaresGrid />
      </FadeInSection>
      <FadeInSection>
        <SolucionesCatalogo grupos={grupos} />
      </FadeInSection>
      <FadeInSection>
        <ClientLogosCarousel logos={logos} />
      </FadeInSection>
      <FadeInSection>
        <ProcesoSteps />
      </FadeInSection>
      <FadeInSection>
        <section id="cotizar" className="contenedor py-16 md:py-20 max-w-2xl mx-auto">
          <h2 className="titulo-seccion">Solicitá tu Cotización Corporativa</h2>
          <CorporateLeadForm />
        </section>
      </FadeInSection>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { isBannerActiveNow } from "@/lib/banners";
import { HeroSlider, type HeroBanner } from "@/components/public/HeroSlider";
import { ProcesoTresPasos } from "@/components/public/ProcesoTresPasos";
import { NichoSelector } from "@/components/public/NichoSelector";
import { WorkWall, type WorkWallItem } from "@/components/public/WorkWall";
import { AMedidaSection } from "@/components/public/AMedidaSection";
import { FadeInSection } from "@/components/public/FadeInSection";

const WORK_WALL_LIMIT = 8;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: bannerRows }, { data: showcasePosts }] = await Promise.all([
    supabase
      .from("banners")
      .select("id, media_type, storage_path, poster_storage_path, headline, body_text, is_active, starts_at, ends_at")
      .eq("is_active", true)
      .eq("page_target", "home")
      .order("sort_order", { ascending: true }),
    supabase
      .from("showcase_posts")
      .select("id, title")
      .eq("status", "published")
      .eq("show_on_home", true)
      .order("sort_order", { ascending: true })
      .limit(WORK_WALL_LIMIT),
  ]);

  const banners: HeroBanner[] = (bannerRows ?? [])
    .filter(isBannerActiveNow)
    .map((b) => ({
      id: b.id,
      mediaType: b.media_type as "video" | "image",
      url: getPublicUrl(supabase, "banners", b.storage_path) ?? "",
      posterUrl: getPublicUrl(supabase, "banners", b.poster_storage_path),
      headline: b.headline,
      bodyText: b.body_text,
    }));

  const postIds = (showcasePosts ?? []).map((p) => p.id);
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

  const workWallItems: WorkWallItem[] = (showcasePosts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    imageUrl: getPublicUrl(supabase, "showcase", firstImageByPost.get(p.id) ?? null),
  }));

  return (
    <>
      <HeroSlider banners={banners} />
      <FadeInSection>
        <ProcesoTresPasos />
      </FadeInSection>
      <FadeInSection>
        <NichoSelector />
      </FadeInSection>
      <FadeInSection>
        <WorkWall items={workWallItems} />
      </FadeInSection>
      <FadeInSection>
        <AMedidaSection />
      </FadeInSection>
    </>
  );
}

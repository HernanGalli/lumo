import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { BannerReorderList } from "@/components/admin/BannerReorderList";

export default async function BannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase
    .from("banners")
    .select("id, media_type, page_target, storage_path, poster_storage_path, cta_text, is_active")
    .order("sort_order", { ascending: true });

  const rows = (banners ?? []).map((b) => ({
    id: b.id,
    mediaType: b.media_type,
    pageTarget: b.page_target as "home" | "empresas",
    thumbUrl: getPublicUrl(
      supabase,
      "banners",
      b.media_type === "video" ? b.poster_storage_path : b.storage_path
    ),
    ctaText: b.cta_text,
    isActive: b.is_active,
  }));

  const homeRows = rows.filter((b) => b.pageTarget === "home");
  const empresasRows = rows.filter((b) => b.pageTarget === "empresas");

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Banners</h1>
          <p className="text-foreground-muted">Arrastrá para cambiar el orden de cada carrusel.</p>
        </div>
        <Link
          href="/admin/banners/nuevo"
          className="rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Nuevo banner
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="font-medium mb-3">Home (carrusel principal)</h2>
        {homeRows.length > 0 ? (
          <BannerReorderList banners={homeRows} />
        ) : (
          <p className="text-sm text-foreground-muted">Todavía no hay banners del home.</p>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-3">/empresas (landing B2B)</h2>
        {empresasRows.length > 0 ? (
          <BannerReorderList banners={empresasRows} />
        ) : (
          <p className="text-sm text-foreground-muted">Todavía no hay banners de /empresas.</p>
        )}
      </section>
    </div>
  );
}

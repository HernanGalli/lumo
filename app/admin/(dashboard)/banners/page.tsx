import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { BannerReorderList } from "@/components/admin/BannerReorderList";

export default async function BannersPage() {
  const supabase = await createClient();
  const { data: banners } = await supabase
    .from("banners")
    .select("id, media_type, storage_path, poster_storage_path, cta_text, is_active")
    .order("sort_order", { ascending: true });

  const rows = (banners ?? []).map((b) => ({
    id: b.id,
    mediaType: b.media_type,
    thumbUrl: getPublicUrl(
      supabase,
      "banners",
      b.media_type === "video" ? b.poster_storage_path : b.storage_path
    ),
    ctaText: b.cta_text,
    isActive: b.is_active,
  }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Banners del home</h1>
          <p className="text-foreground-muted">Arrastrá para cambiar el orden del carrusel.</p>
        </div>
        <Link
          href="/admin/banners/nuevo"
          className="rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Nuevo banner
        </Link>
      </div>

      {rows.length > 0 ? (
        <BannerReorderList banners={rows} />
      ) : (
        <p className="text-sm text-foreground-muted">Todavía no hay banners cargados.</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { DragReorderList } from "@/components/admin/DragReorderList";
import { reorderBanners } from "@/lib/actions/banners";

interface BannerRow {
  id: string;
  mediaType: string;
  thumbUrl: string | null;
  ctaText: string | null;
  isActive: boolean;
}

export function BannerReorderList({ banners }: { banners: BannerRow[] }) {
  return (
    <DragReorderList
      items={banners}
      getId={(b) => b.id}
      onReorder={reorderBanners}
      renderItem={(banner) => (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 min-w-0">
            {banner.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner.thumbUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
            ) : (
              <div className="h-10 w-16 shrink-0 rounded bg-background-secundario" />
            )}
            <div className="min-w-0">
              <p className="truncate">
                {banner.ctaText || "(sin texto)"}{" "}
                <span className="text-xs text-foreground-muted">
                  {banner.mediaType === "video" ? "video" : "imagen"}
                </span>
                {!banner.isActive && (
                  <span className="ml-2 rounded-full bg-background-secundario px-2 py-0.5 text-xs text-foreground-muted">
                    Inactivo
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link href={`/admin/banners/${banner.id}`} className="shrink-0 text-azul hover:underline">
            Editar
          </Link>
        </div>
      )}
    />
  );
}

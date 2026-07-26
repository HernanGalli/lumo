export interface EmpresasBanner {
  id: string;
  headline: string | null;
  bodyText: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

export function PromoBanner({ banner }: { banner: EmpresasBanner | null }) {
  if (!banner || (!banner.headline && !banner.bodyText)) return null;

  return (
    <section className="bg-amarillo text-[#1a1a1a]">
      <div className="contenedor py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {banner.headline && <p className="font-semibold">{banner.headline}</p>}
          {banner.bodyText && <p className="text-sm">{banner.bodyText}</p>}
        </div>
        {banner.ctaUrl && banner.ctaText && (
          <a
            href={banner.ctaUrl}
            className="shrink-0 rounded-md bg-[#1a1a1a] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {banner.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

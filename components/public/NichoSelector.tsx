"use client";

import Link from "next/link";
import { trackClick } from "@/lib/actions/analytics";
import { SEGMENT_SLUGS, SEGMENTS } from "@/lib/segments";

// "¿Para quién es esto?" — ver requerimientos-lumo-llaveros-v2.md §6.2. Cada
// tarjeta linkea a su propia página de segmento (/llaveros/[segmento]) en
// vez de ir todas al mismo formulario, para reforzar que el sitio sirve
// para cualquier ocasión (mejor SEO por segmento, ver
// backoffice-logica-multisegmento.md §0).
export function NichoSelector() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">No importa la ocasión, hay un llavero para eso</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SEGMENT_SLUGS.map((slug) => {
          const segment = SEGMENTS[slug];
          return (
            <Link
              key={slug}
              href={`/llaveros/${slug}`}
              onClick={() => trackClick("nicho_selector", "/", slug)}
              className="group rounded-lg border border-border bg-surface p-6 transition-colors hover:border-azul"
            >
              <span className="text-2xl">{segment.emoji}</span>
              <h3 className="font-medium mt-3 mb-2 text-lg group-hover:text-azul transition-colors">
                {segment.navLabel}
              </h3>
              <p className="text-sm text-foreground-muted mb-4">{segment.navBlurb}</p>
              <span className="text-sm font-medium text-cian">Empezar →</span>
            </Link>
          );
        })}
      </div>
      <p className="text-center text-sm text-foreground-muted mt-8">
        ¿Buscás algo ya hecho?{" "}
        <a href="/catalogo" className="text-azul hover:underline">
          Mirá el catálogo
        </a>
        .
      </p>
    </section>
  );
}

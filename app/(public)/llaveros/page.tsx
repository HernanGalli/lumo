import Link from "next/link";
import type { Metadata } from "next";
import { SEGMENT_SLUGS, SEGMENTS } from "@/lib/segments";

export const metadata: Metadata = {
  title: "Llaveros para tu Evento — LUMO",
  description:
    "Llaveros personalizados para empresas, emprendimientos, escuelas y eventos. Elegí tu segmento y contanos tu idea.",
};

export default function LlaverosIndexPage() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h1 className="titulo-seccion">No importa la ocasión, hay un llavero para eso</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {SEGMENT_SLUGS.map((slug) => {
          const segment = SEGMENTS[slug];
          return (
            <Link
              key={slug}
              href={`/llaveros/${slug}`}
              className="group rounded-lg border border-border bg-surface p-6 transition-colors hover:border-azul"
            >
              <span className="text-3xl">{segment.emoji}</span>
              <h2 className="font-medium mt-3 mb-2 text-lg group-hover:text-azul transition-colors">
                {segment.navLabel}
              </h2>
              <p className="text-sm text-foreground-muted mb-4">{segment.navBlurb}</p>
              <span className="text-sm font-medium text-cian">Ver más →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

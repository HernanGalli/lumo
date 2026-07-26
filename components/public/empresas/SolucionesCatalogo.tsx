import { ShowcaseCard, type PublicShowcasePost } from "@/components/public/ShowcaseCard";

export interface SolucionGrupo {
  slug: string;
  label: string;
  posts: PublicShowcasePost[];
}

export function SolucionesCatalogo({ grupos }: { grupos: SolucionGrupo[] }) {
  const conContenido = grupos.filter((g) => g.posts.length > 0);

  return (
    <section className="bg-background-secundario">
      <div className="contenedor py-16 md:py-20">
        <h2 className="titulo-seccion">Catálogo de Soluciones Corporativas</h2>

        {conContenido.length === 0 && (
          <p className="text-center text-foreground-muted">
            Estamos cargando ejemplos de trabajos anteriores — mientras tanto, contanos tu
            proyecto y te mostramos referencias a medida.
          </p>
        )}

        <div className="flex flex-col gap-14">
          {conContenido.map((grupo) => (
            <div key={grupo.slug}>
              <h3 className="text-xl font-semibold text-azul mb-6">{grupo.label}</h3>
              <div className="showcase-grid">
                {grupo.posts.map((post) => (
                  <ShowcaseCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

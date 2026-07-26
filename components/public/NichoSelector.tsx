"use client";

import { trackClick } from "@/lib/actions/analytics";

const NICHOS = [
  {
    titulo: "Empresas & Marcas",
    texto: "Merchandising institucional y regalos empresariales en volumen.",
    slug: "empresas_marcas",
  },
  {
    titulo: "Cuadros, Filiales & Equipos",
    texto: "Escudos, fútbol 5, baby fútbol y torneos.",
    slug: "cuadros_filiales_equipos",
  },
  {
    titulo: "Eventos & Agrupaciones",
    texto: "Cumpleaños, egresados, bandas y festivales.",
    slug: "eventos_agrupaciones",
  },
];

// Los tres nichos llevan al mismo formulario con pasos (incluye subir la
// imagen/escudo de referencia) — antes dos de ellos iban directo a WhatsApp
// y se perdía la carga estructurada del archivo.
const COTIZAR_HREF = "/empresas#cotizar";

export function NichoSelector() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">¿Qué querés personalizar?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {NICHOS.map((nicho) => (
          <a
            key={nicho.titulo}
            href={COTIZAR_HREF}
            onClick={() => trackClick("nicho_selector", "/", nicho.slug)}
            className="group rounded-lg border border-border bg-surface p-6 transition-colors hover:border-azul"
          >
            <h3 className="font-medium mb-2 text-lg group-hover:text-azul transition-colors">
              {nicho.titulo}
            </h3>
            <p className="text-sm text-foreground-muted mb-4">{nicho.texto}</p>
            <span className="text-sm font-medium text-cian">Empezar →</span>
          </a>
        ))}
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

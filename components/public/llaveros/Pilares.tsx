export interface Pilar {
  titulo: string;
  texto: string;
}

// Iconos decorativos genéricos reutilizados por índice — el copy (título y
// texto) es lo único que cambia por segmento, vía segment_content.
const ICON_PATHS = [
  "M12 2C7 2 4 6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4-3-8-8-8Z",
  "M4 7h16M4 12h16M4 17h10",
  "M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3Zm0 0v18M3 7.5l9 4.5 9-4.5",
  "M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z",
];

export function Pilares({ pilares, title = "¿Por qué elegir a LUMO?" }: { pilares: Pilar[]; title?: string }) {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pilares.map((p, i) => (
          <div key={p.titulo} className="rounded-lg border border-border bg-surface p-6 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-azul"
            >
              <path d={ICON_PATHS[i % ICON_PATHS.length]} />
            </svg>
            <h3 className="font-medium mb-2">{p.titulo}</h3>
            <p className="text-sm text-foreground-muted">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

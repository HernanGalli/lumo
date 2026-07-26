const PILARES = [
  {
    titulo: "Sustentabilidad",
    texto: "Fabricación con bioplásticos de origen vegetal (PLA).",
    icon: (
      <path d="M12 2C7 2 4 6 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4-3-8-8-8Z" />
    ),
  },
  {
    titulo: "Sin mínimos costosos",
    texto: "Producción flexible desde tiradas cortas sin pagar matricería de inyección.",
    icon: <path d="M4 7h16M4 12h16M4 17h10" />,
  },
  {
    titulo: "Diseño 100% a medida",
    texto: "Adaptación de logos, colores institucionales y geometrías únicas.",
    icon: <path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3Zm0 0v18M3 7.5l9 4.5 9-4.5" />,
  },
  {
    titulo: "Garantía de calidad",
    texto: "Validación física mediante una muestra previa antes de la producción total.",
    icon: <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z" />,
  },
];

export function PilaresGrid() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">¿Por qué elegir a LUMO?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PILARES.map((p) => (
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
              {p.icon}
            </svg>
            <h3 className="font-medium mb-2">{p.titulo}</h3>
            <p className="text-sm text-foreground-muted">{p.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const WHATSAPP_NUMBER = "59898753757";

const NICHOS = [
  {
    titulo: "Empresas & Marcas",
    texto: "Merchandising institucional y regalos empresariales en volumen.",
    href: "/empresas",
  },
  {
    titulo: "Cuadros, Filiales & Equipos",
    texto: "Escudos, fútbol 5, baby fútbol y torneos.",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Hola LUMO, quiero llaveros/merchandising con el escudo de mi cuadro o equipo..."
    )}`,
  },
  {
    titulo: "Eventos & Agrupaciones",
    texto: "Cumpleaños, egresados, bandas y festivales.",
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Hola LUMO, quiero merchandising personalizado para un evento/agrupación..."
    )}`,
  },
];

export function NichoSelector() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">¿Qué querés personalizar?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {NICHOS.map((nicho) => (
          <a
            key={nicho.titulo}
            href={nicho.href}
            target={nicho.href.startsWith("http") ? "_blank" : undefined}
            rel={nicho.href.startsWith("http") ? "noopener noreferrer" : undefined}
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

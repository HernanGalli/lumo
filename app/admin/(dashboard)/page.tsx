import Link from "next/link";

interface Shortcut {
  href: string;
  title: string;
  description: string;
}

const groups: { heading: string; items: Shortcut[] }[] = [
  {
    heading: "Ventas",
    items: [
      {
        href: "/admin/calculadora",
        title: "Calculadora de costos",
        description: "Costo real y precio sugerido de una pieza, con insumos y lote.",
      },
      {
        href: "/admin/presupuestos",
        title: "Presupuestos",
        description: "Presupuestos con precios escalonados, desglose de costos y export a PDF.",
      },
      {
        href: "/admin/leads",
        title: "Leads",
        description: "Consultas de /llaveros y /empresas, filtrables por segmento.",
      },
      {
        href: "/admin/ventas",
        title: "Ventas",
        description: "Historial de presupuestos aceptados.",
      },
    ],
  },
  {
    heading: "Contenido del sitio",
    items: [
      {
        href: "/admin/catalogo",
        title: "Catálogo",
        description: "Productos publicados y categorías (catálogo y de segmento).",
      },
      {
        href: "/admin/showcase",
        title: "Showcase",
        description: "Trabajos reales para mostrar en el sitio y en /llaveros.",
      },
      {
        href: "/admin/segmentos",
        title: "Segmentos (Llaveros)",
        description: "Copy editable de cada segmento de /llaveros — hero, pilares, WhatsApp.",
      },
      {
        href: "/admin/banners",
        title: "Banners",
        description: "Carrusel del home y banner de /empresas.",
      },
      {
        href: "/admin/biblioteca",
        title: "Biblioteca de medios",
        description: "Subí una vez, reutilizá en banners, catálogo y showcase.",
      },
      {
        href: "/admin/logos-clientes",
        title: "Logos de clientes",
        description: "Carrusel de confianza de /empresas.",
      },
    ],
  },
  {
    heading: "Producción y configuración",
    items: [
      {
        href: "/admin/materiales",
        title: "Materiales e impresoras",
        description: "Costo por kg de cada filamento/resina, consumo y stock.",
      },
      {
        href: "/admin/insumos",
        title: "Insumos",
        description: "Argolla, cadena, packaging, mano de obra — costo puro por unidad.",
      },
      {
        href: "/admin/configuracion",
        title: "Configuración",
        description: "Tarifa UTE, margen, tramos de precio y fotos (filtro/compresión).",
      },
    ],
  },
];

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Backoffice LUMO</h1>
      <p className="text-foreground-muted mb-8">Calculadora de costos, presupuestos y contenido del sitio.</p>

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.heading}>
            <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted mb-3">
              {group.heading}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="rounded-lg border border-border bg-surface p-5 hover:border-azul transition-colors"
                >
                  <h3 className="font-medium mb-1">{s.title}</h3>
                  <p className="text-sm text-foreground-muted">{s.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

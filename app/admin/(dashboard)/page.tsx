import Link from "next/link";

const shortcuts = [
  {
    href: "/admin/calculadora",
    title: "Calculadora de costos",
    description: "Calculá el costo real y precio sugerido de una pieza.",
  },
  {
    href: "/admin/presupuestos",
    title: "Presupuestos",
    description: "Generá presupuestos con precios escalonados y exportalos a PDF.",
  },
  {
    href: "/admin/materiales",
    title: "Materiales e impresoras",
    description: "Costo por kg de cada filamento/resina y consumo de tus impresoras.",
  },
  {
    href: "/admin/configuracion",
    title: "Configuración",
    description: "Tarifa UTE, margen por defecto, valor hora y reglas de descuento.",
  },
];

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Backoffice LUMO</h1>
      <p className="text-foreground-muted mb-8">Fase 1: calculadora de costos y presupuestos.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-border bg-surface p-5 hover:border-azul transition-colors"
          >
            <h2 className="font-medium mb-1">{s.title}</h2>
            <p className="text-sm text-foreground-muted">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

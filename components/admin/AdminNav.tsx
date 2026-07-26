"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calculadora", label: "Calculadora" },
  { href: "/admin/presupuestos", label: "Presupuestos" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/showcase", label: "Showcase" },
  { href: "/admin/biblioteca", label: "Biblioteca de medios" },
  { href: "/admin/leads", label: "Leads Empresas" },
  { href: "/admin/logos-clientes", label: "Logos de Clientes" },
  { href: "/admin/materiales", label: "Materiales e Impresoras" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row md:flex-col gap-1 whitespace-nowrap">
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-azul text-white"
                : "text-foreground-muted hover:bg-background-secundario hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

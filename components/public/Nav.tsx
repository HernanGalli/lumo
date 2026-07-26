"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/empresas", label: "Empresas / A Medida" },
  { href: "/#contacto", label: "Contacto" },
];

export function Nav({ logoUrl }: { logoUrl: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <nav className="nav contenedor">
        <Link href="/" onClick={() => setOpen(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo LUMO" className="nav__logo" style={{ width: "auto" }} />
          ) : (
            <span className="nav__logo" style={{ display: "inline-flex", alignItems: "center", color: "var(--color-azul)", fontWeight: 600 }}>
              LUMO
            </span>
          )}
        </Link>
        <div className={`nav__menu ${open ? "show-menu" : ""}`}>
          <ul className="nav__links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav__link" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          className={`nav__toggle ${open ? "active" : ""}`}
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}

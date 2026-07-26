"use client";

import { useState } from "react";
import { ProductCard, type PublicProduct } from "@/components/public/ProductCard";

const INITIAL_COUNT = 6;

interface ProductWithCategories extends PublicProduct {
  categorySlugs: string[];
}

export function ProductGrid({
  products,
  categories,
}: {
  products: ProductWithCategories[];
  categories: { slug: string; name: string }[];
}) {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [expanded, setExpanded] = useState(false);

  const filtered =
    activeCategory === "todos"
      ? products
      : products.filter((p) => p.categorySlugs.includes(activeCategory));
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);

  function selectCategory(slug: string) {
    setActiveCategory(slug);
    setExpanded(false);
  }

  return (
    <section id="catalogo" className="catalogo contenedor">
      <h2 className="titulo-seccion">Nuestro Catálogo</h2>
      <div className="filtros">
        <button
          className={`filtro ${activeCategory === "todos" ? "activo" : ""}`}
          onClick={() => selectCategory("todos")}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            className={`filtro ${activeCategory === c.slug ? "activo" : ""}`}
            onClick={() => selectCategory(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="catalogo__contenido">
        <div className="productos-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--foreground-muted)" }}>
            Todavía no hay productos en esta categoría.
          </p>
        )}
        {filtered.length > INITIAL_COUNT && (
          <div className="ver-mas__contenedor">
            <button className="boton" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Ver menos" : "Ver más"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

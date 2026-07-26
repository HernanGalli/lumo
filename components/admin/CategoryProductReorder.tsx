"use client";

import Link from "next/link";
import { DragReorderList } from "@/components/admin/DragReorderList";
import { reorderProductsInCategory } from "@/lib/actions/products";

interface ProductRow {
  id: string;
  name: string;
  price_original: number;
  is_featured: boolean;
  imageUrl: string | null;
}

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

export function CategoryProductReorder({
  categoryId,
  products,
}: {
  categoryId: string;
  products: ProductRow[];
}) {
  return (
    <DragReorderList
      items={products}
      getId={(p) => p.id}
      onReorder={(orderedIds) => reorderProductsInCategory(categoryId, orderedIds)}
      renderItem={(product) => (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 min-w-0">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded object-cover foto-armonia"
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-background-secundario" />
            )}
            <div className="min-w-0">
              <p className="truncate">
                {product.name}
                {product.is_featured && (
                  <span className="ml-2 rounded-full bg-amarillo/20 px-2 py-0.5 text-xs text-amarillo">
                    Destacado
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground-muted">
                {formatoMoneda.format(product.price_original)}
              </p>
            </div>
          </div>
          <Link
            href={`/admin/catalogo/${product.id}`}
            className="shrink-0 text-azul hover:underline"
          >
            Editar
          </Link>
        </div>
      )}
    />
  );
}

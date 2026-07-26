import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { createCategory, deleteCategory, renameCategory } from "@/lib/actions/categories";
import { CategoryProductReorder } from "@/components/admin/CategoryProductReorder";
import { CategoryKindSegmentFields } from "@/components/admin/CategoryKindSegmentFields";

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, kind, segment")
    .order("sort_order", { ascending: true });

  const selectedCategory = categoria
    ? (categories ?? []).find((c) => c.slug === categoria)
    : undefined;

  let productsBlock: React.ReactNode;

  if (selectedCategory) {
    const { data: links } = await supabase
      .from("product_categories")
      .select("product_id, sort_order")
      .eq("category_id", selectedCategory.id)
      .order("sort_order", { ascending: true });

    const productIds = (links ?? []).map((l) => l.product_id);

    if (productIds.length === 0) {
      productsBlock = (
        <p className="text-sm text-foreground-muted">Todavía no hay productos en esta categoría.</p>
      );
    } else {
      const [{ data: products }, { data: images }] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price_original, is_featured")
          .in("id", productIds),
        supabase
          .from("product_images")
          .select("product_id, storage_path, sort_order")
          .in("product_id", productIds)
          .order("sort_order", { ascending: true }),
      ]);

      const firstImageByProduct = new Map<string, string>();
      for (const img of images ?? []) {
        if (!firstImageByProduct.has(img.product_id)) {
          firstImageByProduct.set(img.product_id, img.storage_path);
        }
      }
      const productById = new Map((products ?? []).map((p) => [p.id, p]));

      const rows = productIds
        .map((id) => productById.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => ({
          id: p.id,
          name: p.name,
          price_original: p.price_original,
          is_featured: p.is_featured,
          imageUrl: getPublicUrl(supabase, "products", firstImageByProduct.get(p.id) ?? null),
        }));

      productsBlock = <CategoryProductReorder categoryId={selectedCategory.id} products={rows} />;
    }
  } else {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price_original, is_featured, status")
      .order("name", { ascending: true });

    productsBlock = (
      <div className="flex flex-col gap-2">
        {(products ?? []).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-2 text-sm"
          >
            <div>
              <p>
                {p.name}
                {p.status === "draft" && (
                  <span className="ml-2 rounded-full bg-background-secundario px-2 py-0.5 text-xs text-foreground-muted">
                    Borrador
                  </span>
                )}
                {p.is_featured && (
                  <span className="ml-2 rounded-full bg-amarillo/20 px-2 py-0.5 text-xs text-amarillo">
                    Destacado
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground-muted">
                {formatoMoneda.format(p.price_original)}
              </p>
            </div>
            <Link href={`/admin/catalogo/${p.id}`} className="text-azul hover:underline">
              Editar
            </Link>
          </div>
        ))}
        {(products ?? []).length === 0 && (
          <p className="text-sm text-foreground-muted">Todavía no hay productos cargados.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Catálogo</h1>
          <p className="text-foreground-muted">
            {selectedCategory
              ? "Arrastrá para cambiar el orden en que aparecen en esta categoría."
              : "Elegí una categoría para poder reordenar sus productos."}
          </p>
        </div>
        <Link
          href="/admin/catalogo/nuevo"
          className="rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Nuevo producto
        </Link>
      </div>

      <details className="mb-6 rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium">Gestionar categorías</summary>
        <div className="mt-4 flex flex-col gap-2">
          {(categories ?? []).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
              <form action={renameCategory} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="name"
                  defaultValue={c.name}
                  className="flex-1 min-w-[10rem] rounded-md border border-border bg-background px-2 py-1.5"
                />
                <CategoryKindSegmentFields defaultKind={c.kind} defaultSegment={c.segment ?? ""} />
                <button type="submit" className="rounded-md border border-border px-2 py-1.5 hover:border-azul">
                  Guardar
                </button>
              </form>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="rounded-md border border-border px-2 py-1.5 text-rojo hover:border-rojo">
                  Borrar
                </button>
              </form>
            </div>
          ))}
          <form action={createCategory} className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <input
              name="name"
              placeholder="Nueva categoría (ej. Empresas)"
              required
              className="flex-1 min-w-[10rem] rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
            <CategoryKindSegmentFields />
            <button
              type="submit"
              className="rounded-md bg-azul px-3 py-1.5 text-sm text-white hover:bg-azul-claro"
            >
              Agregar
            </button>
          </form>
        </div>
      </details>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/admin/catalogo"
          className={`rounded-full px-3 py-1.5 text-sm ${!selectedCategory ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
        >
          Todos
        </Link>
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/catalogo?categoria=${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-sm ${selectedCategory?.id === c.id ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {productsBlock}
    </div>
  );
}

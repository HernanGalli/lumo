import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { ProductGrid } from "@/components/public/ProductGrid";
import { FadeInSection } from "@/components/public/FadeInSection";

export const metadata = {
  title: "Catálogo — LUMO",
  description: "Lámparas, hogar, pastelería y más piezas de impresión 3D listas para pedir.",
};

export default async function CatalogoPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    // kind='catalogo' — evita que las categorías de landing de segmento
    // (Empresas/Emprendimientos/Escuelas/Eventos/Grupos, usadas en
    // /llaveros y Showcase) aparezcan como filtros del catálogo general de
    // productos, donde no tienen ningún producto cargado.
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("kind", "catalogo")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, description, price_original, price_offer, is_offer, is_featured")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  const productIds = (products ?? []).map((p) => p.id);
  const [{ data: productCategories }, { data: images }] = await Promise.all([
    productIds.length
      ? supabase.from("product_categories").select("product_id, category_id").in("product_id", productIds)
      : Promise.resolve({ data: [] }),
    productIds.length
      ? supabase
          .from("product_images")
          .select("product_id, storage_path, sort_order")
          .in("product_id", productIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const categorySlugsByProduct = new Map<string, string[]>();
  const categoryLabelByProduct = new Map<string, string>();
  for (const pc of productCategories ?? []) {
    const category = categoryById.get(pc.category_id);
    if (!category) continue;
    const slugs = categorySlugsByProduct.get(pc.product_id) ?? [];
    slugs.push(category.slug);
    categorySlugsByProduct.set(pc.product_id, slugs);
    if (!categoryLabelByProduct.has(pc.product_id)) {
      categoryLabelByProduct.set(pc.product_id, category.name);
    }
  }

  const imagesByProduct = new Map<string, string[]>();
  for (const img of images ?? []) {
    const list = imagesByProduct.get(img.product_id) ?? [];
    const url = getPublicUrl(supabase, "products", img.storage_path);
    if (url) list.push(url);
    imagesByProduct.set(img.product_id, list);
  }

  const productList = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceOriginal: p.price_original,
    priceOffer: p.price_offer,
    isOffer: p.is_offer,
    images: imagesByProduct.get(p.id) ?? [],
    categoryLabel: categoryLabelByProduct.get(p.id) ?? "",
    categorySlugs: categorySlugsByProduct.get(p.id) ?? [],
  }));

  return (
    <FadeInSection>
      <ProductGrid products={productList} categories={categories ?? []} />
    </FadeInSection>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import {
  addProductImage,
  deleteProduct,
  deleteProductImage,
  reorderProductImages,
  updateProduct,
} from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
import { GalleryManager } from "@/components/admin/GalleryManager";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: productCategories }, { data: images }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
      supabase.from("product_categories").select("category_id").eq("product_id", id),
      supabase
        .from("product_images")
        .select("id, storage_path")
        .eq("product_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (!product) notFound();

  const selectedCategoryIds = (productCategories ?? []).map((pc) => pc.category_id);
  const imageRows = (images ?? []).map((img) => ({
    id: img.id,
    url: getPublicUrl(supabase, "products", img.storage_path) ?? "",
  }));

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="text-sm text-rojo hover:underline">
            Borrar producto
          </button>
        </form>
      </div>

      <ProductForm
        action={updateProduct}
        categories={categories ?? []}
        product={product}
        selectedCategoryIds={selectedCategoryIds}
        submitLabel="Guardar cambios"
      />

      <GalleryManager
        entityId={product.id}
        entityFieldName="productId"
        bucket="products"
        images={imageRows}
        addAction={addProductImage}
        deleteAction={deleteProductImage}
        reorderAction={reorderProductImages}
      />
    </div>
  );
}

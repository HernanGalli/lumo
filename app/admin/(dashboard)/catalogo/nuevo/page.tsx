import { createClient } from "@/lib/supabase/server";
import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Nuevo producto</h1>
      <p className="text-foreground-muted mb-6">
        Después de crearlo vas a poder subirle fotos.
      </p>
      <ProductForm action={createProduct} categories={categories ?? []} submitLabel="Crear producto" />
    </div>
  );
}

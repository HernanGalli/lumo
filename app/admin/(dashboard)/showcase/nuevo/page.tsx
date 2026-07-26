import { createClient } from "@/lib/supabase/server";
import { createShowcasePost } from "@/lib/actions/showcase";
import { ShowcaseForm } from "@/components/admin/ShowcaseForm";

export default async function NuevaShowcasePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Nueva publicación</h1>
      <p className="text-foreground-muted mb-6">
        Después de crearla vas a poder subirle fotos.
      </p>
      <ShowcaseForm
        action={createShowcasePost}
        categories={categories ?? []}
        submitLabel="Crear publicación"
      />
    </div>
  );
}

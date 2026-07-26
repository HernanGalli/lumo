import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteBanner, updateBanner } from "@/lib/actions/banners";
import { BannerForm } from "@/components/admin/BannerForm";

export default async function EditarBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: banner } = await supabase.from("banners").select("*").eq("id", id).single();

  if (!banner) notFound();

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar banner</h1>
        <form action={deleteBanner}>
          <input type="hidden" name="id" value={banner.id} />
          <button type="submit" className="text-sm text-rojo hover:underline">
            Borrar banner
          </button>
        </form>
      </div>
      <BannerForm action={updateBanner} banner={banner} submitLabel="Guardar cambios" />
    </div>
  );
}

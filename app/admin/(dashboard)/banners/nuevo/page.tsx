import { createBanner } from "@/lib/actions/banners";
import { BannerForm } from "@/components/admin/BannerForm";

export default function NuevoBannerPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">Nuevo banner</h1>
      <p className="text-foreground-muted mb-6">
        Videos cortos en loop o imágenes para el hero del home.
      </p>
      <BannerForm action={createBanner} submitLabel="Crear banner" />
    </div>
  );
}

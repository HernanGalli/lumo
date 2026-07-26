import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { createClientLogo } from "@/lib/actions/clientLogos";
import { ClientLogoReorderList } from "@/components/admin/ClientLogoReorderList";

export default async function LogosClientesPage() {
  const supabase = await createClient();
  const { data: logos } = await supabase
    .from("client_logos")
    .select("id, name, storage_path")
    .order("sort_order", { ascending: true });

  const rows = (logos ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    url: getPublicUrl(supabase, "client-logos", l.storage_path),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Logos de clientes</h1>
      <p className="text-foreground-muted mb-8">
        Carrusel de confianza que se muestra en /empresas.
      </p>

      {rows.length > 0 && (
        <div className="mb-6">
          <ClientLogoReorderList logos={rows} />
        </div>
      )}

      <form
        action={createClientLogo}
        className="rounded-lg border border-border bg-surface p-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="block text-xs text-foreground-muted mb-1" htmlFor="name">
            Nombre (opcional)
          </label>
          <input
            id="name"
            name="name"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-foreground-muted mb-1" htmlFor="file">
            Logo
          </label>
          <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Agregar logo
        </button>
      </form>
    </div>
  );
}

import { listMediaAssets, deleteMediaAsset, uploadMediaAssetForm } from "@/lib/actions/mediaLibrary";

export default async function BibliotecaPage() {
  const assets = await listMediaAssets();

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Biblioteca de medios</h1>
        <p className="text-foreground-muted">
          Subí una vez, reutilizá en Banners, Catálogo y Showcase sin volver a subir el mismo
          archivo.
        </p>
      </div>

      <form
        action={uploadMediaAssetForm}
        className="rounded-lg border border-border bg-surface p-6 flex flex-wrap items-end gap-4"
      >
        <div className="flex-1 min-w-[200px]">
          <label className={labelClass} htmlFor="file">
            Imagen o video
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            required
            className="w-full text-sm"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className={labelClass} htmlFor="tags">
            Etiquetas (separadas por coma)
          </label>
          <input
            id="tags"
            name="tags"
            placeholder="llaveros, fútbol, empresas"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Subir a la biblioteca
        </button>
      </form>

      {assets.length === 0 ? (
        <p className="text-sm text-foreground-muted">Todavía no subiste nada a la biblioteca.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-lg border border-border bg-surface overflow-hidden">
              <div className="aspect-square bg-background-secundario">
                {asset.mediaType === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.fileName ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <video src={asset.url} className="h-full w-full object-cover" muted />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs truncate mb-1">{asset.fileName ?? "Sin nombre"}</p>
                {asset.tags.length > 0 && (
                  <p className="text-xs text-foreground-muted truncate mb-2">
                    {asset.tags.join(", ")}
                  </p>
                )}
                <form action={deleteMediaAsset}>
                  <input type="hidden" name="id" value={asset.id} />
                  <button type="submit" className="text-xs text-rojo hover:underline">
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

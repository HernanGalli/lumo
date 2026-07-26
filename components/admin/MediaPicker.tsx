"use client";

import { useState } from "react";
import {
  copyMediaAssetToBucket,
  listMediaAssets,
  uploadMediaAsset,
  type MediaAssetRow,
} from "@/lib/actions/mediaLibrary";

export interface ResolvedMedia {
  storagePath: string;
  mediaType: "image" | "video";
}

export function MediaPicker({
  targetBucket,
  allowVideo = false,
  onResolved,
  triggerLabel = "Elegir de la biblioteca",
}: {
  targetBucket: string;
  allowVideo?: boolean;
  onResolved: (result: ResolvedMedia) => void;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"biblioteca" | "nuevo">("biblioteca");
  const [assets, setAssets] = useState<MediaAssetRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openPicker() {
    setOpen(true);
    setError("");
    if (!assets) {
      const list = await listMediaAssets();
      setAssets(allowVideo ? list : list.filter((a) => a.mediaType === "image"));
    }
  }

  async function pickExisting(assetId: string) {
    setBusy(true);
    setError("");
    try {
      const result = await copyMediaAssetToBucket(assetId, targetBucket);
      onResolved(result);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo usar esa imagen");
    } finally {
      setBusy(false);
    }
  }

  async function uploadNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const created = await uploadMediaAsset(formData);
      const result = await copyMediaAssetToBucket(created.id, targetBucket);
      onResolved(result);
      setAssets(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-azul transition-colors"
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Biblioteca de medios</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-foreground-muted hover:text-foreground">
                &times;
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTab("biblioteca")}
                className={`rounded-md px-3 py-1.5 text-sm ${tab === "biblioteca" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
              >
                Elegir existente
              </button>
              <button
                type="button"
                onClick={() => setTab("nuevo")}
                className={`rounded-md px-3 py-1.5 text-sm ${tab === "nuevo" ? "bg-azul text-white" : "border border-border text-foreground-muted"}`}
              >
                Subir nuevo
              </button>
            </div>

            {error && <p className="text-sm text-rojo mb-3">{error}</p>}

            {tab === "biblioteca" ? (
              assets === null ? (
                <p className="text-sm text-foreground-muted">Cargando...</p>
              ) : assets.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  Todavía no hay nada en la biblioteca. Subí algo en la otra pestaña.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {assets.map((asset) => (
                    <button
                      type="button"
                      key={asset.id}
                      disabled={busy}
                      onClick={() => pickExisting(asset.id)}
                      className="aspect-square rounded-md overflow-hidden border border-border hover:border-azul transition-colors disabled:opacity-50"
                      title={asset.fileName ?? undefined}
                    >
                      {asset.mediaType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={asset.url} className="h-full w-full object-cover" muted />
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : (
              <form onSubmit={uploadNew} className="flex flex-col gap-3">
                <input
                  type="file"
                  name="file"
                  required
                  accept={allowVideo ? "image/jpeg,image/png,image/webp,video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
                  className="text-sm"
                />
                <input
                  type="text"
                  name="tags"
                  placeholder="Etiquetas (opcional, separadas por coma)"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="self-start rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors disabled:opacity-60"
                >
                  {busy ? "Subiendo..." : "Subir y usar"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

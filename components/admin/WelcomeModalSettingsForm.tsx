"use client";

import { useState } from "react";
import { updateWelcomeModalSettings } from "@/lib/actions/settings";
import { MediaPicker, type ResolvedMedia } from "@/components/admin/MediaPicker";

interface WelcomeModalSettings {
  enabled: boolean;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

// Mismo formato que lib/supabase/storage.ts::getPublicUrl — se arma acá
// para la vista previa en vivo sin necesitar un viaje al servidor;
// NEXT_PUBLIC_SUPABASE_URL ya es público (lo usa el cliente de Supabase del
// navegador).
function publicUrlFor(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function WelcomeModalSettingsForm({ settings }: { settings: WelcomeModalSettings }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [imagePath, setImagePath] = useState("");
  const [previewUrl, setPreviewUrl] = useState(settings.imageUrl);
  const [title, setTitle] = useState(settings.title);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [buttonText, setButtonText] = useState(settings.buttonText);

  function handleResolved(result: ResolvedMedia) {
    setImagePath(result.storagePath);
    setPreviewUrl(publicUrlFor("banners", result.storagePath));
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-xs text-foreground-muted mb-1";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form action={updateWelcomeModalSettings} className="flex flex-col gap-4 text-sm">
        <input type="hidden" name="imagePath" value={imagePath} />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Mostrar el modal de bienvenida a los visitantes</span>
        </label>

        <div>
          <span className={labelClass}>Imagen</span>
          <div className="flex items-center gap-3">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-16 w-16 rounded object-cover border border-border" />
            ) : (
              <div className="h-16 w-16 rounded border border-dashed border-border" />
            )}
            <MediaPicker targetBucket="banners" onResolved={handleResolved} triggerLabel="Elegir foto" />
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            Usá una foto real de Showcase — se procesa igual que el resto (filtro y compresión
            automáticos).
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="wmTitle">
            Título
          </label>
          <input
            id="wmTitle"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="wmSubtitle">
            Subtítulo
          </label>
          <textarea
            id="wmSubtitle"
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            required
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="wmButtonText">
              Texto del botón
            </label>
            <input
              id="wmButtonText"
              name="buttonText"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="wmButtonLink">
              Link del botón
            </label>
            <input
              id="wmButtonLink"
              name="buttonLink"
              defaultValue={settings.buttonLink}
              placeholder="/llaveros o https://wa.me/..."
              required
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Guardar modal de bienvenida
        </button>
      </form>

      <div>
        <p className={labelClass}>Vista previa</p>
        <div className="rounded-lg border border-border bg-black/60 p-6 flex items-center justify-center">
          <div className="w-full max-w-[320px] rounded-lg bg-surface overflow-hidden shadow-lg">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-background-secundario flex items-center justify-center text-xs text-foreground-muted">
                Sin imagen
              </div>
            )}
            <div className="p-4 text-center">
              <h3 className="font-semibold text-azul text-lg mb-1">{title || "Título"}</h3>
              <p className="text-sm text-foreground-muted mb-3">{subtitle || "Subtítulo"}</p>
              <span className="inline-block rounded-md bg-azul px-4 py-2 text-sm text-white">
                {buttonText || "Botón"}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-foreground-muted">
          Así se ve para un visitante nuevo — se muestra una sola vez cada 7 días por persona,
          nunca en el admin.
        </p>
      </div>
    </div>
  );
}

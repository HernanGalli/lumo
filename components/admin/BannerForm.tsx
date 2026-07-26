"use client";

import { useState } from "react";

interface BannerFormProps {
  action: (formData: FormData) => void | Promise<void>;
  banner?: {
    id: string;
    media_type: string;
    page_target: string;
    headline: string | null;
    body_text: string | null;
    cta_text: string | null;
    cta_url: string | null;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
  };
  submitLabel: string;
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function BannerForm({ action, banner, submitLabel }: BannerFormProps) {
  const [mediaType, setMediaType] = useState(banner?.media_type ?? "video");
  const [pageTarget, setPageTarget] = useState(banner?.page_target ?? "home");

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-sm text-foreground-muted mb-1";

  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      <div>
        <span className={labelClass}>Dónde se muestra</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pageTarget"
              value="home"
              checked={pageTarget === "home"}
              onChange={() => setPageTarget("home")}
            />
            Home (carrusel principal)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pageTarget"
              value="empresas"
              checked={pageTarget === "empresas"}
              onChange={() => setPageTarget("empresas")}
            />
            /empresas (landing B2B)
          </label>
        </div>
      </div>

      <div>
        <span className={labelClass}>Tipo</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mediaType"
              value="video"
              checked={mediaType === "video"}
              onChange={() => setMediaType("video")}
            />
            Video (loop corto)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mediaType"
              value="image"
              checked={mediaType === "image"}
              onChange={() => setMediaType("image")}
            />
            Imagen
          </label>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="file">
          {mediaType === "video" ? "Video" : "Imagen"}
          {banner && " (dejar vacío para no cambiarlo)"}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept={mediaType === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
          required={!banner}
          className="w-full text-sm"
        />
      </div>

      {mediaType === "video" && (
        <div>
          <label className={labelClass} htmlFor="posterFile">
            Poster (imagen de portada mientras carga el video, opcional)
          </label>
          <input
            id="posterFile"
            name="posterFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm"
          />
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="headline">
          Título {pageTarget === "empresas" && "(ej. Descuentos en pedidos +100 unidades)"}
        </label>
        <input
          id="headline"
          name="headline"
          defaultValue={banner?.headline ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="bodyText">
          Bajada / gancho {pageTarget === "empresas" && "(ej. ¿No te imaginás cómo quedaría tu escudo o logo en 3D? Adjuntá tu archivo y te armamos una previsualización digital gratis, sin compromiso.)"}
        </label>
        <textarea
          id="bodyText"
          name="bodyText"
          rows={2}
          defaultValue={banner?.body_text ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ctaText">
          Texto del botón {pageTarget === "home" && "(no se usa en el hero del Home, solo en /empresas)"}
        </label>
        <input
          id="ctaText"
          name="ctaText"
          defaultValue={banner?.cta_text ?? "Cotiza tu Proyecto"}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ctaUrl">
          Link del botón (opcional, ej. /empresas o #cotizar)
        </label>
        <input id="ctaUrl" name="ctaUrl" defaultValue={banner?.cta_url ?? ""} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="startsAt">
            Activo desde (opcional)
          </label>
          <input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={toDateInputValue(banner?.starts_at ?? null)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="endsAt">
            Activo hasta (opcional)
          </label>
          <input
            id="endsAt"
            name="endsAt"
            type="date"
            defaultValue={toDateInputValue(banner?.ends_at ?? null)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={banner?.is_active ?? true} />
        Activo
      </label>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}

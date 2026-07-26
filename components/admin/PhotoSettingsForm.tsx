"use client";

import { useState } from "react";
import { updatePhotoSettings } from "@/lib/actions/settings";
import type { PhotoSettings } from "@/lib/settings";

export function PhotoSettingsForm({ settings }: { settings: PhotoSettings }) {
  const [activo, setActivo] = useState(settings.filtroActivo);
  const [calidad, setCalidad] = useState(settings.calidadWebp);

  return (
    <form action={updatePhotoSettings} className="flex flex-col gap-5 text-sm">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="fotoFiltroActivo"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-4 w-4"
        />
        <span>Aplicar filtro profesional automáticamente a las fotos nuevas</span>
      </label>

      <label className="flex flex-col gap-1 max-w-xs">
        <span className="text-foreground-muted">Intensidad del filtro</span>
        <select
          name="fotoFiltroIntensidad"
          defaultValue={settings.filtroIntensidad}
          disabled={!activo}
          className="rounded-md border border-border bg-background px-3 py-2 disabled:opacity-50"
        >
          <option value="suave">Suave</option>
          <option value="medio">Medio</option>
          <option value="fuerte">Fuerte</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 max-w-xs">
        <span className="text-foreground-muted">Ancho máximo de salida (px)</span>
        <input
          type="number"
          name="fotoAnchoMaximoPx"
          min={200}
          max={4000}
          defaultValue={settings.anchoMaximoPx}
          className="rounded-md border border-border bg-background px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 max-w-xs">
        <span className="text-foreground-muted">Calidad de compresión WebP: {calidad}</span>
        <input
          type="range"
          name="fotoCalidadWebp"
          min={1}
          max={100}
          value={calidad}
          onChange={(e) => setCalidad(Number(e.target.value))}
        />
      </label>

      <button
        type="submit"
        className="self-start rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
      >
        Guardar
      </button>
    </form>
  );
}

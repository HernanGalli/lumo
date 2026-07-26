import "server-only";
import sharp, { type Sharp } from "sharp";

export type FilterIntensity = "suave" | "medio" | "fuerte";

const FILTER_PRESETS: Record<FilterIntensity, { saturation: number; contrast: number; brightness: number }> = {
  suave: { saturation: 1.1, contrast: 1.08, brightness: 1.02 },
  medio: { saturation: 1.18, contrast: 1.15, brightness: 1.03 },
  fuerte: { saturation: 1.28, contrast: 1.22, brightness: 1.05 },
};

// Preset "Profesional": contraste + saturación levemente realzados, balance
// cálido leve y un realce de bordes sutil. Ver tratamiento-de-imagenes.md §2.
export function applyProfessionalFilter(image: Sharp, intensity: FilterIntensity): Sharp {
  const preset = FILTER_PRESETS[intensity];
  return image
    .modulate({ saturation: preset.saturation, brightness: preset.brightness })
    .linear(preset.contrast, -(128 * preset.contrast) + 128)
    .sharpen({ sigma: 0.6 });
}

export interface ProcessImageOptions {
  maxWidthPx: number;
  webpQuality: number;
  applyFilter: boolean;
  filterIntensity: FilterIntensity;
}

export interface ProcessedImageResult {
  /** Versión liviana para el sitio público (catálogo, showcase, home). */
  webBuffer: Buffer;
  /** Versión jpg — @react-pdf/renderer no siempre soporta webp de forma confiable. */
  pdfBuffer: Buffer;
}

// Redimensiona (si excede el ancho máximo), aplica el filtro profesional
// (salvo que el admin lo haya desactivado para esta foto puntual), y genera
// las 2 versiones de salida. Ver tratamiento-de-imagenes.md §1.
export async function processImage(
  input: Buffer,
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  let pipeline = sharp(input).rotate().resize({
    width: options.maxWidthPx,
    withoutEnlargement: true,
  });

  if (options.applyFilter) {
    pipeline = applyProfessionalFilter(pipeline, options.filterIntensity);
  }

  // clone() para poder derivar 2 salidas (webp y jpg) del mismo buffer ya
  // redimensionado/filtrado, sin re-decodificar el original dos veces.
  const base = await pipeline.toBuffer();
  const [webBuffer, pdfBuffer] = await Promise.all([
    sharp(base).webp({ quality: options.webpQuality }).toBuffer(),
    sharp(base).jpeg({ quality: 90 }).toBuffer(),
  ]);

  // sharp puede devolver buffers respaldados por el pool interno de threads
  // de libvips (visto como un ArrayBuffer compartido) — el runtime de fetch
  // de Vercel rechaza ese tipo de buffer como body con "SharedArrayBuffer is
  // not allowed". Buffer.from() copia a un ArrayBuffer propio y no compartido.
  return { webBuffer: Buffer.from(webBuffer), pdfBuffer: Buffer.from(pdfBuffer) };
}

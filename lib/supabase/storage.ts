import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { processImage } from "@/lib/images/processImage";
import { PHOTO_SETTINGS_KEYS, getPhotoSettings, settingsRowsToMap } from "@/lib/settings";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB, banners cortos en loop

export type UploadKind = "image" | "video";

export class InvalidFileError extends Error {}

function validateFile(file: File, kind: UploadKind) {
  const allowedTypes = kind === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (!allowedTypes.includes(file.type)) {
    throw new InvalidFileError(
      `Tipo de archivo no permitido (${file.type || "desconocido"}). Usá ${allowedTypes.join(", ")}.`
    );
  }
  if (file.size === 0) {
    throw new InvalidFileError("El archivo está vacío.");
  }
  if (file.size > maxBytes) {
    throw new InvalidFileError(
      `El archivo supera el máximo permitido (${Math.round(maxBytes / 1024 / 1024)}MB).`
    );
  }
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] ?? "bin";
}

export interface UploadOptions {
  /** Checkbox "No aplicar filtro a esta foto" — ver tratamiento-de-imagenes.md §2. */
  skipFilter?: boolean;
}

// Para videos, el flujo es idéntico a siempre (sharp no procesa video). Para
// imágenes, se corre el pipeline de lib/images/processImage.ts antes de
// subir: redimensiona, aplica el filtro profesional (salvo skipFilter u
// opción desactivada en Configuración) y genera 2 salidas — un .webp liviano
// para el sitio (que pisa el mismo storage_path de siempre, sin romper
// ningún consumidor existente) y un .jpg hermano "a prueba de PDF" al lado,
// derivable con toPdfSafePath() cuando el código lo necesite (hoy: el logo
// de marca en el header del PDF de presupuestos).
export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: string,
  file: File,
  kind: UploadKind,
  opts?: UploadOptions
): Promise<string> {
  validateFile(file, kind);

  if (kind === "video") {
    const path = `${randomUUID()}.${extensionFor(file)}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);
    return path;
  }

  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", PHOTO_SETTINGS_KEYS);
  const photoSettings = getPhotoSettings(settingsRowsToMap(settingsRows ?? []));

  const original = Buffer.from(await file.arrayBuffer());
  const { webBuffer, pdfBuffer } = await processImage(original, {
    maxWidthPx: photoSettings.anchoMaximoPx,
    webpQuality: photoSettings.calidadWebp,
    applyFilter: photoSettings.filtroActivo && !opts?.skipFilter,
    filterIntensity: photoSettings.filtroIntensidad,
  });

  const path = `${randomUUID()}.webp`;
  const jpgPath = toPdfSafePath(path)!;

  const [{ error: webError }, { error: jpgError }] = await Promise.all([
    supabase.storage.from(bucket).upload(path, webBuffer, { contentType: "image/webp", upsert: false }),
    supabase.storage.from(bucket).upload(jpgPath, pdfBuffer, { contentType: "image/jpeg", upsert: false }),
  ]);

  if (webError) throw new Error(`No se pudo subir el archivo: ${webError.message}`);
  if (jpgError) {
    // No bloqueamos la subida principal por esto — pero sin el hermano jpg
    // esta imagen no tiene versión "a prueba de PDF" hasta reprocesarse.
    console.error("No se pudo subir la versión PDF-compatible de la imagen:", jpgError.message);
  }

  return path;
}

// Deriva el path del jpg "a prueba de PDF" hermano de un .webp procesado por
// el pipeline. Si el path no es .webp (foto subida antes de este cambio, o
// video), se devuelve tal cual — no tiene hermano hasta reprocesarse (ver
// scripts/reprocess-images.ts).
export function toPdfSafePath(path: string | null): string | null {
  if (!path) return null;
  return path.endsWith(".webp") ? path.replace(/\.webp$/, ".jpg") : path;
}

export function getPublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null
): string | null {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function deleteFromBucket(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null
) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

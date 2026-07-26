import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: string,
  file: File,
  kind: UploadKind
): Promise<string> {
  validateFile(file, kind);

  const path = `${randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  return path;
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

import "server-only";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

// @react-pdf/renderer no soporta de forma confiable todos los formatos de
// imagen (ej. WebP puede salir en blanco o como bloques de color corridos).
// El logo de marca (bucket "branding") se carga a mano en Supabase Storage,
// sin pasar por el pipeline de lib/supabase/storage.ts, así que no hay
// garantía de en qué formato está guardado. Para que el PDF siempre lo
// muestre bien, se descarga el archivo, se decodifica con sharp (que sí
// soporta webp/png/jpg/gif/svg de forma robusta) y se reencodea a PNG en el
// momento, como data URI — sin importar el formato real del archivo.
export async function fetchPdfSafeImageDataUri(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null
): Promise<string | null> {
  if (!path) return null;

  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) return null;

    const original = Buffer.from(await data.arrayBuffer());
    const pngBuffer = await sharp(original).png().toBuffer();
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch (err) {
    console.error(`No se pudo preparar la imagen del PDF (${bucket}/${path}):`, err);
    return null;
  }
}

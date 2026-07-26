// Backfill único: reprocesa las fotos que ya estaban subidas antes del
// pipeline de compresión/filtro (lib/images/processImage.ts), para que
// también queden livianas (.webp) y con su hermano "a prueba de PDF" (.jpg).
// Ver tratamiento-de-imagenes.md §5.
//
//   npx tsx scripts/reprocess-images.ts
//
// Idempotente: cualquier storage_path que ya termine en .webp se asume ya
// migrado por el pipeline y se saltea, así que correrlo de nuevo después de
// una corrida parcial (ej. por un error de red) es seguro.
//
// No se importa lib/images/processImage.ts acá a propósito — ese archivo
// tiene `import "server-only"`, que rompe fuera del runtime de Next.js. La
// lógica de sharp se repite acá (mismos presets), igual que scripts/seed.ts
// ya es un script standalone con su propia conexión a Supabase.

import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

process.loadEnvFile(join(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MAX_WIDTH_PX = 1600;
const WEBP_QUALITY = 80;
// Preset "suave" — mismo default que foto_filtro_intensidad en settings.
const FILTER = { saturation: 1.1, contrast: 1.08, brightness: 1.02 };

async function reprocessOne(bucket: string, path: string): Promise<string | null> {
  const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(path);
  if (downloadError || !blob) {
    console.error(`  ✗ no se pudo descargar ${bucket}/${path}: ${downloadError?.message}`);
    return null;
  }

  const original = Buffer.from(await blob.arrayBuffer());
  const base = await sharp(original)
    .rotate()
    .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
    .modulate({ saturation: FILTER.saturation, brightness: FILTER.brightness })
    .linear(FILTER.contrast, -(128 * FILTER.contrast) + 128)
    .sharpen({ sigma: 0.6 })
    .toBuffer();

  const [webBuffer, pdfBuffer] = await Promise.all([
    sharp(base).webp({ quality: WEBP_QUALITY }).toBuffer(),
    sharp(base).jpeg({ quality: 90 }).toBuffer(),
  ]);

  const newPath = `${randomUUID()}.webp`;
  const jpgPath = newPath.replace(/\.webp$/, ".jpg");

  const [{ error: webError }, { error: jpgError }] = await Promise.all([
    supabase.storage.from(bucket).upload(newPath, webBuffer, { contentType: "image/webp" }),
    supabase.storage.from(bucket).upload(jpgPath, pdfBuffer, { contentType: "image/jpeg" }),
  ]);
  if (webError) {
    console.error(`  ✗ no se pudo subir la versión procesada de ${bucket}/${path}: ${webError.message}`);
    return null;
  }
  if (jpgError) {
    console.error(`  ! versión .jpg no se pudo subir para ${bucket}/${newPath}: ${jpgError.message}`);
  }

  await supabase.storage.from(bucket).remove([path]);
  return newPath;
}

interface TargetTable {
  table: string;
  bucket: string;
  pathColumn: string;
}

const TARGETS: TargetTable[] = [
  { table: "product_images", bucket: "products", pathColumn: "storage_path" },
  { table: "banners", bucket: "banners", pathColumn: "storage_path" },
  { table: "banners", bucket: "banners", pathColumn: "poster_storage_path" },
  { table: "showcase_post_images", bucket: "showcase", pathColumn: "storage_path" },
  { table: "client_logos", bucket: "client-logos", pathColumn: "storage_path" },
  { table: "media_assets", bucket: "media-library", pathColumn: "storage_path" },
];

async function run() {
  for (const target of TARGETS) {
    const { data: rows, error } = await supabase
      .from(target.table)
      .select("*")
      .not(target.pathColumn, "is", null);
    if (error) {
      console.error(`No se pudo leer ${target.table}: ${error.message}`);
      continue;
    }

    const pending = (rows ?? []).filter((r) => {
      const path = (r as Record<string, unknown>)[target.pathColumn] as string | null;
      return path && !path.endsWith(".webp");
    });

    console.log(`${target.table}.${target.pathColumn}: ${pending.length} fotos por reprocesar`);

    for (const row of pending) {
      const r = row as Record<string, unknown>;
      const path = r[target.pathColumn] as string;
      const newPath = await reprocessOne(target.bucket, path);
      if (!newPath) continue;

      const { error: updateError } = await supabase
        .from(target.table)
        .update({ [target.pathColumn]: newPath })
        .eq("id", r.id);
      if (updateError) {
        console.error(`  ✗ no se pudo actualizar ${target.table}.${r.id}: ${updateError.message}`);
        continue;
      }
      console.log(`  ✓ ${target.bucket}/${path} → ${newPath}`);
    }
  }

  console.log("Listo.");
}

run();

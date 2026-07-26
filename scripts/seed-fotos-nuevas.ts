// Carga puntual (una sola vez) de las 13 fotos reales que estaban sin usar
// en public/Fotos-Nuevas/ (.HEIC) a /admin/showcase, categorizadas según lo
// acordado con el cliente en la sesión de auditoría de Fase 5.
//
// Las fuentes .HEIC no las puede decodificar sharp directamente (el
// firmware de iPhone genera un iref box con más referencias de las que
// permite el límite de seguridad de libheif) — se convierten primero a JPG
// con `sips` (nativo de macOS) y de ahí se corre el mismo pipeline de
// siempre (resize + filtro + salida webp/jpg) antes de subir.
//
//   npx tsx scripts/seed-fotos-nuevas.ts

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { slugify } from "../lib/slug";

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

const SOURCE_DIR = join(process.cwd(), "public", "Fotos-Nuevas");
const MAX_WIDTH_PX = 1600;
const WEBP_QUALITY = 80;
const FILTER = { saturation: 1.1, contrast: 1.08, brightness: 1.02 }; // preset "suave"

interface Publication {
  title: string;
  description: string;
  categorySlug: string;
  files: string[]; // nombres dentro de public/Fotos-Nuevas
}

const PUBLICATIONS: Publication[] = [
  {
    title: "Llaveros para distintos clientes",
    description: "Llaveros personalizados con el logo de cada marca, para varios clientes.",
    categorySlug: "merchandising-onboarding",
    files: ["IMG_3064.HEIC"],
  },
  {
    title: "Llaveros Roger Cars",
    description: "Llaveros personalizados con el logo de Roger Cars.",
    categorySlug: "merchandising-onboarding",
    files: ["IMG_3072.heic"],
  },
  {
    title: "Llavero La Unión es Manya",
    description: "Llavero personalizado con la identidad de la hinchada.",
    categorySlug: "identidad-de-grupo",
    files: ["IMG_3077.HEIC"],
  },
  {
    title: "Cartel LC Joyas",
    description: "Cartel de presencia de marca personalizado para LC Joyas.",
    categorySlug: "presencia-de-marca",
    files: ["IMG_3508.HEIC", "IMG_3510.HEIC"],
  },
  {
    title: 'Llaveros "mom"',
    description: "Llaveros souvenir con diseño de flor, ideales para regalar.",
    categorySlug: "souvenirs",
    files: ["IMG_3526.HEIC", "IMG_3529.HEIC"],
  },
  {
    title: "Pedido mayorista Fiswell",
    description: "Producción en volumen de llaveros personalizados para Fiswell Mayorista.",
    categorySlug: "merchandising-onboarding",
    files: [
      "IMG_3569.HEIC",
      "IMG_3599.HEIC",
      "IMG_3605.HEIC",
      "IMG_3606.HEIC",
      "IMG_3607.HEIC",
      "IMG_3608.HEIC",
    ],
  },
];

function heicToJpegBuffer(fileName: string): Buffer {
  const src = join(SOURCE_DIR, fileName);
  const tmpDir = mkdtempSync(join(tmpdir(), "lumo-fotos-"));
  const out = join(tmpDir, "convert.jpg");
  execFileSync("sips", ["-s", "format", "jpeg", src, "--out", out], { stdio: "pipe" });
  return readFileSync(out);
}

async function processImage(original: Buffer): Promise<{ webBuffer: Buffer; pdfBuffer: Buffer }> {
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
  return { webBuffer, pdfBuffer };
}

async function uploadToShowcase(fileName: string): Promise<string> {
  const heic = heicToJpegBuffer(fileName);
  const { webBuffer, pdfBuffer } = await processImage(heic);

  const path = `${randomUUID()}.webp`;
  const jpgPath = path.replace(/\.webp$/, ".jpg");

  const [{ error: webError }, { error: jpgError }] = await Promise.all([
    supabase.storage.from("showcase").upload(path, webBuffer, { contentType: "image/webp" }),
    supabase.storage.from("showcase").upload(jpgPath, pdfBuffer, { contentType: "image/jpeg" }),
  ]);
  if (webError) throw new Error(`No se pudo subir ${fileName}: ${webError.message}`);
  if (jpgError) console.error(`  ! hermano jpg no subido para ${fileName}: ${jpgError.message}`);

  return path;
}

async function run() {
  for (const pub of PUBLICATIONS) {
    const { data: already } = await supabase
      .from("showcase_posts")
      .select("id")
      .eq("title", pub.title)
      .maybeSingle();
    if (already) {
      console.log(`- "${pub.title}" ya existe, la salteo (correr de nuevo es seguro).`);
      continue;
    }

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", pub.categorySlug)
      .maybeSingle();
    if (!category) {
      console.error(`✗ Categoría "${pub.categorySlug}" no encontrada — saltando "${pub.title}"`);
      continue;
    }

    const baseSlug = slugify(pub.title);
    let slug = baseSlug;
    let attempt = 1;
    while (true) {
      const { data: existing } = await supabase
        .from("showcase_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${++attempt}`;
    }

    const { data: maxRow } = await supabase
      .from("showcase_posts")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: post, error: postError } = await supabase
      .from("showcase_posts")
      .insert({
        title: pub.title,
        slug,
        description: pub.description,
        category_id: category.id,
        status: "published",
        sort_order: (maxRow?.sort_order ?? -1) + 1,
      })
      .select("id")
      .single();
    if (postError || !post) {
      console.error(`✗ No se pudo crear "${pub.title}": ${postError?.message}`);
      continue;
    }

    console.log(`${pub.title} (${pub.categorySlug}):`);
    let sortOrder = 0;
    for (const fileName of pub.files) {
      try {
        const storagePath = await uploadToShowcase(fileName);
        const { error: imgError } = await supabase.from("showcase_post_images").insert({
          showcase_post_id: post.id,
          storage_path: storagePath,
          sort_order: sortOrder++,
        });
        if (imgError) throw new Error(imgError.message);
        console.log(`  ✓ ${fileName} → ${storagePath}`);
      } catch (err) {
        console.error(`  ✗ ${fileName}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  console.log("Listo.");
}

run();

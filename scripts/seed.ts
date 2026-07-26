// Migración única del catálogo/banners hardcodeados del sitio viejo a Supabase.
// Corre una sola vez contra un proyecto recién migrado (usa la service_role key).
//
//   npx tsx scripts/seed.ts
//
// Lee las imágenes/videos desde public/imagenes y public/videos (ya están ahí
// porque legacy-site/ + public/ vinieron de la migración a Next.js).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
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

const PUBLIC_DIR = join(process.cwd(), "public");

interface SeedProduct {
  imagenes: string[];
  nombre: string;
  categoria: "lamparas" | "hogar" | "pasteleria";
  descripcion: string;
  oferta: boolean;
  precioOriginal: number;
  precioOferta?: number;
}

// Copiado de legacy-site/js/productos.js (catalogoLUMO) — fuente original.
const PRODUCTOS: SeedProduct[] = [
  {
    imagenes: ["lampara-dahlia-amarilla.jpg"],
    nombre: "Lámpara Dahlia",
    categoria: "lamparas",
    descripcion:
      "Diseño orgánico y moderno que crea una atmósfera cálida y acogedora en cualquier espacio. Diseño escultural de 25 cm.",
    oferta: false,
    precioOriginal: 1190.0,
  },
  {
    imagenes: ["lampara-dahlia-naranja.jpg"],
    nombre: "Lámpara Dahlia (Naranja)",
    categoria: "lamparas",
    descripcion:
      "La lámpara Dahlia en un vibrante color naranja para un look más atrevido. Diseño escultural de 25 cm.",
    oferta: false,
    precioOriginal: 1190.0,
  },
  {
    imagenes: ["percheros-cactus.jpg"],
    nombre: "Percheros Cactus",
    categoria: "hogar",
    descripcion:
      "Set de 3 percheros decorativos y funcionales. Ideales para dar un toque divertido a tus paredes.",
    oferta: false,
    precioOriginal: 990.0,
  },
  {
    imagenes: ["cierre0.jpg", "cierre.jpg"],
    nombre: "Set de clips para cerrar bolsas",
    categoria: "hogar",
    descripcion:
      "Prácticos clips en forma de hoja son perfectos para mantener tus bolsas cerradas y tus alimentos frescos. Incluye una maceta para guardarlos y que decoren tu espacio como una pequeña planta.",
    oferta: true,
    precioOriginal: 220.0,
    precioOferta: 190.0,
  },
  {
    imagenes: ["moldes-galletas.jpg"],
    nombre: "Moldes para Galletas",
    categoria: "pasteleria",
    descripcion:
      "Set de moldes con formas personalizadas. Fabricados con material de grado alimenticio.",
    oferta: false,
    precioOriginal: 210.0,
  },
  {
    imagenes: ["lampara-dahlia-gris.jpg"],
    nombre: "Lámpara Dahlia (Gris)",
    categoria: "lamparas",
    descripcion:
      "Versión en gris elegante y minimalista, perfecta para ambientes sobrios y contemporáneos. Diseño escultural de 25 cm.",
    oferta: false,
    precioOriginal: 1190.0,
  },
  {
    imagenes: ["lampara-aloe-blanco.jpg"],
    nombre: "Lámpara Aloe (Blanco y Lila)",
    categoria: "lamparas",
    descripcion:
      "Su textura vertical y base de color vibrante la convierten en una pieza de arte única. Diseño escultural de 25 cm.",
    oferta: false,
    precioOriginal: 1190.0,
  },
];

const HERO_VIDEOS = ["banner-video.mp4", "banner-video3.mp4", "banner-video2.mp4"];
const POSTER = "portada.jpg";
const LOGO = "logo-lumo.png";

function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

async function uploadOnce(bucket: string, localSubdir: string, filename: string): Promise<string> {
  const storagePath = filename;
  const { data: existing } = await supabase.storage.from(bucket).list("", { search: filename });
  if (existing?.some((f) => f.name === filename)) {
    console.log(`  ya existe en ${bucket}/${filename}, no se resube`);
    return storagePath;
  }

  const bytes = readFileSync(join(PUBLIC_DIR, localSubdir, filename));
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, { contentType: contentTypeFor(filename), upsert: false });
  if (error) throw new Error(`Subiendo ${bucket}/${filename}: ${error.message}`);
  console.log(`  subido ${bucket}/${filename}`);
  return storagePath;
}

async function main() {
  console.log("== Categorías ==");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug");
  if (catError) throw catError;
  const categoryIdBySlug = new Map((categories ?? []).map((c) => [c.slug, c.id as string]));
  console.log(`  ${categoryIdBySlug.size} categorías encontradas`);

  console.log("== Productos ==");
  for (const producto of PRODUCTOS) {
    const slug = slugify(producto.nombre);

    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingProduct) {
      console.log(`- ${producto.nombre}: ya existe, se omite`);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("products")
      .insert({
        name: producto.nombre,
        slug,
        description: producto.descripcion,
        price_original: producto.precioOriginal,
        price_offer: producto.precioOferta ?? null,
        is_offer: producto.oferta,
        status: "published",
      })
      .select("id")
      .single();
    if (insertError || !inserted) throw insertError ?? new Error("insert producto falló");

    const categoryId = categoryIdBySlug.get(producto.categoria);
    if (categoryId) {
      await supabase
        .from("product_categories")
        .insert({ product_id: inserted.id, category_id: categoryId, sort_order: 0 });
    }

    let sortOrder = 0;
    for (const imagen of producto.imagenes) {
      const storagePath = await uploadOnce("products", "imagenes", imagen);
      await supabase.from("product_images").insert({
        product_id: inserted.id,
        storage_path: storagePath,
        sort_order: sortOrder++,
      });
    }

    console.log(`- ${producto.nombre}: creado (${producto.imagenes.length} foto/s)`);
  }

  console.log("== Banners (hero videos) ==");
  const posterPath = await uploadOnce("banners", "imagenes", POSTER);
  let bannerSort = 0;
  for (const video of HERO_VIDEOS) {
    const { data: existingBanner } = await supabase
      .from("banners")
      .select("id")
      .eq("storage_path", video)
      .maybeSingle();
    if (existingBanner) {
      console.log(`- ${video}: ya existe, se omite`);
      bannerSort++;
      continue;
    }

    const storagePath = await uploadOnce("banners", "videos", video);
    await supabase.from("banners").insert({
      media_type: "video",
      storage_path: storagePath,
      poster_storage_path: posterPath,
      cta_text: "Cotiza tu Proyecto",
      is_active: true,
      sort_order: bannerSort++,
    });
    console.log(`- ${video}: creado`);
  }

  console.log("== Logo ==");
  const logoPath = await uploadOnce("branding", "imagenes", LOGO);
  await supabase
    .from("settings")
    .upsert({ key: "quote_logo_path", value: logoPath }, { onConflict: "key" });
  console.log(`  settings.quote_logo_path = ${logoPath}`);

  console.log("\nListo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

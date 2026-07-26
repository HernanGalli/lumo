"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { SETTINGS_FIELDS } from "@/lib/settings";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  const rows = SETTINGS_FIELDS.map((field) => {
    const raw = formData.get(field.key);
    if (field.type === "number") {
      const value = z.coerce.number().min(0).max(1_000_000).parse(raw ?? 0);
      return { key: field.key, value };
    }
    const value = z.string().max(4000).parse(raw ?? "");
    return { key: field.key, value };
  });

  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/calculadora");
}

const photoSettingsSchema = z.object({
  fotoFiltroActivo: z.coerce.boolean(),
  fotoFiltroIntensidad: z.enum(["suave", "medio", "fuerte"]),
  fotoAnchoMaximoPx: z.coerce.number().int().min(200).max(4000),
  fotoCalidadWebp: z.coerce.number().int().min(1).max(100),
});

// Separado de updateSettings a propósito: estas 4 claves no encajan en el
// loop genérico de SETTINGS_FIELDS (number/text/textarea) — necesitan
// switch/select/slider (ver components/admin/PhotoSettingsForm.tsx).
export async function updatePhotoSettings(formData: FormData) {
  const supabase = await createClient();
  const parsed = photoSettingsSchema.parse({
    fotoFiltroActivo: formData.get("fotoFiltroActivo") === "on",
    fotoFiltroIntensidad: formData.get("fotoFiltroIntensidad"),
    fotoAnchoMaximoPx: formData.get("fotoAnchoMaximoPx"),
    fotoCalidadWebp: formData.get("fotoCalidadWebp"),
  });

  const { error } = await supabase.from("settings").upsert(
    [
      { key: "foto_filtro_activo", value: parsed.fotoFiltroActivo },
      { key: "foto_filtro_intensidad", value: parsed.fotoFiltroIntensidad },
      { key: "foto_ancho_maximo_px", value: parsed.fotoAnchoMaximoPx },
      { key: "foto_calidad_webp", value: parsed.fotoCalidadWebp },
    ],
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}

const welcomeModalSchema = z.object({
  enabled: z.coerce.boolean(),
  imagePath: z.string().trim().max(500).optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().min(1).max(400),
  buttonText: z.string().trim().min(1).max(60),
  buttonLink: z.string().trim().min(1).max(500),
});

// Separado de updateSettings a propósito, mismo criterio que
// updatePhotoSettings: necesita el selector de imágenes (MediaPicker) y un
// switch, no encaja en el loop genérico de SETTINGS_FIELDS. La imagen se
// recibe como storage_path (bucket "banners", vía MediaPicker +
// copyMediaAssetToBucket) y se resuelve a URL pública acá, para guardar la
// URL final en settings.welcome_modal_image_url tal como pide el spec.
export async function updateWelcomeModalSettings(formData: FormData) {
  const supabase = await createClient();
  const parsed = welcomeModalSchema.parse({
    enabled: formData.get("enabled") === "on",
    imagePath: formData.get("imagePath") || "",
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    buttonText: formData.get("buttonText"),
    buttonLink: formData.get("buttonLink"),
  });

  // imagePath solo llega si el admin eligió una imagen NUEVA en este envío
  // (ver WelcomeModalSettingsForm) — si no, se deja welcome_modal_image_url
  // como está, para no perder la imagen ya guardada solo por tocar el
  // resto del formulario.
  const rows: { key: string; value: unknown }[] = [
    { key: "welcome_modal_enabled", value: parsed.enabled },
    { key: "welcome_modal_title", value: parsed.title },
    { key: "welcome_modal_subtitle", value: parsed.subtitle },
    { key: "welcome_modal_button_text", value: parsed.buttonText },
    { key: "welcome_modal_button_link", value: parsed.buttonLink },
  ];
  if (parsed.imagePath) {
    rows.push({ key: "welcome_modal_image_url", value: getPublicUrl(supabase, "banners", parsed.imagePath) ?? "" });
  }

  const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}

const tierRuleSchema = z.object({
  minQty: z.coerce.number().int().min(1),
  maxQty: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  adjustmentPct: z.coerce.number().min(-100).max(1000),
});

function parseTierRuleForm(formData: FormData) {
  const parsed = tierRuleSchema.parse({
    minQty: formData.get("minQty"),
    maxQty: formData.get("maxQty") || undefined,
    adjustmentPct: formData.get("adjustmentPct"),
  });
  return {
    min_qty: parsed.minQty,
    max_qty: parsed.maxQty === "" || parsed.maxQty === undefined ? null : Number(parsed.maxQty),
    adjustment_pct: parsed.adjustmentPct,
  };
}

export async function createTierRule(formData: FormData) {
  const supabase = await createClient();
  const rule = parseTierRuleForm(formData);

  const { error } = await supabase
    .from("price_tier_rules")
    .insert({ ...rule, is_default: true, sort_order: rule.min_qty });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

export async function updateTierRule(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));
  const rule = parseTierRuleForm(formData);

  const { error } = await supabase
    .from("price_tier_rules")
    .update({ ...rule, sort_order: rule.min_qty })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

export async function deleteTierRule(formData: FormData) {
  const supabase = await createClient();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase.from("price_tier_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/presupuestos");
}

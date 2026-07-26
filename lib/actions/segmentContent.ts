"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const segmentContentSchema = z.object({
  segment: z.enum(["empresa", "emprendimiento", "escuela", "evento_social", "grupo"]),
  heroTitle: z.string().trim().min(1).max(200),
  heroSubtitle: z.string().trim().min(1).max(500),
  pilar1Titulo: z.string().trim().min(1).max(100),
  pilar1Texto: z.string().trim().min(1).max(400),
  pilar2Titulo: z.string().trim().min(1).max(100),
  pilar2Texto: z.string().trim().min(1).max(400),
  pilar3Titulo: z.string().trim().min(1).max(100),
  pilar3Texto: z.string().trim().min(1).max(400),
  pilar4Titulo: z.string().trim().min(1).max(100),
  pilar4Texto: z.string().trim().min(1).max(400),
  whatsappMessage: z.string().trim().min(1).max(400),
});

// Mismo patrón que lib/actions/settings.ts::updateSettings — upsert por
// clave (acá, por segmento), editable desde /admin/segmentos sin tocar
// código ni redeployar.
export async function updateSegmentContent(formData: FormData) {
  const supabase = await createClient();
  const parsed = segmentContentSchema.parse({
    segment: formData.get("segment"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    pilar1Titulo: formData.get("pilar1Titulo"),
    pilar1Texto: formData.get("pilar1Texto"),
    pilar2Titulo: formData.get("pilar2Titulo"),
    pilar2Texto: formData.get("pilar2Texto"),
    pilar3Titulo: formData.get("pilar3Titulo"),
    pilar3Texto: formData.get("pilar3Texto"),
    pilar4Titulo: formData.get("pilar4Titulo"),
    pilar4Texto: formData.get("pilar4Texto"),
    whatsappMessage: formData.get("whatsappMessage"),
  });

  const { error } = await supabase
    .from("segment_content")
    .upsert(
      {
        segment: parsed.segment,
        hero_title: parsed.heroTitle,
        hero_subtitle: parsed.heroSubtitle,
        pilar_1_titulo: parsed.pilar1Titulo,
        pilar_1_texto: parsed.pilar1Texto,
        pilar_2_titulo: parsed.pilar2Titulo,
        pilar_2_texto: parsed.pilar2Texto,
        pilar_3_titulo: parsed.pilar3Titulo,
        pilar_3_texto: parsed.pilar3Texto,
        pilar_4_titulo: parsed.pilar4Titulo,
        pilar_4_texto: parsed.pilar4Texto,
        whatsapp_message: parsed.whatsappMessage,
      },
      { onConflict: "segment" }
    );
  if (error) throw new Error(error.message);

  revalidatePath("/admin/segmentos");
  revalidatePath("/llaveros");
  revalidatePath(`/llaveros/${segmentSlugFromDbValue(parsed.segment)}`);
  if (parsed.segment === "empresa") revalidatePath("/empresas");
}

function segmentSlugFromDbValue(dbValue: string): string {
  const map: Record<string, string> = {
    empresa: "empresas",
    emprendimiento: "emprendimientos",
    escuela: "escuelas",
    evento_social: "eventos-sociales",
    grupo: "grupos",
  };
  return map[dbValue] ?? dbValue;
}

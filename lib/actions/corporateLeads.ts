"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGmailConnected, sendGmailMessage } from "@/lib/gmail/client";
import { notifyOwner } from "@/lib/notifications/ownerAlert";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  merchandising: "Merchandising & Onboarding",
  presencia_marca: "Presencia de Marca",
  premios: "Premios & Reconocimientos",
  prototipado: "Prototipado Técnico",
};

const DESIGN_STATUS_LABELS: Record<string, string> = {
  tiene_logo_vectorial: "Tiene logo vectorial",
  tiene_stl_step: "Tiene archivo .STL o .STEP",
  requiere_modelado: "Requiere modelado desde cero",
};

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf", "stl", "step", "stp", "zip"];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB, archivos CAD pueden pesar

const SEGMENTS_ENUM = ["empresa", "emprendimiento", "escuela", "evento_social", "grupo"] as const;

// project_type/volume_range/design_status son del wizard propio de
// "empresa" — los otros 4 segmentos usan extraFieldsJson (ver
// lib/segments.ts, formExtraFields) en su lugar. Se validan como
// obligatorios solo para segment==="empresa" vía superRefine, reflejando el
// mismo constraint condicional agregado en 0007_multisegmento.sql.
const leadSchema = z
  .object({
    segment: z.enum(SEGMENTS_ENUM),
    projectType: z.enum(["merchandising", "presencia_marca", "premios", "prototipado"]).optional(),
    volumeRange: z.enum(["10-50", "50-200", "200+"]).optional(),
    designStatus: z
      .enum(["tiene_logo_vectorial", "tiene_stl_step", "requiere_modelado"])
      .optional(),
    extraFieldsJson: z.string().max(4000).optional().or(z.literal("")),
    companyName: z.string().trim().max(200).optional().or(z.literal("")),
    contactName: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.segment === "empresa") {
      if (!data.projectType) ctx.addIssue({ code: "custom", path: ["projectType"], message: "Requerido" });
      if (!data.volumeRange) ctx.addIssue({ code: "custom", path: ["volumeRange"], message: "Requerido" });
      if (!data.designStatus) ctx.addIssue({ code: "custom", path: ["designStatus"], message: "Requerido" });
    }
  });

function parseExtraFields(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) result[key] = value.trim().slice(0, 500);
    }
    return result;
  } catch {
    return {};
  }
}

async function uploadReferenceFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Tipo de archivo no permitido (.${ext}). Usá: ${ALLOWED_EXTENSIONS.join(", ")}.`
    );
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo debe pesar menos de 20MB.");
  }

  const path = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("leads")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  return path;
}

export async function submitCorporateLead(formData: FormData) {
  const parsed = leadSchema.safeParse({
    segment: formData.get("segment") || "empresa",
    projectType: formData.get("projectType") || undefined,
    volumeRange: formData.get("volumeRange") || undefined,
    designStatus: formData.get("designStatus") || undefined,
    extraFieldsJson: formData.get("extraFieldsJson") || "",
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Revisá los datos del formulario." };
  }

  const supabase = await createClient();
  const extraFields = parseExtraFields(parsed.data.extraFieldsJson);

  let referenceFilePath: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      referenceFilePath = await uploadReferenceFile(supabase, file);
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "No se pudo subir el archivo.",
      };
    }
  }

  const { error } = await supabase.from("corporate_leads").insert({
    segment: parsed.data.segment,
    project_type: parsed.data.projectType ?? null,
    volume_range: parsed.data.volumeRange ?? null,
    design_status: parsed.data.designStatus ?? null,
    extra_fields: extraFields,
    reference_file_path: referenceFilePath,
    company_name: parsed.data.companyName || null,
    contact_name: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
  });

  if (error) {
    console.error("No se pudo guardar el lead corporativo:", error);
    return { ok: false as const, error: "No se pudo enviar. Probá de nuevo en un rato." };
  }

  await sendCorporateAutoReply(parsed.data.email);

  const extraFieldsText = Object.entries(extraFields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  await notifyOwner({
    subject: `Nuevo lead (${parsed.data.segment}) — ${parsed.data.companyName || parsed.data.contactName}`,
    textBody:
      `Entró un lead nuevo desde /llaveros/${parsed.data.segment}.\n\n` +
      `Segmento: ${parsed.data.segment}\n` +
      `Empresa / Grupo: ${parsed.data.companyName || "—"}\n` +
      `Contacto: ${parsed.data.contactName}\n` +
      `Email: ${parsed.data.email}\n` +
      `Teléfono: ${parsed.data.phone || "—"}\n` +
      (parsed.data.segment === "empresa"
        ? `Tipo de proyecto: ${PROJECT_TYPE_LABELS[parsed.data.projectType!] ?? parsed.data.projectType}\n` +
          `Volumen: ${parsed.data.volumeRange} unidades\n` +
          `Estado del diseño: ${DESIGN_STATUS_LABELS[parsed.data.designStatus!] ?? parsed.data.designStatus}\n`
        : extraFieldsText
          ? `${extraFieldsText}\n`
          : "") +
      `Archivo de referencia: ${referenceFilePath ? "sí, adjuntó uno" : "no adjuntó"}\n\n` +
      `Vas a los detalles en /admin/leads.`,
  });

  return { ok: true as const };
}

async function sendCorporateAutoReply(toEmail: string) {
  try {
    const { connected } = await isGmailConnected();
    if (!connected) return;

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_reply_empresa")
      .maybeSingle();
    const replyText = typeof data?.value === "string" ? data.value : "";
    if (!replyText) return;

    await sendGmailMessage({
      to: toEmail,
      subject: "Recibimos tu consulta — LUMO Empresas",
      textBody: replyText,
    });
  } catch (error) {
    console.error("No se pudo enviar la auto-respuesta corporativa:", error);
  }
}

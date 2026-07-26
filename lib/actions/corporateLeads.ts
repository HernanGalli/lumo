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

const leadSchema = z.object({
  projectType: z.enum(["merchandising", "presencia_marca", "premios", "prototipado"]),
  volumeRange: z.enum(["10-50", "50-200", "200+"]),
  designStatus: z.enum(["tiene_logo_vectorial", "tiene_stl_step", "requiere_modelado"]),
  companyName: z.string().trim().max(200).optional().or(z.literal("")),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
});

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
    projectType: formData.get("projectType"),
    volumeRange: formData.get("volumeRange"),
    designStatus: formData.get("designStatus"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Revisá los datos del formulario." };
  }

  const supabase = await createClient();

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
    project_type: parsed.data.projectType,
    volume_range: parsed.data.volumeRange,
    design_status: parsed.data.designStatus,
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
  await notifyOwner({
    subject: `Nuevo lead — ${parsed.data.companyName || parsed.data.contactName}`,
    textBody:
      `Entró un lead nuevo desde /empresas.\n\n` +
      `Empresa / Grupo: ${parsed.data.companyName || "—"}\n` +
      `Contacto: ${parsed.data.contactName}\n` +
      `Email: ${parsed.data.email}\n` +
      `Teléfono: ${parsed.data.phone || "—"}\n` +
      `Tipo de proyecto: ${PROJECT_TYPE_LABELS[parsed.data.projectType] ?? parsed.data.projectType}\n` +
      `Volumen: ${parsed.data.volumeRange} unidades\n` +
      `Estado del diseño: ${DESIGN_STATUS_LABELS[parsed.data.designStatus] ?? parsed.data.designStatus}\n` +
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

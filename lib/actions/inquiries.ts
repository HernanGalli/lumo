"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGmailConnected, sendGmailMessage } from "@/lib/gmail/client";
import { notifyOwner } from "@/lib/notifications/ownerAlert";

const inquirySchema = z.object({
  formType: z.enum(["producto", "contacto"]),
  productName: z.string().trim().max(200).optional().or(z.literal("")),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function submitInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    formType: formData.get("formType"),
    productName: formData.get("producto") || "",
    name: formData.get("nombre"),
    email: formData.get("email"),
    phone: formData.get("telefono") || "",
    message: formData.get("mensaje") || "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Revisá los datos del formulario." };
  }

  // Cliente público (anon key): la tabla inquiries tiene policy de insert
  // abierta a anon y de lectura restringida al admin (ver migración RLS).
  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    form_type: parsed.data.formType,
    product_name: parsed.data.productName || null,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    message: parsed.data.message || null,
  });

  if (error) {
    return { ok: false as const, error: "No se pudo enviar. Probá de nuevo en un rato." };
  }

  await sendAutoReply(parsed.data.email);
  await notifyOwner({
    subject: `Nueva consulta — ${parsed.data.name}`,
    textBody:
      `Entró una consulta nueva del sitio (${parsed.data.formType === "producto" ? "interés en producto" : "contacto general"}).\n\n` +
      `Nombre: ${parsed.data.name}\n` +
      `Email: ${parsed.data.email}\n` +
      `Teléfono: ${parsed.data.phone || "—"}\n` +
      (parsed.data.productName ? `Producto: ${parsed.data.productName}\n` : "") +
      `Mensaje: ${parsed.data.message || "—"}\n`,
  });

  return { ok: true as const };
}

// La auto-respuesta es un extra de cortesía: si Gmail no está conectado o el
// envío falla, no debe romper la confirmación que ya vio el usuario.
async function sendAutoReply(toEmail: string) {
  try {
    const { connected } = await isGmailConnected();
    if (!connected) return;

    // settings es privada (sin policy anon): esta lectura interna necesita
    // el cliente con service-role, no el cliente público de la request.
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "email_reply_general")
      .maybeSingle();
    const replyText = typeof data?.value === "string" ? data.value : "";
    if (!replyText) return;

    await sendGmailMessage({
      to: toEmail,
      subject: "Recibimos tu consulta — LUMO",
      textBody: replyText,
    });
  } catch (error) {
    console.error("No se pudo enviar la auto-respuesta:", error);
  }
}

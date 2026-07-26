"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  return { ok: true as const };
}

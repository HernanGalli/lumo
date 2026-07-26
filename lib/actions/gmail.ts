"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { disconnectGmail, sendGmailMessage } from "@/lib/gmail/client";
import { generateQuotePdfBuffer } from "@/lib/pdf/generateQuotePdf";
import type { QuotePdfData } from "@/lib/pdf/quoteTemplate";
import { getPublicUrl } from "@/lib/supabase/storage";

export async function disconnectGmailAction() {
  await disconnectGmail();
  revalidatePath("/admin/configuracion");
}

const sendQuoteEmailSchema = z.object({
  quoteId: z.string().uuid(),
  toEmail: z.string().trim().email(),
});

export async function sendQuoteEmail(formData: FormData) {
  const supabase = await createClient();
  const { quoteId, toEmail } = sendQuoteEmailSchema.parse({
    quoteId: formData.get("quoteId"),
    toEmail: formData.get("toEmail"),
  });

  const [{ data: quote }, { data: items }, { data: tiers }, { data: settingsRows }] =
    await Promise.all([
      supabase.from("quotes").select("*").eq("id", quoteId).single(),
      supabase
        .from("quote_items")
        .select("description, quantity, base_unit_price, sort_order")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("quote_price_tiers")
        .select("min_qty, max_qty, unit_price, sort_order")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true }),
      supabase.from("settings").select("key, value"),
    ]);

  if (!quote) throw new Error("Presupuesto no encontrado");

  const settings = settingsRowsToMap(settingsRows ?? []);

  const pdfData: QuotePdfData = {
    quoteNumber: quote.quote_number,
    clientName: quote.client_name,
    clientContact: quote.client_contact,
    createdAt: new Date(quote.created_at).toLocaleDateString("es-UY"),
    validUntil: quote.valid_until,
    deliveryEstimateDate: quote.delivery_estimate_date,
    notes: quote.notes,
    items: (items ?? []).map((item) => ({
      description: item.description ?? "Ítem",
      quantity: item.quantity,
      basePrice: item.base_unit_price,
    })),
    tiers: (tiers ?? []).map((tier) => ({
      minQty: tier.min_qty,
      maxQty: tier.max_qty,
      unitPrice: tier.unit_price,
    })),
    legalText: (settings.quote_legal_text as string) ?? "",
    paymentTerms: (settings.quote_payment_terms as string) ?? "",
    leadTimeText: (settings.quote_lead_time_text as string) ?? "",
    logoUrl: getPublicUrl(supabase, "branding", (settings.quote_logo_path as string) ?? null),
    ivaPct: Number(settings.iva_pct ?? 0),
    companyRut: (settings.company_rut as string) ?? "",
    companyAddress: (settings.company_address as string) ?? "",
    companyPhone: (settings.company_phone as string) ?? "",
  };

  const pdfBuffer = await generateQuotePdfBuffer(pdfData);
  const subject = `Presupuesto LUMO ${quote.quote_number ?? ""}`.trim();
  const textBody =
    `Hola ${quote.client_name},\n\n` +
    `Te adjuntamos el presupuesto ${quote.quote_number ?? ""} solicitado.\n\n` +
    `Cualquier consulta, respondé este mismo mail.\n\n` +
    `Saludos,\nLUMO`;

  let status: "sent" | "failed" = "sent";
  try {
    await sendGmailMessage({
      to: toEmail,
      subject,
      textBody,
      attachment: {
        filename: `presupuesto-${quote.quote_number ?? quoteId}.pdf`,
        contentType: "application/pdf",
        data: pdfBuffer,
      },
    });
  } catch (error) {
    status = "failed";
    await supabase.from("email_log").insert({
      quote_id: quoteId,
      to_email: toEmail,
      subject,
      status,
    });
    throw error;
  }

  await supabase.from("email_log").insert({
    quote_id: quoteId,
    to_email: toEmail,
    subject,
    status,
  });

  revalidatePath(`/admin/presupuestos/${quoteId}`);
}

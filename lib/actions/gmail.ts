"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { settingsRowsToMap } from "@/lib/settings";
import { disconnectGmail, sendGmailMessage } from "@/lib/gmail/client";
import { generateQuotePdfBuffer } from "@/lib/pdf/generateQuotePdf";
import { buildQuotePdfData } from "@/lib/pdf/buildQuoteData";
import { getPublicUrl, toPdfSafePath } from "@/lib/supabase/storage";

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
        .select("id, description, quantity, base_unit_price, item_type, sort_order")
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

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: itemCosts } = itemIds.length
    ? await supabase.from("quote_item_costs").select("quote_item_id, concept, amount, show_in_pdf").in("quote_item_id", itemIds)
    : { data: [] };

  const settings = settingsRowsToMap(settingsRows ?? []);

  const pdfData = buildQuotePdfData({
    quote,
    items: items ?? [],
    tiers: tiers ?? [],
    itemCosts: itemCosts ?? [],
    settings,
    logoUrl: getPublicUrl(
      supabase,
      "branding",
      toPdfSafePath((settings.quote_logo_path as string) ?? null)
    ),
  });

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

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGmailConnected, sendGmailMessage } from "@/lib/gmail/client";

// Avisa al dueño del negocio (mail configurable en Configuración) cuando
// entra actividad de clientes: leads corporativos y consultas generales. Es
// un extra de cortesía igual que la auto-respuesta — si Gmail no está
// conectado o falla el envío, no debe romper el flujo que ya vio el visitante.
export async function notifyOwner({
  subject,
  textBody,
}: {
  subject: string;
  textBody: string;
}): Promise<void> {
  try {
    const { connected } = await isGmailConnected();
    if (!connected) return;

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "owner_notification_email")
      .maybeSingle();
    const ownerEmail = typeof data?.value === "string" ? data.value : "";
    if (!ownerEmail) return;

    await sendGmailMessage({ to: ownerEmail, subject, textBody });
  } catch (error) {
    console.error("No se pudo notificar al dueño:", error);
  }
}

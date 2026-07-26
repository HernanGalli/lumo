import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGmailConnected, sendGmailMessage } from "@/lib/gmail/client";

function topN(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function formatList(rows: [string, number][]): string {
  if (rows.length === 0) return "  (sin datos)";
  return rows.map(([key, count]) => `  ${count.toString().padStart(4)}  ${key}`).join("\n");
}

export async function GET(request: Request) {
  // Vercel manda este header con CRON_SECRET automáticamente en sus cron
  // jobs — así nadie más puede disparar el reporte pegándole a la URL.
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: views }, { data: clicks }, { data: settingsRow }] = await Promise.all([
    supabase.from("page_views").select("path").gte("created_at", since),
    supabase.from("click_events").select("event_name, detail").gte("created_at", since),
    supabase.from("settings").select("value").eq("key", "owner_notification_email").maybeSingle(),
  ]);

  const viewsByPath = new Map<string, number>();
  for (const row of views ?? []) {
    viewsByPath.set(row.path, (viewsByPath.get(row.path) ?? 0) + 1);
  }

  const clicksByEvent = new Map<string, number>();
  for (const row of clicks ?? []) {
    const key = row.detail ? `${row.event_name} — ${row.detail}` : row.event_name;
    clicksByEvent.set(key, (clicksByEvent.get(key) ?? 0) + 1);
  }

  const totalViews = views?.length ?? 0;
  const totalClicks = clicks?.length ?? 0;

  const body =
    `Reporte semanal de LUMO — últimos 7 días\n` +
    `${new Date(since).toLocaleDateString("es-UY")} a ${new Date().toLocaleDateString("es-UY")}\n\n` +
    `Vistas totales: ${totalViews}\n` +
    `Clicks totales: ${totalClicks}\n\n` +
    `Páginas más vistas:\n${formatList(topN(viewsByPath, 10))}\n\n` +
    `Clicks de conversión:\n${formatList(topN(clicksByEvent, 10))}\n`;

  const ownerEmail = typeof settingsRow?.value === "string" ? settingsRow.value : "";
  const { connected } = await isGmailConnected();

  let emailStatus: "sent" | "skipped" | "failed" = "skipped";
  if (connected && ownerEmail) {
    try {
      await sendGmailMessage({
        to: ownerEmail,
        subject: "Reporte semanal — LUMO",
        textBody: body,
      });
      emailStatus = "sent";
      await supabase.from("email_log").insert({
        to_email: ownerEmail,
        subject: "Reporte semanal — LUMO",
        status: "sent",
      });
    } catch (error) {
      emailStatus = "failed";
      await supabase.from("email_log").insert({
        to_email: ownerEmail,
        subject: "Reporte semanal — LUMO",
        status: "failed",
      });
      console.error("No se pudo enviar el reporte semanal:", error);
    }
  }

  return NextResponse.json({ ok: true, totalViews, totalClicks, emailStatus });
}

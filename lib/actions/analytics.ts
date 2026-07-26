"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Tracking liviano y anónimo: solo path/evento, nunca IP ni identificadores
// de sesión. Falla en silencio a propósito — nunca debe romper la
// navegación real de un visitante por un error de analytics.

const pageViewSchema = z.object({
  path: z.string().trim().min(1).max(300),
  referrer: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function trackPageView(path: string, referrer?: string) {
  try {
    const parsed = pageViewSchema.parse({ path, referrer: referrer || "" });
    const supabase = await createClient();
    await supabase
      .from("page_views")
      .insert({ path: parsed.path, referrer: parsed.referrer || null });
  } catch {
    // silencioso a propósito
  }
}

const clickSchema = z.object({
  eventName: z.string().trim().min(1).max(100),
  path: z.string().trim().min(1).max(300),
  detail: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function trackClick(eventName: string, path: string, detail?: string) {
  try {
    const parsed = clickSchema.parse({ eventName, path, detail: detail || "" });
    const supabase = await createClient();
    await supabase.from("click_events").insert({
      event_name: parsed.eventName,
      path: parsed.path,
      detail: parsed.detail || null,
    });
  } catch {
    // silencioso a propósito
  }
}

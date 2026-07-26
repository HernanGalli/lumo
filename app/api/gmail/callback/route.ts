import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveTokensFromCode } from "@/lib/gmail/client";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const configUrl = new URL("/admin/configuracion", request.url);

  if (!code) {
    configUrl.searchParams.set("gmail", "error");
    return NextResponse.redirect(configUrl);
  }

  try {
    const redirectUri = new URL("/api/gmail/callback", request.url).toString();
    await saveTokensFromCode(code, redirectUri);
    configUrl.searchParams.set("gmail", "connected");
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    configUrl.searchParams.set("gmail", "error");
  }

  return NextResponse.redirect(configUrl);
}

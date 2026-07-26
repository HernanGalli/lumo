import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/gmail/client";

export async function GET(request: Request) {
  const supabase = await createClient();

  // Fuera de /admin/*: el middleware no protege esta ruta.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const redirectUri = new URL("/api/gmail/callback", request.url).toString();
  const authUrl = getGoogleAuthUrl(redirectUri);

  return NextResponse.redirect(authUrl);
}

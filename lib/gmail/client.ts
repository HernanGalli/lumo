import "server-only";
import { OAuth2Client } from "google-auth-library";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "@/lib/gmail/crypto";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

function createOAuthClient(redirectUri: string) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export function getGoogleAuthUrl(redirectUri: string): string {
  const client = createOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SEND_SCOPE],
  });
}

export async function saveTokensFromCode(code: string, redirectUri: string) {
  const client = createOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token || !tokens.access_token) {
    throw new Error(
      "Google no devolvió un refresh_token. Revocá el acceso previo en " +
        "https://myaccount.google.com/permissions y volvé a intentar."
    );
  }

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = (await userInfoRes.json()) as { email?: string };

  const supabase = createAdminClient();
  await supabase.from("gmail_tokens").delete().not("id", "is", null);
  const { error } = await supabase.from("gmail_tokens").insert({
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token),
    expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    scope: tokens.scope ?? GMAIL_SEND_SCOPE,
    connected_email: userInfo.email ?? null,
  });
  if (error) throw new Error(error.message);
}

async function getValidAccessToken(): Promise<{ accessToken: string; fromEmail: string } | null> {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("gmail_tokens").select("*").maybeSingle();
  if (!row) return null;

  const isExpired = !row.expiry_date || new Date(row.expiry_date).getTime() < Date.now() + 60_000;
  if (!isExpired) {
    return { accessToken: decryptToken(row.access_token), fromEmail: row.connected_email ?? "" };
  }

  const client = createOAuthClient("");
  client.setCredentials({ refresh_token: decryptToken(row.refresh_token) });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) throw new Error("No se pudo renovar el token de Gmail");

  await supabase
    .from("gmail_tokens")
    .update({
      access_token: encryptToken(credentials.access_token),
      expiry_date: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
    })
    .eq("id", row.id);

  return { accessToken: credentials.access_token, fromEmail: row.connected_email ?? "" };
}

export async function isGmailConnected(): Promise<{ connected: boolean; email: string | null }> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("gmail_tokens").select("connected_email").maybeSingle();
  return { connected: !!data, email: data?.connected_email ?? null };
}

export async function disconnectGmail() {
  const supabase = createAdminClient();
  await supabase.from("gmail_tokens").delete().not("id", "is", null);
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

export async function sendGmailMessage({
  to,
  subject,
  textBody,
  attachment,
}: {
  to: string;
  subject: string;
  textBody: string;
  attachment?: { filename: string; contentType: string; data: Buffer };
}): Promise<void> {
  const auth = await getValidAccessToken();
  if (!auth) throw new Error("Gmail no está conectado");

  const boundary = `lumo_${Date.now()}`;
  const parts = [
    `From: LUMO <${auth.fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    textBody,
    "",
  ];

  if (attachment) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      attachment.data.toString("base64"),
      ""
    );
  }

  parts.push(`--${boundary}--`);

  const encodedMessage = Buffer.from(parts.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    throw new Error(`Gmail API error: ${res.status} ${await res.text()}`);
  }
}

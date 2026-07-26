import { Inter, Space_Grotesk } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicUrl } from "@/lib/supabase/storage";
import { settingsRowsToMap } from "@/lib/settings";
import { ModalProvider } from "@/components/public/modal-context";
import { Nav } from "@/components/public/Nav";
import { Footer } from "@/components/public/Footer";
import { WhatsAppBubble } from "@/components/public/WhatsAppBubble";
import { InquiryModal } from "@/components/public/InquiryModal";
import { WelcomeModal } from "@/components/public/WelcomeModal";
import { Analytics } from "@/components/public/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

// Tipografía de títulos: le da carácter propio a la marca en vez de que
// todo (cuerpo y títulos) sea la misma Inter.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // `settings` es privada por RLS (solo authenticated) — como el logo del
  // sitio público vive ahí (quote_logo_path), esta lectura puntual necesita
  // el cliente service-role para que un visitante anónimo la vea. Mismo
  // patrón que ya usa la auto-respuesta de Gmail (lib/gmail/client.ts).
  const supabaseAdmin = createAdminClient();
  const [{ data: settingsRows }, { data: segmentContentRows }] = await Promise.all([
    supabaseAdmin
      .from("settings")
      .select("key, value")
      .in("key", [
        "quote_logo_path",
        "welcome_modal_enabled",
        "welcome_modal_image_url",
        "welcome_modal_title",
        "welcome_modal_subtitle",
        "welcome_modal_button_text",
        "welcome_modal_button_link",
      ]),
    supabaseAdmin.from("segment_content").select("segment, whatsapp_message"),
  ]);
  const settings = settingsRowsToMap(settingsRows ?? []);
  const logoPath = (settings.quote_logo_path as string) || null;
  const logoUrl = getPublicUrl(supabaseAdmin, "branding", logoPath);
  const segmentMessages = Object.fromEntries(
    (segmentContentRows ?? []).map((row) => [row.segment, row.whatsapp_message])
  );

  // Apagado (o sin imagen configurada) → ni siquiera se monta el
  // componente, no solo se oculta con CSS.
  const welcomeModalImageUrl = (settings.welcome_modal_image_url as string) || "";
  const showWelcomeModal = settings.welcome_modal_enabled === true && Boolean(welcomeModalImageUrl);

  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable} sitio-publico`}>
      <ModalProvider>
        <Analytics />
        <Nav logoUrl={logoUrl} />
        <main>{children}</main>
        <Footer logoUrl={logoUrl} />
        <WhatsAppBubble segmentMessages={segmentMessages} />
        <InquiryModal />
        {showWelcomeModal && (
          <WelcomeModal
            content={{
              imageUrl: welcomeModalImageUrl,
              title: (settings.welcome_modal_title as string) ?? "",
              subtitle: (settings.welcome_modal_subtitle as string) ?? "",
              buttonText: (settings.welcome_modal_button_text as string) ?? "Cotizá tu llavero",
              buttonLink: (settings.welcome_modal_button_link as string) || "/llaveros",
            }}
          />
        )}
      </ModalProvider>
    </div>
  );
}

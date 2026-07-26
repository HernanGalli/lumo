import { Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { getPublicUrl } from "@/lib/supabase/storage";
import { settingsRowsToMap } from "@/lib/settings";
import { ModalProvider } from "@/components/public/modal-context";
import { Nav } from "@/components/public/Nav";
import { Footer } from "@/components/public/Footer";
import { WhatsAppBubble } from "@/components/public/WhatsAppBubble";
import { ContactModal } from "@/components/public/ContactModal";
import { ProductInquiryModal } from "@/components/public/ProductInquiryModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .eq("key", "quote_logo_path");
  const settings = settingsRowsToMap(settingsRows ?? []);
  const logoPath = (settings.quote_logo_path as string) || null;
  const logoUrl = getPublicUrl(supabase, "branding", logoPath);

  return (
    <div className={`${inter.variable} sitio-publico`}>
      <ModalProvider>
        <Nav logoUrl={logoUrl} />
        <main>{children}</main>
        <Footer logoUrl={logoUrl} />
        <WhatsAppBubble />
        <ContactModal />
        <ProductInquiryModal />
      </ModalProvider>
    </div>
  );
}

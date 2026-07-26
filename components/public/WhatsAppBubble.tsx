"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "59898753757";
const DEFAULT_MESSAGE = "Hola! Quiero consultar por...";
const CORPORATE_MESSAGE =
  "Hola LUMO, me interesa solicitar un presupuesto o kit de muestras para mi empresa...";

export function WhatsAppBubble() {
  const pathname = usePathname();
  const message = pathname?.startsWith("/empresas") ? CORPORATE_MESSAGE : DEFAULT_MESSAGE;
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.92L2.05 22l5.31-1.35a9.87 9.87 0 0 0 4.68 1.19h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.47 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.37-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98s.73-2.11 1-2.4c.26-.29.56-.36.75-.36h.53c.17 0 .4-.02.62.48.24.55.8 1.9.87 2.04.07.14.12.3.02.49-.1.19-.15.31-.29.47-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.07.17-.21.72-.83.91-1.12.19-.29.38-.24.63-.14.26.1 1.6.76 1.88.9.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" />
      </svg>
    </a>
  );
}

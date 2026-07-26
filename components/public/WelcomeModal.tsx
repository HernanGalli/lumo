"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/public/Modal";
import { trackClick } from "@/lib/actions/analytics";

const STORAGE_KEY = "lumo_welcome_modal_last_shown";
const DAYS_BETWEEN_SHOWS = 7;
const SHOW_DELAY_MS = 1200;

export interface WelcomeModalContent {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

// Aparece una sola vez por visitante cada DAYS_BETWEEN_SHOWS días (vía
// localStorage) — no en cada página que visite dentro de la misma visita,
// ya que la marca de tiempo queda fresca apenas se muestra una vez. Se
// monta condicionalmente desde el layout público (nunca dentro de /admin,
// y nunca si welcome_modal_enabled está apagado — ver
// app/(public)/layout.tsx, donde ni siquiera se renderiza este componente
// en esos casos).
export function WelcomeModal({ content }: { content: WelcomeModalContent }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!content.imageUrl) return; // sin imagen cargada, no hay nada que mostrar

    const last = window.localStorage.getItem(STORAGE_KEY);
    if (last) {
      const elapsedDays = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
      if (elapsedDays < DAYS_BETWEEN_SHOWS) return;
    }

    const timer = setTimeout(() => {
      setOpen(true);
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // Solo depende de imageUrl a propósito (no de pathname): se evalúa una
    // vez por carga de la visita, no en cada navegación interna.
  }, [content.imageUrl]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={content.title}>
      <div className="welcome-modal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.imageUrl} alt="" className="welcome-modal__imagen" />
        <p className="welcome-modal__subtitulo">{content.subtitle}</p>
        <a
          href={content.buttonLink}
          className="boton"
          onClick={() => trackClick("welcome_modal", pathname ?? "/", content.buttonText)}
        >
          {content.buttonText}
        </a>
      </div>
    </Modal>
  );
}

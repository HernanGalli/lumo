"use client";

import { useState, type FormEvent } from "react";
import { useModal } from "@/components/public/modal-context";
import { Modal } from "@/components/public/Modal";
import { submitInquiry } from "@/lib/actions/inquiries";

export function ContactModal() {
  const { contactOpen, close } = useModal();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("formType", "contacto");
    const result = await submitInquiry(formData);

    if (result.ok) {
      setStatus("sent");
      e.currentTarget.reset();
      setTimeout(() => {
        setStatus("idle");
        close();
      }, 3000);
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  return (
    <Modal open={contactOpen} onClose={close} title="Contáctanos">
      <p className="modal__texto">
        Cuéntanos sobre tu proyecto o consulta y te responderemos a la brevedad.
      </p>
      <form className="modal__form" onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Tu nombre" required />
        <input type="email" name="email" placeholder="Tu correo electrónico" required />
        <textarea name="mensaje" placeholder="Tu mensaje..." rows={4} required />
        <button type="submit" className="boton" disabled={status === "sending"}>
          {status === "sending" ? "Enviando..." : "Enviar Mensaje"}
        </button>
        <p className="modal__mensaje-estado">
          {status === "sent" && "¡Gracias! Hemos recibido tu mensaje."}
          {status === "error" && errorMessage}
        </p>
      </form>
    </Modal>
  );
}

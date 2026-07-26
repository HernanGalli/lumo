"use client";

import { useState, type FormEvent } from "react";
import { useModal } from "@/components/public/modal-context";
import { Modal } from "@/components/public/Modal";
import { submitInquiry } from "@/lib/actions/inquiries";

export function ProductInquiryModal() {
  const { productOpen, productName, close } = useModal();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("formType", "producto");
    formData.set("producto", productName);
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
    <Modal open={productOpen} onClose={close} title="Solicitar Compra">
      <p className="modal__producto-nombre">{productName}</p>
      <p className="modal__texto">
        Déjanos tus datos y te contactaremos para coordinar el pago y la entrega.
      </p>
      <form className="modal__form" onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Tu nombre completo" required />
        <input type="email" name="email" placeholder="Tu correo electrónico" required />
        <input type="tel" name="telefono" placeholder="Tu teléfono (opcional)" />
        <button type="submit" className="boton" disabled={status === "sending"}>
          {status === "sending" ? "Enviando..." : "Enviar Solicitud"}
        </button>
        <p className="modal__mensaje-estado">
          {status === "sent" && "¡Gracias! Hemos recibido tu solicitud."}
          {status === "error" && errorMessage}
        </p>
      </form>
    </Modal>
  );
}

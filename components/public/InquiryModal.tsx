"use client";

import { useState, type FormEvent } from "react";
import { useModal } from "@/components/public/modal-context";
import { Modal } from "@/components/public/Modal";
import { submitInquiry } from "@/lib/actions/inquiries";

// Un solo formulario para las dos intenciones que antes eran dos
// componentes separados (ContactModal/ProductInquiryModal): consulta
// general ("Contáctanos", desde Showcase) e interés en un producto puntual
// ("Solicitar Compra", desde una ProductCard). Misma tabla `inquiries`,
// mismo modal — solo cambia el título/copy y si se manda `producto`.
export function InquiryModal() {
  const { inquiryOpen, productName, close } = useModal();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isProduct = Boolean(productName);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("formType", isProduct ? "producto" : "contacto");
    if (productName) formData.set("producto", productName);
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
    <Modal open={inquiryOpen} onClose={close} title={isProduct ? "Solicitar Compra" : "Contáctanos"}>
      {isProduct && productName && <p className="modal__producto-nombre">{productName}</p>}
      <p className="modal__texto">
        {isProduct
          ? "Déjanos tus datos y te contactaremos para coordinar el pago y la entrega."
          : "Cuéntanos sobre tu proyecto o consulta y te responderemos a la brevedad."}
      </p>
      <form className="modal__form" onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Tu nombre completo" required />
        <input type="email" name="email" placeholder="Tu correo electrónico" required />
        {isProduct ? (
          <input type="tel" name="telefono" placeholder="Tu teléfono (opcional)" />
        ) : (
          <textarea name="mensaje" placeholder="Tu mensaje..." rows={4} required />
        )}
        <button type="submit" className="boton" disabled={status === "sending"}>
          {status === "sending" ? "Enviando..." : isProduct ? "Enviar Solicitud" : "Enviar Mensaje"}
        </button>
        <p className="modal__mensaje-estado">
          {status === "sent" &&
            (isProduct ? "¡Gracias! Hemos recibido tu solicitud." : "¡Gracias! Hemos recibido tu mensaje.")}
          {status === "error" && errorMessage}
        </p>
      </form>
    </Modal>
  );
}

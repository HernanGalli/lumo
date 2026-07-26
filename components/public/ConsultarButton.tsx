"use client";

import { useModal } from "@/components/public/modal-context";

export function ConsultarButton({ label }: { label: string }) {
  const { openContact } = useModal();
  return (
    <button type="button" className="boton" onClick={openContact}>
      {label}
    </button>
  );
}

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ModalState {
  inquiryOpen: boolean;
  // null = consulta general ("Contáctanos"); string = interés en un
  // producto puntual ("Solicitar Compra") — un solo modal, ver InquiryModal.
  productName: string | null;
}

interface ModalContextValue extends ModalState {
  openContact: () => void;
  openProductInquiry: (productName: string) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({ inquiryOpen: false, productName: null });

  const value: ModalContextValue = {
    ...state,
    openContact: () => setState({ inquiryOpen: true, productName: null }),
    openProductInquiry: (productName) => setState({ inquiryOpen: true, productName }),
    close: () => setState({ inquiryOpen: false, productName: null }),
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal debe usarse dentro de ModalProvider");
  return ctx;
}

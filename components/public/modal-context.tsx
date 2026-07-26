"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ModalState {
  contactOpen: boolean;
  productOpen: boolean;
  productName: string;
}

interface ModalContextValue extends ModalState {
  openContact: () => void;
  openProductInquiry: (productName: string) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({
    contactOpen: false,
    productOpen: false,
    productName: "",
  });

  const value: ModalContextValue = {
    ...state,
    openContact: () => setState({ contactOpen: true, productOpen: false, productName: "" }),
    openProductInquiry: (productName) =>
      setState({ contactOpen: false, productOpen: true, productName }),
    close: () => setState({ contactOpen: false, productOpen: false, productName: "" }),
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal debe usarse dentro de ModalProvider");
  return ctx;
}

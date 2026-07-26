"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function FadeInSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Chequeo síncrono al montar: si la sección ya está a la vista apenas
    // carga la página (ej. es lo primero del todo, como el catálogo, sin
    // hero arriba que obligue a scrollear), no depende de que el
    // IntersectionObserver dispare a tiempo — sin esto, ese contenido
    // quedaba con opacity:0 hasta que el visitante scrolleaba.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    // threshold 0 (no un % del área): las secciones envueltas pueden ser muy
    // altas (ej. toda la grilla de productos), así que alcanza con que
    // empiece a asomar por abajo del viewport para disparar el fade-in.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

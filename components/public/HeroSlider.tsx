"use client";

import { useEffect, useRef, useState } from "react";
import { useModal } from "@/components/public/modal-context";

export interface HeroBanner {
  id: string;
  mediaType: "video" | "image";
  url: string;
  posterUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

const SLIDE_DURATION = 5000;

export function HeroSlider({ banners }: { banners: HeroBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const { openContact } = useModal();

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % banners.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [activeIndex]);

  const activeBanner = banners[activeIndex];

  return (
    <section className="hero">
      <div className="hero__slider-container">
        {banners.map((banner, index) => (
          <div key={banner.id} className={`hero__slide ${index === activeIndex ? "active" : ""}`}>
            {banner.mediaType === "video" ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                playsInline
                autoPlay
                muted
                loop
                poster={banner.posterUrl ?? undefined}
              >
                <source src={banner.url} type="video/mp4" />
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner.url} alt="" />
            )}
          </div>
        ))}
      </div>
      <div className="hero__contenedor contenedor">
        <h1 className="hero__titulo">
          Diseño que ilumina. <br />
          Ideas que toman forma.
        </h1>
        <p className="hero__parrafo">Piezas únicas de impresión 3D para tu hogar y negocio.</p>
        <div className="hero__botones">
          <a href="#catalogo" className="boton">
            Explorar Diseños
          </a>
          {activeBanner?.ctaUrl ? (
            <a href={activeBanner.ctaUrl} className="boton boton--outline">
              {activeBanner.ctaText || "Cotiza tu Proyecto"}
            </a>
          ) : (
            <button type="button" className="boton boton--outline" onClick={openContact}>
              {activeBanner?.ctaText || "Cotiza tu Proyecto"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

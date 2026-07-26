"use client";

import { useEffect, useRef, useState } from "react";

export interface HeroBanner {
  id: string;
  mediaType: "video" | "image";
  url: string;
  posterUrl: string | null;
  headline: string | null;
  bodyText: string | null;
}

const SLIDE_DURATION = 5000;

const DEFAULT_HEADLINE = "La identidad de tu cuadro o tu marca, en la palma de la mano.";
const DEFAULT_BODY =
  "Transformamos escudos, logos e ideas en llaveros y merchandising 3D en alta definición. " +
  "Calidad prolija que se nota y se toca, sin mínimos disparatados.";

export function HeroSlider({ banners }: { banners: HeroBanner[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

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
        <h1 className="hero__titulo">{activeBanner?.headline || DEFAULT_HEADLINE}</h1>
        <p className="hero__parrafo">{activeBanner?.bodyText || DEFAULT_BODY}</p>
        <div className="hero__botones">
          <a href="#proceso" className="boton">
            Crear mi llavero personalizado
          </a>
          <a href="/empresas" className="boton boton--outline">
            Pedir cotización
          </a>
        </div>
      </div>
    </section>
  );
}

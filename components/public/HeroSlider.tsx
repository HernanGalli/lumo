"use client";

import { useEffect, useRef, useState } from "react";
import { trackClick } from "@/lib/actions/analytics";

export interface HeroBanner {
  id: string;
  mediaType: "video" | "image";
  url: string;
  posterUrl: string | null;
  headline: string | null;
  bodyText: string | null;
}

const SLIDE_DURATION = 5000;

// Copy por defecto de requerimientos-lumo-llaveros-v2.md §6.1 — se usa
// salvo que haya un banner activo con headline/bodyText propio cargado en
// /admin/banners (page_target='home').
const DEFAULT_HEADLINE = "Un llavero, un recuerdo.";
const DEFAULT_BODY =
  "Personalizamos llaveros para tu empresa, tu emprendimiento, tu escuela o ese evento que no " +
  "querés que se olvide. Diseñado en Uruguay, pensado para vos.";

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
          <a
            href="#segmentos"
            className="boton"
            onClick={() => trackClick("hero_cta", "/", "contame_tu_idea")}
          >
            Contame tu idea
          </a>
          <a
            href="/catalogo"
            className="boton boton--outline"
            onClick={() => trackClick("hero_cta", "/", "ver_catalogo")}
          >
            Ver catálogo
          </a>
        </div>
      </div>
    </section>
  );
}

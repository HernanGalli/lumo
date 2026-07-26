"use client";

import { useState } from "react";
import { useModal } from "@/components/public/modal-context";

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  priceOriginal: number;
  priceOffer: number | null;
  isOffer: boolean;
  images: string[];
  categoryLabel: string;
}

const formatoMoneda = new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU" });

export function ProductCard({ product }: { product: PublicProduct }) {
  const [activeImage, setActiveImage] = useState(0);
  const { openProductInquiry } = useModal();
  const images = product.images.length > 0 ? product.images : [null];

  function nextImage() {
    setActiveImage((i) => (i + 1) % images.length);
  }
  function prevImage() {
    setActiveImage((i) => (i - 1 + images.length) % images.length);
  }

  return (
    <div className="producto-card">
      <div className="producto-card__imagen-cont">
        <div className="card-gallery">
          {images.map((src, idx) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={product.name}
                className={`card-gallery__image foto-armonia ${idx === activeImage ? "active" : ""}`}
              />
            ) : (
              <div
                key="placeholder"
                className={`card-gallery__image active`}
                style={{ backgroundColor: "var(--background-secundario)" }}
              />
            )
          )}
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="card-gallery__nav card-gallery__nav--prev"
              aria-label="Anterior"
              onClick={prevImage}
            >
              &#10094;
            </button>
            <button
              type="button"
              className="card-gallery__nav card-gallery__nav--next"
              aria-label="Siguiente"
              onClick={nextImage}
            >
              &#10095;
            </button>
          </>
        )}
        {product.isOffer && <span className="producto-card__oferta">Oferta</span>}
      </div>
      <div className="producto-card__info">
        <span className="producto-card__categoria">{product.categoryLabel}</span>
        <h3 className="producto-card__nombre">{product.name}</h3>
        <p className="producto-card__descripcion">{product.description}</p>
        <div className="producto-card__footer">
          <div className="producto-card__precio">
            {product.isOffer && product.priceOffer ? (
              <>
                <span className="precio--original">{formatoMoneda.format(product.priceOriginal)}</span>
                <span className="precio--oferta">{formatoMoneda.format(product.priceOffer)}</span>
              </>
            ) : (
              <span className="precio--normal">{formatoMoneda.format(product.priceOriginal)}</span>
            )}
          </div>
          <button
            type="button"
            className="boton producto-card__boton"
            onClick={() => openProductInquiry(product.name)}
          >
            Me interesa
          </button>
        </div>
      </div>
    </div>
  );
}

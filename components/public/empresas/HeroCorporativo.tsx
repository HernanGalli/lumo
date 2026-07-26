"use client";

const WHATSAPP_NUMBER = "59898753757";
const KIT_MESSAGE = "Hola LUMO, me interesa pedir un kit de muestras para mi empresa...";

export function HeroCorporativo() {
  return (
    <section className="bg-azul text-white">
      <div className="contenedor py-20 md:py-28 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-6">
          Merchandising, Regalos Corporativos y Señalética 3D que destacan tu marca.
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-10">
          Diseñamos y fabricamos piezas exclusivas 100% personalizadas con materiales
          sustentables. Sin costos de matriz tradicional y con entregas ágiles.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#cotizar"
            className="rounded-md bg-white px-8 py-4 text-azul font-medium hover:bg-white/90 transition-colors"
          >
            Solicitar Cotización Corporativa
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(KIT_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border-2 border-white px-8 py-4 text-white font-medium hover:bg-white hover:text-azul transition-colors"
          >
            Pedir Kit de Muestras
          </a>
        </div>
      </div>
    </section>
  );
}

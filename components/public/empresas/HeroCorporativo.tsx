"use client";

const WHATSAPP_NUMBER = "59898753757";
const KIT_MESSAGE = "Hola LUMO, me interesa pedir un kit de muestras para mi empresa...";

export function HeroCorporativo() {
  return (
    <section className="bg-background-secundario text-foreground border-b border-border">
      <div className="contenedor py-20 md:py-28 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-6">
          Merchandising, Regalos Corporativos y Señalética 3D que{" "}
          <span className="text-azul">destacan tu marca</span>.
        </h1>
        <p className="text-lg md:text-xl text-foreground-muted mb-10">
          Diseñamos y fabricamos piezas exclusivas 100% personalizadas con materiales
          sustentables. Sin costos de matriz tradicional y con entregas ágiles.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#cotizar"
            className="rounded-md bg-azul px-8 py-4 text-white font-medium hover:bg-azul-claro transition-colors"
          >
            Solicitar Cotización Corporativa
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(KIT_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border-2 border-cian px-8 py-4 text-cian font-medium hover:bg-cian hover:text-[#0F172A] transition-colors"
          >
            Pedir Kit de Muestras
          </a>
        </div>
      </div>
    </section>
  );
}

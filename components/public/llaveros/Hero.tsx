const WHATSAPP_NUMBER = "59898753757";

export interface SegmentHeroContent {
  heroTitle: string;
  heroSubtitle: string;
  whatsappMessage: string;
}

export function Hero({ content }: { content: SegmentHeroContent }) {
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(content.whatsappMessage)}`;

  return (
    <section className="bg-background-secundario text-foreground border-b border-border">
      <div className="contenedor py-20 md:py-28 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-6">{content.heroTitle}</h1>
        <p className="text-lg md:text-xl text-foreground-muted mb-10">{content.heroSubtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#cotizar"
            className="rounded-md bg-azul px-8 py-4 text-white font-medium hover:bg-azul-claro transition-colors"
          >
            Solicitar Cotización
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border-2 border-cian px-8 py-4 text-cian font-medium hover:bg-cian hover:text-[#0F172A] transition-colors"
          >
            Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

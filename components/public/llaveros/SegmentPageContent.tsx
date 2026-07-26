import type { SegmentConfig } from "@/lib/segments";
import { getSegmentPageData } from "@/lib/segmentPageData";
import { Hero } from "@/components/public/llaveros/Hero";
import { Pilares } from "@/components/public/llaveros/Pilares";
import { CatalogoPorSegmento } from "@/components/public/llaveros/CatalogoPorSegmento";
import { LeadForm } from "@/components/public/llaveros/LeadForm";
import { PriceTierTable } from "@/components/public/llaveros/PriceTierTable";
import { ClientLogosCarousel } from "@/components/public/empresas/ClientLogosCarousel";
import { PromoBanner } from "@/components/public/empresas/PromoBanner";
import { ProcesoSteps } from "@/components/public/empresas/ProcesoSteps";
import { FadeInSection } from "@/components/public/FadeInSection";

export async function SegmentPageContent({ segment }: { segment: SegmentConfig }) {
  const { content, grupos, logos, promoBanner } = await getSegmentPageData(segment);
  const isEmpresas = segment.slug === "empresas";

  // Fallback defensivo si el seed de segment_content no llegó a correr —
  // no debería pasar en producción (0008_segment_content.sql lo carga),
  // pero evita que la página rompa si igual faltara la fila.
  const heroContent = content ?? {
    hero_title: segment.navLabel,
    hero_subtitle: segment.navBlurb,
    pilar_1_titulo: "",
    pilar_1_texto: "",
    pilar_2_titulo: "",
    pilar_2_texto: "",
    pilar_3_titulo: "",
    pilar_3_texto: "",
    pilar_4_titulo: "",
    pilar_4_texto: "",
    whatsapp_message: "Hola! Quiero consultar por...",
  };

  const pilares = [
    { titulo: heroContent.pilar_1_titulo, texto: heroContent.pilar_1_texto },
    { titulo: heroContent.pilar_2_titulo, texto: heroContent.pilar_2_texto },
    { titulo: heroContent.pilar_3_titulo, texto: heroContent.pilar_3_texto },
    { titulo: heroContent.pilar_4_titulo, texto: heroContent.pilar_4_texto },
  ].filter((p) => p.titulo);

  return (
    <>
      {isEmpresas && <PromoBanner banner={promoBanner} />}
      <Hero
        content={{
          heroTitle: heroContent.hero_title,
          heroSubtitle: heroContent.hero_subtitle,
          whatsappMessage: heroContent.whatsapp_message,
        }}
      />
      {pilares.length > 0 && (
        <FadeInSection>
          <Pilares pilares={pilares} />
        </FadeInSection>
      )}
      <FadeInSection>
        <CatalogoPorSegmento grupos={grupos} title={`Catálogo para ${segment.navLabel}`} />
      </FadeInSection>
      {isEmpresas && (
        <FadeInSection>
          <ClientLogosCarousel logos={logos} />
        </FadeInSection>
      )}
      <FadeInSection>
        <ProcesoSteps />
      </FadeInSection>
      <FadeInSection>
        <PriceTierTable />
      </FadeInSection>
      <FadeInSection>
        <section id="cotizar" className="contenedor py-16 md:py-20 max-w-2xl mx-auto">
          <h2 className="titulo-seccion">Solicitá tu Cotización</h2>
          <LeadForm segment={segment} />
        </section>
      </FadeInSection>
    </>
  );
}

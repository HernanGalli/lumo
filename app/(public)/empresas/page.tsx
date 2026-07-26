import { SEGMENTS } from "@/lib/segments";
import { SegmentPageContent } from "@/components/public/llaveros/SegmentPageContent";

// Se mantiene esta URL viva por SEO/backlinks — el contenido es idéntico al
// de /llaveros/empresas, delegado en el mismo árbol de componentes
// generalizado (ver components/public/llaveros/SegmentPageContent.tsx) para
// no mantener dos implementaciones del mismo segmento.
export const metadata = {
  title: SEGMENTS.empresas.seoTitle,
  description: SEGMENTS.empresas.seoDescription,
};

export default function EmpresasPage() {
  return <SegmentPageContent segment={SEGMENTS.empresas} />;
}

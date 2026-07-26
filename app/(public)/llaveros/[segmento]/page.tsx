import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SEGMENT_SLUGS, SEGMENTS, getSegmentBySlug } from "@/lib/segments";
import { SegmentPageContent } from "@/components/public/llaveros/SegmentPageContent";

export function generateStaticParams() {
  return SEGMENT_SLUGS.map((segmento) => ({ segmento }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>;
}): Promise<Metadata> {
  const { segmento } = await params;
  const segment = getSegmentBySlug(segmento);
  if (!segment) return {};
  return {
    title: segment.seoTitle,
    description: segment.seoDescription,
  };
}

export default async function LlaverosSegmentoPage({
  params,
}: {
  params: Promise<{ segmento: string }>;
}) {
  const { segmento } = await params;
  const segment = getSegmentBySlug(segmento);
  if (!segment) notFound();

  return <SegmentPageContent segment={SEGMENTS[segment.slug]} />;
}

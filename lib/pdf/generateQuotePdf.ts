import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePdfDocument, type QuotePdfData } from "@/lib/pdf/quoteTemplate";

export async function generateQuotePdfBuffer(data: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(QuotePdfDocument({ data }));
}

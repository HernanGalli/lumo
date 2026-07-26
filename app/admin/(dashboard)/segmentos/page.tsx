import { createClient } from "@/lib/supabase/server";
import { updateSegmentContent } from "@/lib/actions/segmentContent";
import { SEGMENT_SLUGS, SEGMENTS } from "@/lib/segments";

export default async function SegmentosPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("segment_content").select("*");
  const bySegment = new Map((rows ?? []).map((r) => [r.segment, r]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Segmentos de /llaveros</h1>
      <p className="text-foreground-muted mb-8">
        Copy editable de cada segmento (hero, pilares, mensaje de WhatsApp) — se refleja al
        instante en /llaveros/[segmento], sin redeployar.
      </p>

      <div className="flex flex-col gap-6">
        {SEGMENT_SLUGS.map((slug) => {
          const segment = SEGMENTS[slug];
          const content = bySegment.get(segment.dbValue);

          return (
            <details key={slug} className="rounded-lg border border-border bg-surface p-5" open={slug === "empresas"}>
              <summary className="cursor-pointer font-medium">
                {segment.emoji} {segment.navLabel}
              </summary>

              <form action={updateSegmentContent} className="mt-4 flex flex-col gap-4 text-sm">
                <input type="hidden" name="segment" value={segment.dbValue} />

                <label className="flex flex-col gap-1">
                  <span className="text-foreground-muted">Hero — título</span>
                  <input
                    name="heroTitle"
                    defaultValue={content?.hero_title ?? ""}
                    required
                    className="rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-foreground-muted">Hero — subtítulo</span>
                  <textarea
                    name="heroSubtitle"
                    defaultValue={content?.hero_subtitle ?? ""}
                    required
                    rows={2}
                    className="rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex flex-col gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-foreground-muted">Pilar {n} — título</span>
                        <input
                          name={`pilar${n}Titulo`}
                          defaultValue={content?.[`pilar_${n}_titulo`] ?? ""}
                          required
                          className="rounded-md border border-border bg-background px-3 py-2"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-foreground-muted">Pilar {n} — texto</span>
                        <textarea
                          name={`pilar${n}Texto`}
                          defaultValue={content?.[`pilar_${n}_texto`] ?? ""}
                          required
                          rows={2}
                          className="rounded-md border border-border bg-background px-3 py-2"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <label className="flex flex-col gap-1 pt-2 border-t border-border">
                  <span className="text-foreground-muted">Mensaje de WhatsApp</span>
                  <textarea
                    name="whatsappMessage"
                    defaultValue={content?.whatsapp_message ?? ""}
                    required
                    rows={2}
                    className="rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>

                <button
                  type="submit"
                  className="self-start rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
                >
                  Guardar {segment.navLabel}
                </button>
              </form>
            </details>
          );
        })}
      </div>
    </div>
  );
}

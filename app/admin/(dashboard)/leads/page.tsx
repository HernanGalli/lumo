import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteLead, updateLeadNotes } from "@/lib/actions/leads";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { SEGMENTS, SEGMENT_SLUGS } from "@/lib/segments";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  merchandising: "Merchandising & Onboarding",
  presencia_marca: "Presencia de Marca",
  premios: "Premios & Reconocimientos",
  prototipado: "Prototipado Técnico",
};

const DESIGN_STATUS_LABELS: Record<string, string> = {
  tiene_logo_vectorial: "Tiene logo vectorial",
  tiene_stl_step: "Tiene archivo .STL/.STEP",
  requiere_modelado: "Requiere modelado desde cero",
};

const SEGMENT_LABELS: Record<string, string> = Object.fromEntries(
  SEGMENT_SLUGS.map((slug) => [SEGMENTS[slug].dbValue, SEGMENTS[slug].navLabel])
);

const SEGMENT_FILTERS = [{ value: "", label: "Todos" }, ...SEGMENT_SLUGS.map((slug) => ({
  value: SEGMENTS[slug].dbValue,
  label: SEGMENTS[slug].navLabel,
}))];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ segmento?: string }>;
}) {
  const { segmento } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("corporate_leads").select("*").order("created_at", { ascending: false });
  if (segmento) query = query.eq("segment", segmento);
  const { data: leads } = await query;

  const withFileUrls = await Promise.all(
    (leads ?? []).map(async (lead) => {
      if (!lead.reference_file_path) return { ...lead, fileUrl: null as string | null };
      const { data } = await supabase.storage
        .from("leads")
        .createSignedUrl(lead.reference_file_path, 60 * 60);
      return { ...lead, fileUrl: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Leads</h1>
      <p className="text-foreground-muted mb-6">
        Consultas del formulario de cotización guiado de /llaveros y /empresas.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {SEGMENT_FILTERS.map((f) => {
          const active = (segmento ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/leads?segmento=${f.value}` : "/admin/leads"}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "border-azul bg-azul/10 text-azul" : "border-border hover:border-azul/50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {withFileUrls.map((lead) => {
          const extraFields = (lead.extra_fields ?? {}) as Record<string, string>;
          const extraEntries = Object.entries(extraFields);

          return (
            <div key={lead.id} className="rounded-lg border border-border bg-surface p-5 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {lead.company_name ? `${lead.company_name} — ${lead.contact_name}` : lead.contact_name}
                    </p>
                    <span className="rounded-full bg-background-secundario px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground-muted">
                      {SEGMENT_LABELS[lead.segment] ?? lead.segment}
                    </span>
                  </div>
                  <p className="text-foreground-muted">
                    {lead.email}
                    {lead.phone && ` · ${lead.phone}`}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {new Date(lead.created_at).toLocaleString("es-UY")}
                  </p>
                </div>
                <LeadStatusSelect leadId={lead.id} status={lead.status} />
              </div>

              {lead.segment === "empresa" ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-foreground-muted">Tipo de proyecto</p>
                    <p>{PROJECT_TYPE_LABELS[lead.project_type ?? ""] ?? lead.project_type ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground-muted">Volumen</p>
                    <p>{lead.volume_range ? `${lead.volume_range} unidades` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground-muted">Estado del diseño</p>
                    <p>{DESIGN_STATUS_LABELS[lead.design_status ?? ""] ?? lead.design_status ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground-muted">Archivo</p>
                    {lead.fileUrl ? (
                      <a href={lead.fileUrl} target="_blank" rel="noopener noreferrer" className="text-azul hover:underline">
                        Descargar
                      </a>
                    ) : (
                      <p>—</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                  {extraEntries.map(([key, value]) => (
                    <div key={key}>
                      <p className="text-foreground-muted">{key.replace(/_/g, " ")}</p>
                      <p>{value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-foreground-muted">Archivo</p>
                    {lead.fileUrl ? (
                      <a href={lead.fileUrl} target="_blank" rel="noopener noreferrer" className="text-azul hover:underline">
                        Descargar
                      </a>
                    ) : (
                      <p>—</p>
                    )}
                  </div>
                </div>
              )}

              <form action={updateLeadNotes} className="flex items-start gap-2 mb-2">
                <input type="hidden" name="id" value={lead.id} />
                <textarea
                  name="notes"
                  defaultValue={lead.notes ?? ""}
                  placeholder="Notas internas..."
                  rows={2}
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                />
                <button type="submit" className="rounded-md border border-border px-2 py-1.5 text-xs hover:border-azul">
                  Guardar
                </button>
              </form>

              <form action={deleteLead}>
                <input type="hidden" name="id" value={lead.id} />
                <button type="submit" className="text-xs text-rojo hover:underline">
                  Borrar
                </button>
              </form>
            </div>
          );
        })}
        {withFileUrls.length === 0 && (
          <p className="text-sm text-foreground-muted">Todavía no hay leads para este filtro.</p>
        )}
      </div>
    </div>
  );
}

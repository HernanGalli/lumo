import { createClient } from "@/lib/supabase/server";
import { deleteLead, updateLeadNotes } from "@/lib/actions/leads";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";

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

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("corporate_leads")
    .select("*")
    .order("created_at", { ascending: false });

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
      <h1 className="text-2xl font-semibold mb-1">Leads corporativos</h1>
      <p className="text-foreground-muted mb-8">
        Consultas del formulario de cotización de /empresas.
      </p>

      <div className="flex flex-col gap-4">
        {withFileUrls.map((lead) => (
          <div key={lead.id} className="rounded-lg border border-border bg-surface p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-medium">
                  {lead.company_name} — {lead.contact_name}
                </p>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
              <div>
                <p className="text-foreground-muted">Tipo de proyecto</p>
                <p>{PROJECT_TYPE_LABELS[lead.project_type] ?? lead.project_type}</p>
              </div>
              <div>
                <p className="text-foreground-muted">Volumen</p>
                <p>{lead.volume_range} unidades</p>
              </div>
              <div>
                <p className="text-foreground-muted">Estado del diseño</p>
                <p>{DESIGN_STATUS_LABELS[lead.design_status] ?? lead.design_status}</p>
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
        ))}
        {withFileUrls.length === 0 && (
          <p className="text-sm text-foreground-muted">Todavía no hay leads corporativos.</p>
        )}
      </div>
    </div>
  );
}

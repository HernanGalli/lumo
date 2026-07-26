// Configuración estructural de los 5 segmentos de /llaveros. El copy
// editable (hero, pilares, mensaje de WhatsApp) vive en la tabla
// `segment_content` (editable desde /admin/segmentos) — acá solo queda lo
// que es una decisión técnica, no una edición de texto: qué campos extra
// pide el formulario guiado de cada segmento, y los metadatos de SEO.

export type SegmentSlug =
  | "empresas"
  | "emprendimientos"
  | "escuelas"
  | "eventos-sociales"
  | "grupos";

export type SegmentDbValue = "empresa" | "emprendimiento" | "escuela" | "evento_social" | "grupo";

export interface SegmentFormFieldOption {
  value: string;
  label: string;
}

export interface SegmentFormField {
  /** Clave dentro de corporate_leads.extra_fields */
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  options?: SegmentFormFieldOption[];
  required?: boolean;
}

export interface SegmentConfig {
  slug: SegmentSlug;
  dbValue: SegmentDbValue;
  emoji: string;
  navLabel: string;
  /** Copy corto de una línea para las tarjetas "¿Para quién es esto?" del home. */
  navBlurb: string;
  seoTitle: string;
  seoDescription: string;
  /** Preguntas condicionales del formulario guiado — vacío para "empresas", que mantiene su wizard propio. */
  formExtraFields: SegmentFormField[];
  allowFileUpload: boolean;
}

export const SEGMENTS: Record<SegmentSlug, SegmentConfig> = {
  empresas: {
    slug: "empresas",
    dbValue: "empresa",
    emoji: "🏢",
    navLabel: "Empresas",
    navBlurb: "Regalos corporativos y merchandising que la gente realmente usa.",
    seoTitle: "LUMO Empresas — Merchandising y proyectos a medida",
    seoDescription:
      "Merchandising, regalos corporativos y señalética 3D personalizada, fabricados con materiales sustentables.",
    formExtraFields: [],
    allowFileUpload: true,
  },
  emprendimientos: {
    slug: "emprendimientos",
    dbValue: "emprendimiento",
    emoji: "🚀",
    navLabel: "Emprendimientos",
    navBlurb: "Sumá tu logo a un producto que acompaña todos los días.",
    // TODO revisar: meta description propuesta, el documento no da un texto literal para SEO.
    seoTitle: "Llaveros personalizados para tu emprendimiento — LUMO",
    seoDescription:
      "Sumá tu logo a llaveros personalizados sin mínimos altos. Empezá con pocas unidades y escalá con tu emprendimiento.",
    formExtraFields: [
      { key: "nombre_emprendimiento", label: "Nombre del emprendimiento", type: "text", required: true },
      { key: "cantidad_aproximada", label: "Cantidad aproximada", type: "number", required: true },
      {
        key: "tiene_diseno",
        label: "¿Tenés el logo o diseño listo?",
        type: "select",
        required: true,
        options: [
          { value: "si", label: "Sí" },
          { value: "no", label: "No" },
          { value: "necesito_ayuda", label: "Necesito ayuda" },
        ],
      },
    ],
    allowFileUpload: true,
  },
  escuelas: {
    slug: "escuelas",
    dbValue: "escuela",
    emoji: "🎓",
    navLabel: "Escuelas y liceos",
    navBlurb: "Egresos, aniversarios y actividades a beneficio.",
    // TODO revisar: meta description propuesta, el documento no da un texto literal para SEO.
    seoTitle: "Llaveros de egreso y actividades solidarias — LUMO",
    seoDescription:
      "Llaveros personalizados de egreso, aniversario o para juntar fondos con tu escuela o liceo.",
    formExtraFields: [
      { key: "institucion", label: "Institución", type: "text", required: true },
      {
        key: "tipo_actividad",
        label: "Tipo de actividad",
        type: "select",
        required: true,
        options: [
          { value: "egreso", label: "Egreso" },
          { value: "aniversario", label: "Aniversario" },
          { value: "actividad_solidaria", label: "Actividad solidaria" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "cantidad_alumnos", label: "Cantidad aproximada de alumnos", type: "number", required: true },
      { key: "nombre_referente", label: "Nombre del referente/contacto", type: "text", required: true },
    ],
    allowFileUpload: true,
  },
  "eventos-sociales": {
    slug: "eventos-sociales",
    dbValue: "evento_social",
    emoji: "🎉",
    navLabel: "Eventos sociales",
    navBlurb: "Casamientos, cumpleaños, baby showers, despedidas.",
    // TODO revisar: meta description propuesta, el documento no da un texto literal para SEO.
    seoTitle: "Llaveros personalizados para tu evento — LUMO",
    seoDescription:
      "Souvenirs y llaveros a medida para casamientos, cumpleaños y baby showers en Uruguay.",
    formExtraFields: [
      {
        key: "tipo_evento",
        label: "Tipo de evento",
        type: "select",
        required: true,
        options: [
          { value: "casamiento", label: "Casamiento" },
          { value: "cumpleanos", label: "Cumpleaños" },
          { value: "baby_shower", label: "Baby shower" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "fecha_evento", label: "Fecha del evento", type: "date", required: false },
      { key: "cantidad_invitados", label: "Cantidad aproximada de invitados", type: "number", required: true },
    ],
    allowFileUpload: true,
  },
  grupos: {
    slug: "grupos",
    dbValue: "grupo",
    emoji: "👥",
    navLabel: "Grupos y equipos",
    navBlurb: "Cuadros, murgas, comparsas, grupos de amigos.",
    // TODO revisar: meta description propuesta, el documento no da un texto literal para SEO.
    seoTitle: "Llaveros para tu grupo o equipo — LUMO",
    seoDescription:
      "Identidad compartida en un llavero: para el cuadro, la comparsa o tu grupo de amigos.",
    formExtraFields: [
      { key: "nombre_grupo", label: "Nombre del grupo/equipo", type: "text", required: true },
      {
        key: "tipo_grupo",
        label: "Tipo de grupo",
        type: "select",
        required: true,
        options: [
          { value: "deportivo", label: "Deportivo" },
          { value: "comparsa_murga", label: "Comparsa o murga" },
          { value: "grupo_amigos", label: "Grupo de amigos" },
          { value: "otro", label: "Otro" },
        ],
      },
      { key: "cantidad_integrantes", label: "Cantidad aproximada de integrantes", type: "number", required: true },
    ],
    allowFileUpload: true,
  },
};

export const SEGMENT_SLUGS = Object.keys(SEGMENTS) as SegmentSlug[];

export function getSegmentBySlug(slug: string): SegmentConfig | null {
  return (SEGMENTS as Record<string, SegmentConfig>)[slug] ?? null;
}

export function getSegmentByDbValue(dbValue: string): SegmentConfig | null {
  return SEGMENT_SLUGS.map((s) => SEGMENTS[s]).find((s) => s.dbValue === dbValue) ?? null;
}

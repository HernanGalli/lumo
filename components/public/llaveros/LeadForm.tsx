"use client";

import { useRef, useState, type FormEvent } from "react";
import { submitCorporateLead } from "@/lib/actions/corporateLeads";
import type { SegmentConfig, SegmentFormField } from "@/lib/segments";

const PROJECT_TYPES = [
  { value: "merchandising", label: "Merchandising & Onboarding" },
  { value: "presencia_marca", label: "Presencia de Marca" },
  { value: "premios", label: "Premios & Reconocimientos" },
  { value: "prototipado", label: "Prototipado Técnico" },
];

const VOLUME_RANGES = [
  { value: "10-50", label: "10 – 50 unidades" },
  { value: "50-200", label: "50 – 200 unidades" },
  { value: "200+", label: "+200 unidades" },
];

const DESIGN_STATUSES = [
  { value: "tiene_logo_vectorial", label: "Tengo logo vectorial" },
  { value: "tiene_stl_step", label: "Tengo archivo .STL o .STEP" },
  { value: "requiere_modelado", label: "Requiere modelado desde cero" },
];

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: SegmentFormField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClass = "rounded-md border border-border bg-background px-3 py-2 text-sm w-full";

  if (field.type === "select") {
    return (
      <label className="flex flex-col gap-1 text-sm text-left">
        <span className="text-foreground-muted">{field.label}</span>
        <select
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-left">
      <span className="text-foreground-muted">{field.label}</span>
      <input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        required={field.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

// Wizard guiado de leads, generalizado para los 5 segmentos de /llaveros. El
// segmento "empresas" mantiene el wizard original de 4 pasos (tipo de
// proyecto / volumen / diseño / contacto) sin cambios de comportamiento; los
// otros 4 segmentos usan un wizard de 2 pasos con las preguntas propias de
// `segment.formExtraFields` + el mismo paso de contacto.
export function LeadForm({ segment }: { segment: SegmentConfig }) {
  const isEmpresas = segment.slug === "empresas";
  const totalSteps = isEmpresas ? 4 : 2;

  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState("");
  const [volumeRange, setVolumeRange] = useState("");
  const [designStatus, setDesignStatus] = useState("");
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardClass = (active: boolean) =>
    `w-full text-left rounded-lg border p-4 transition-colors ${
      active ? "border-azul bg-azul/5 text-azul" : "border-border hover:border-azul/50"
    }`;

  function canAdvance(): boolean {
    if (isEmpresas) {
      if (step === 1) return Boolean(projectType);
      if (step === 2) return Boolean(volumeRange);
      if (step === 3) return Boolean(designStatus);
      return true;
    }
    if (step === 1) {
      return segment.formExtraFields.every((f) => !f.required || Boolean(extraValues[f.key]?.trim()));
    }
    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const result = await submitCorporateLead(formData);

    if (result.ok) {
      setStatus("sent");
    } else {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <h3 className="text-xl font-semibold text-azul mb-2">¡Gracias!</h3>
        <p className="text-foreground-muted">
          Recibimos tu solicitud, te contactamos a la brevedad para coordinar los detalles.
        </p>
      </div>
    );
  }

  const fileUploadBlock = segment.allowFileUpload && (
    <>
      <input
        ref={fileInputRef}
        id="file"
        name="file"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,.stl,.step,.stp,.zip"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-azul bg-azul/5 px-4 py-6 text-center hover:bg-azul/10 transition-colors"
      >
        <span className="block text-azul font-medium mb-1">
          {fileName ? "✓ " + fileName : "📎 Adjuntar tu logo, escudo o referencia"}
        </span>
        <span className="block text-xs text-foreground-muted">
          Recomendado — cotizamos más rápido y con más precisión. Imagen, PDF, .stl, .step o .zip.
        </span>
      </button>
    </>
  );

  const contactStep = (
    <div>
      <h3 className="font-medium mb-4">Datos de contacto</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="contactName"
          placeholder="Tu nombre"
          required
          className="rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          name="companyName"
          placeholder="Empresa, club o grupo (opcional)"
          className="rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-border bg-background px-3 py-2"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Teléfono / WhatsApp (opcional)"
          className="rounded-md border border-border bg-background px-3 py-2"
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 md:p-8">
      <input type="hidden" name="segment" value={segment.dbValue} />
      {isEmpresas ? (
        <>
          <input type="hidden" name="projectType" value={projectType} />
          <input type="hidden" name="volumeRange" value={volumeRange} />
          <input type="hidden" name="designStatus" value={designStatus} />
        </>
      ) : (
        <input type="hidden" name="extraFieldsJson" value={JSON.stringify(extraValues)} />
      )}

      <p className="text-xs text-foreground-muted mb-1">
        Paso {step} de {totalSteps}
      </p>
      <div className="h-1.5 rounded-full bg-background-secundario mb-6 overflow-hidden">
        <div
          className="h-full bg-azul transition-all"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {isEmpresas && step === 1 && (
        <div>
          <h3 className="font-medium mb-4">¿Qué tipo de proyecto tenés en mente?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PROJECT_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cardClass(projectType === opt.value)}
                onClick={() => setProjectType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEmpresas && step === 2 && (
        <div>
          <h3 className="font-medium mb-4">¿Qué volumen estimás necesitar?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VOLUME_RANGES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cardClass(volumeRange === opt.value)}
                onClick={() => setVolumeRange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isEmpresas && step === 3 && (
        <div>
          <h3 className="font-medium mb-4">¿En qué estado está el diseño?</h3>
          <div className="grid grid-cols-1 gap-3 mb-6">
            {DESIGN_STATUSES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cardClass(designStatus === opt.value)}
                onClick={() => setDesignStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {fileUploadBlock}
        </div>
      )}

      {isEmpresas && step === 4 && contactStep}

      {!isEmpresas && step === 1 && (
        <div>
          <h3 className="font-medium mb-4">Contanos un poco más</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {segment.formExtraFields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={extraValues[field.key] ?? ""}
                onChange={(value) => setExtraValues((prev) => ({ ...prev, [field.key]: value }))}
              />
            ))}
          </div>
          {fileUploadBlock}
        </div>
      )}

      {!isEmpresas && step === 2 && contactStep}

      {status === "error" && <p className="mt-4 text-sm text-rojo">{errorMessage}</p>}

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className={`rounded-md border border-border px-4 py-2 text-sm ${step === 1 ? "invisible" : ""}`}
        >
          Atrás
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
            className="rounded-md bg-azul px-6 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-md bg-azul px-6 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Solicitar Cotización"}
          </button>
        )}
      </div>
    </form>
  );
}

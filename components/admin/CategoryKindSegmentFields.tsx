"use client";

import { useState } from "react";

const SEGMENT_OPTIONS = [
  { value: "empresa", label: "Empresa" },
  { value: "emprendimiento", label: "Emprendimiento" },
  { value: "escuela", label: "Escuela" },
  { value: "evento_social", label: "Evento Social" },
  { value: "grupo", label: "Grupo" },
];

// Se agrega a las forms de creación/edición de categorías en /admin/catalogo
// — un select condicional evita que se cargue una categoría de "segmento"
// sin elegir a cuál pertenece.
export function CategoryKindSegmentFields({
  defaultKind = "catalogo",
  defaultSegment = "",
}: {
  defaultKind?: string;
  defaultSegment?: string;
}) {
  const [kind, setKind] = useState(defaultKind);

  return (
    <>
      <select
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      >
        <option value="catalogo">Catálogo</option>
        <option value="segmento">Segmento</option>
      </select>
      {kind === "segmento" && (
        <select
          name="segment"
          defaultValue={defaultSegment}
          required
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="" disabled>
            Elegí segmento
          </option>
          {SEGMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}

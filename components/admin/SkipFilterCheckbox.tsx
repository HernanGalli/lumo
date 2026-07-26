// Checkbox reutilizado en todos los formularios de carga de fotos — ver
// tratamiento-de-imagenes.md §2. Por defecto el filtro se aplica (si está
// activo en Configuración); esto permite dejar una foto puntual sin retoque
// (ej. un logo de cliente que no debe llevar filtro de color).
export function SkipFilterCheckbox({ id = "skipFilter" }: { id?: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-xs text-foreground-muted">
      <input id={id} name="skipFilter" type="checkbox" className="h-3.5 w-3.5" />
      No aplicar filtro a esta foto
    </label>
  );
}

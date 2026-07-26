export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Para c\u00f3digos de presupuesto (PROYECTO-NOMBRE-2026-01): mismo criterio que
// slugify pero en may\u00fasculas, sin separar en m\u00faltiples palabras largas.
export function slugifyUpper(text: string): string {
  return slugify(text).toUpperCase();
}

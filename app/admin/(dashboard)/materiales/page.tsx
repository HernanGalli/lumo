import { createClient } from "@/lib/supabase/server";
import { createMaterial, deleteMaterial, updateMaterial } from "@/lib/actions/materials";
import { createPrinter, deletePrinter, updatePrinter } from "@/lib/actions/printers";

export default async function MaterialesPage() {
  const supabase = await createClient();

  const [{ data: materials }, { data: printers }] = await Promise.all([
    supabase.from("materials").select("*").order("name"),
    supabase.from("printers").select("*").order("name"),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-1">Materiales e impresoras</h1>
      <p className="text-foreground-muted mb-8">
        La calculadora usa el costo por kg de acá y el consumo (W) de cada impresora.
      </p>

      <section className="rounded-lg border border-border bg-surface p-6 mb-10">
        <h2 className="font-medium mb-4">Materiales</h2>

        <div className="flex flex-col gap-2 mb-4">
          {(materials ?? []).map((m) => (
            <form
              key={m.id}
              action={updateMaterial}
              className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 items-center text-sm"
            >
              <input type="hidden" name="id" value={m.id} />
              <input
                name="name"
                defaultValue={m.name}
                required
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="unit"
                defaultValue={m.unit}
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="costPerKg"
                type="number"
                step="0.01"
                defaultValue={m.cost_per_kg}
                required
                title="Costo por kg"
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="quantityOnHand"
                type="number"
                step="0.01"
                defaultValue={m.quantity_on_hand}
                title="Stock (gramos)"
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="supplier"
                defaultValue={m.supplier ?? ""}
                placeholder="Proveedor"
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-2 py-1.5 hover:border-azul"
              >
                Guardar
              </button>
              <button
                formAction={deleteMaterial}
                className="rounded-md border border-border px-2 py-1.5 text-rojo hover:border-rojo"
              >
                Borrar
              </button>
            </form>
          ))}
        </div>

        <form
          action={createMaterial}
          className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center text-sm pt-4 border-t border-border"
        >
          <input
            name="name"
            placeholder="Nombre (ej. PLA Blanco)"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="unit"
            placeholder="kg"
            defaultValue="kg"
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="costPerKg"
            type="number"
            step="0.01"
            placeholder="Costo/kg"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="quantityOnHand"
            type="number"
            step="0.01"
            placeholder="Stock (g)"
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="supplier"
            placeholder="Proveedor"
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <button
            type="submit"
            className="rounded-md bg-azul px-3 py-1.5 text-white hover:bg-azul-claro"
          >
            Agregar
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-4">Impresoras</h2>

        <div className="flex flex-col gap-2 mb-4">
          {(printers ?? []).map((p) => (
            <form
              key={p.id}
              action={updatePrinter}
              className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_auto_auto] gap-2 items-center text-sm"
            >
              <input type="hidden" name="id" value={p.id} />
              <input
                name="name"
                defaultValue={p.name}
                required
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="watts"
                type="number"
                step="0.1"
                defaultValue={p.watts}
                required
                title="Consumo (W)"
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-2 py-1.5 hover:border-azul"
              >
                Guardar
              </button>
              <button
                formAction={deletePrinter}
                className="rounded-md border border-border px-2 py-1.5 text-rojo hover:border-rojo"
              >
                Borrar
              </button>
            </form>
          ))}
        </div>

        <form
          action={createPrinter}
          className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_auto] gap-2 items-center text-sm pt-4 border-t border-border"
        >
          <input
            name="name"
            placeholder="Nombre (ej. Ender 3)"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="watts"
            type="number"
            step="0.1"
            placeholder="Consumo (W)"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <button
            type="submit"
            className="rounded-md bg-azul px-3 py-1.5 text-white hover:bg-azul-claro"
          >
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
}

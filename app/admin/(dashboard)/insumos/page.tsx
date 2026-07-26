import { createClient } from "@/lib/supabase/server";
import { createSupply, deleteSupply, updateSupply } from "@/lib/actions/supplies";

export default async function InsumosPage() {
  const supabase = await createClient();
  const { data: supplies } = await supabase.from("supplies").select("*").order("name");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Insumos</h1>
      <p className="text-foreground-muted mb-8">
        Argolla, cadena, mosquetón, packaging, mano de obra de ensamblado — costo puro por
        unidad, sin peso ni stock de filamento. Se eligen desde la calculadora al armar un ítem
        de presupuesto.
      </p>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-col gap-2 mb-4">
          {(supplies ?? []).map((s) => (
            <form
              key={s.id}
              action={updateSupply}
              className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_auto_auto_auto] gap-2 items-center text-sm"
            >
              <input type="hidden" name="id" value={s.id} />
              <input
                name="name"
                defaultValue={s.name}
                required
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <input
                name="unitCost"
                type="number"
                step="0.01"
                defaultValue={s.unit_cost}
                required
                title="Costo unitario ($U)"
                className="rounded-md border border-border bg-background px-2 py-1.5"
              />
              <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <input type="checkbox" name="active" defaultChecked={s.active} />
                Activo
              </label>
              <button
                type="submit"
                className="rounded-md border border-border px-2 py-1.5 hover:border-azul"
              >
                Guardar
              </button>
              <button
                formAction={deleteSupply}
                className="rounded-md border border-border px-2 py-1.5 text-rojo hover:border-rojo"
              >
                Borrar
              </button>
            </form>
          ))}
          {(supplies ?? []).length === 0 && (
            <p className="text-sm text-foreground-muted">Todavía no cargaste ningún insumo.</p>
          )}
        </div>

        <form
          action={createSupply}
          className="grid grid-cols-2 sm:grid-cols-[1.5fr_1fr_auto_auto] gap-2 items-center text-sm pt-4 border-t border-border"
        >
          <input
            name="name"
            placeholder="Nombre (ej. Argolla metálica)"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <input
            name="unitCost"
            type="number"
            step="0.01"
            placeholder="Costo unitario ($U)"
            required
            className="rounded-md border border-border bg-background px-2 py-1.5"
          />
          <label className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <input type="checkbox" name="active" defaultChecked />
            Activo
          </label>
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

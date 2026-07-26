-- Fase 5: desglose de costos por ítem de presupuesto, con checkbox de
-- visibilidad individual para el PDF del cliente. Ejecutar una sola vez en
-- el SQL Editor, después de 0010_supplies.sql.

create table if not exists quote_item_costs (
  id uuid primary key default gen_random_uuid(),
  quote_item_id uuid not null references quote_items(id) on delete cascade,
  concept text not null,        -- "Costo Material", "Costo Eléctrico",
                                 -- "Argolla metálica", "Mano de obra",
                                 -- "Margen (X%)", "Precio Unidad", "Precio Total"
  amount numeric(10,2) not null,
  show_in_pdf boolean not null default false,
  sort_order integer not null default 0
);

-- Recordatorio (ver presupuestos-desglose-y-pdf.md §1 y supplies en
-- 0010_supplies.sql): los insumos NUNCA tienen peso ni descuentan stock de
-- materials — esta tabla es solo dinero, no cantidad física.
-- El Margen/Ganancia Neta nunca debe tener show_in_pdf=true expuesto por la
-- UI del admin — se refuerza también a nivel de aplicación en
-- lib/actions/quotes.ts::toggleQuoteItemCostVisibility, que rechaza
-- cualquier intento de togglear una fila cuyo concept empiece con "Margen".

alter table quote_item_costs enable row level security;
create policy "quote_item_costs_admin_only" on quote_item_costs for all to authenticated using (true) with check (true);

-- Fase 5: insumos reutilizables para la calculadora de costos (argolla,
-- cadena, mosquetón, packaging, mano de obra de ensamblado), en vez de un
-- campo suelto de "Costos Extras" escrito a mano. Ejecutar una sola vez en
-- el SQL Editor, después de 0009_photo_settings.sql.

-- IMPORTANTE: los insumos son costo puro. Esta tabla NO lleva ningún campo
-- de peso (weight_g) ni participa de la lógica de stock_deducted de
-- materials — eso es a propósito (ver presupuestos-desglose-y-pdf.md §1).
-- El peso/stock de filamento sigue viviendo exclusivamente en `materials`.
-- No agregarle un campo de peso "para completar".
create table if not exists supplies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_cost numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table supplies enable row level security;
create policy "supplies_admin_only" on supplies for all to authenticated using (true) with check (true);

-- Insumos + cantidad usados en un cálculo puntual de un quote_item.
-- unit_cost_snapshot copia el costo del insumo al momento del cálculo para
-- que, si después cambiás el precio de la argolla, los presupuestos viejos
-- no se recalculen solos.
create table if not exists calc_supplies_used (
  id uuid primary key default gen_random_uuid(),
  quote_item_id uuid not null references quote_items(id) on delete cascade,
  supply_id uuid references supplies(id),
  quantity integer not null default 1,
  unit_cost_snapshot numeric(10,2) not null
);

alter table calc_supplies_used enable row level security;
create policy "calc_supplies_used_admin_only" on calc_supplies_used for all to authenticated using (true) with check (true);

-- Cantidad de piezas del lote de impresión (ej. 50 llaveros salidos de una
-- misma tanda) — distinto de quote_items.quantity, que es la cantidad que
-- pide el cliente en este presupuesto puntual. Ver
-- calculadora-costos-e-insumos.md §1.
alter table quote_items add column if not exists lote_quantity integer;

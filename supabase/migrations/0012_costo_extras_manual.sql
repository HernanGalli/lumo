-- Fase 5 (corrección post-testeo): campo simple de "Costos Extras" en pesos
-- uruguayos, cargado directo en el ítem junto con peso (material) y horas
-- (eléctrico), sin necesidad de pasar por el selector de insumos. Se suma
-- al costo total antes de aplicar el margen. Ejecutar una sola vez en el
-- SQL Editor, después de 0011_quote_item_costs.sql.

alter table quote_items add column if not exists costo_extras_manual numeric(10,2) not null default 0;

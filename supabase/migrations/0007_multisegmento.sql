-- Fase 5: generaliza la landing B2B (/empresas) a 5 segmentos (empresa,
-- emprendimiento, escuela, evento_social, grupo). Ejecutar una sola vez en
-- el SQL Editor, después de 0001-0006.

-- ---------------------------------------------------------------------------
-- corporate_leads: discriminador de segmento. Reutiliza la tabla existente
-- (menos riesgo que crear una tabla nueva / renombrar), con 'empresa' como
-- default para no romper los leads históricos.
-- ---------------------------------------------------------------------------

alter table corporate_leads add column if not exists segment text not null default 'empresa'
  check (segment in ('empresa', 'emprendimiento', 'escuela', 'evento_social', 'grupo'));

-- project_type/volume_range/design_status son preguntas específicas del
-- wizard de Empresas — los otros 4 segmentos no las usan, tienen su propio
-- set de preguntas (ver lib/segments.ts, formExtraFields). Se relajan a
-- nullable pero se le sigue exigiendo a los leads de segmento 'empresa' vía
-- el check de abajo, para no perder validación en el flujo que ya funciona.
alter table corporate_leads alter column project_type drop not null;
alter table corporate_leads alter column volume_range drop not null;
alter table corporate_leads alter column design_status drop not null;

alter table corporate_leads add constraint corporate_leads_empresa_fields_check
  check (
    segment <> 'empresa'
    or (project_type is not null and volume_range is not null and design_status is not null)
  );

-- Respuestas de los campos extra de los otros 4 segmentos (nombre de
-- emprendimiento, institución, tipo de evento, fecha, cantidad de
-- integrantes, etc. — ver textos-finales-segmentos.md). Se guardan como
-- jsonb en vez de sumar una columna nullable por cada pregunta de cada
-- segmento.
alter table corporate_leads add column if not exists extra_fields jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- categories: separa "categoría de catálogo general" (Lámparas, Hogar,
-- Pastelería) de "categoría de landing de segmento" (las 4 B2B actuales +
-- las nuevas), y a qué segmento pertenece cada una.
-- ---------------------------------------------------------------------------

alter table categories add column if not exists kind text not null default 'catalogo'
  check (kind in ('catalogo', 'segmento'));

alter table categories add column if not exists segment text
  check (segment in ('empresa', 'emprendimiento', 'escuela', 'evento_social', 'grupo'));

-- Marca las 4 categorías B2B existentes (cargadas en 0003_fase3.sql) como
-- kind='segmento', segment='empresa'.
update categories
set kind = 'segmento', segment = 'empresa'
where slug in ('merchandising-onboarding', 'presencia-de-marca',
               'premios-reconocimientos', 'prototipado-tecnico');

-- ---------------------------------------------------------------------------
-- Vista pública de tramos de precio (sin exponer costos internos). Nota: el
-- borrador original del documento asumía columnas tramo_desde/tramo_hasta/
-- descuento_pct — el schema real de price_tier_rules (0001_init.sql) usa
-- min_qty/max_qty/adjustment_pct, que es lo que expone esta vista.
-- security_invoker = false (definer) a propósito, para que 'anon' pueda
-- leerla sin necesitar una policy de RLS sobre price_tier_rules en sí (que
-- sigue siendo 100% privada). Si price_tier_rules sumara alguna columna de
-- costo interno en el futuro, no incluirla acá.
-- ---------------------------------------------------------------------------

drop view if exists public_price_tiers;
create view public_price_tiers
with (security_invoker = false) as
select min_qty, max_qty, adjustment_pct
from price_tier_rules
where is_default = true
order by min_qty;

grant select on public_price_tiers to anon;

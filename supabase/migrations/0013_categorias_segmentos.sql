-- Fase 5 (corrección post-auditoría): categorías de Showcase para los 4
-- segmentos no-empresa, pendiente desde requerimientos-lumo-llaveros-v2.md
-- §3 y backoffice-logica-multisegmento.md checklist #8 — se había agregado
-- la columna categories.kind/segment en 0007_multisegmento.sql pero nunca
-- se cargaron las categorías nuevas en sí (solo se migraron las 4 de
-- Empresa que ya existían desde 0003_fase3.sql). Ejecutar una sola vez en
-- el SQL Editor, después de 0012_costo_extras_manual.sql.

insert into categories (slug, name, sort_order, kind, segment)
select slug, name, sort_order, 'segmento', segment from (values
  ('packaging-y-merch', 'Packaging & Merch', 20, 'emprendimiento'),
  ('piezas-de-producto', 'Piezas de Producto', 21, 'emprendimiento'),
  ('egresos', 'Egresos', 22, 'escuela'),
  ('actividades-solidarias', 'Actividades Solidarias', 23, 'escuela'),
  ('casamientos', 'Casamientos', 24, 'evento_social'),
  ('cumpleanos-y-fiestas', 'Cumpleaños & Fiestas', 25, 'evento_social'),
  ('souvenirs', 'Souvenirs', 26, 'evento_social'),
  ('cuadros-y-comparsas', 'Cuadros & Comparsas', 27, 'grupo'),
  ('identidad-de-grupo', 'Identidad de Grupo', 28, 'grupo')
) as t(slug, name, sort_order, segment)
where not exists (select 1 from categories c where c.slug = t.slug);

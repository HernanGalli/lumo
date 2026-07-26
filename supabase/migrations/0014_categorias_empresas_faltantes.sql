-- Fase 5 (corrección post-auditoría, parte 2): al revisar la base real se
-- encontró que las 4 categorías B2B de Empresas (merchandising-onboarding,
-- presencia-de-marca, premios-reconocimientos, prototipado-tecnico), que
-- 0003_fase3.sql debía haber cargado, nunca llegaron a existir en esta base
-- — por eso el UPDATE de 0007_multisegmento.sql no encontró filas para
-- marcar como kind='segmento'/segment='empresa', y /llaveros/empresas
-- (y antes, /empresas) no tenían ninguna categoría real para mostrar en el
-- catálogo. Se insertan acá directamente con kind/segment ya resueltos
-- (esas columnas ya existen desde 0007). Ejecutar una sola vez en el SQL
-- Editor, después de 0013_categorias_segmentos.sql.

insert into categories (slug, name, sort_order, kind, segment)
select slug, name, sort_order, 'segmento', 'empresa' from (values
  ('merchandising-onboarding', 'Merchandising & Onboarding', 10),
  ('presencia-de-marca', 'Presencia de Marca', 11),
  ('premios-reconocimientos', 'Premios & Reconocimientos', 12),
  ('prototipado-tecnico', 'Prototipado Técnico', 13)
) as t(slug, name, sort_order)
where not exists (select 1 from categories c where c.slug = t.slug);

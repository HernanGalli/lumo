-- Fase 5 (corrección post-feedback de home): el catálogo general de
-- productos (/catalogo) nunca tuvo una categoría "Llaveros" — solo
-- Lámparas, Hogar, Pastelería y Empresas — a pesar de ser el producto
-- principal del sitio. Se agrega como categoría de catálogo real
-- (kind='catalogo'), distinta de las categorías de "segmento" usadas en
-- Showcase/landing (esas ya existen desde 0007/0013/0014). Ejecutar una
-- sola vez en el SQL Editor, después de 0014_categorias_empresas_faltantes.sql.

insert into categories (slug, name, sort_order, kind)
select 'llaveros', 'Llaveros', coalesce((select min(sort_order) - 1 from categories), 0), 'catalogo'
where not exists (select 1 from categories where slug = 'llaveros');

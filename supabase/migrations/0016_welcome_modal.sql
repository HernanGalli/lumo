-- Fase 5 (nueva funcionalidad): modal de bienvenida configurable desde
-- /admin/configuracion, sin tocar código. Apagado por defecto
-- (welcome_modal_enabled=false) hasta que el admin cargue una imagen real y
-- confirme el copy — así no aparece con contenido de relleno apenas se
-- corre esta migración. Ejecutar una sola vez en el SQL Editor, después de
-- 0015_categoria_llaveros_catalogo.sql.

insert into settings (key, value) values
  ('welcome_modal_enabled', 'false'),
  ('welcome_modal_image_url', '""'),
  ('welcome_modal_title', '"¡Bienvenido a LUMO!"'),
  ('welcome_modal_subtitle', '"Diseñamos y personalizamos llaveros para cualquier ocasión — empresas, emprendimientos, escuelas y eventos."'),
  ('welcome_modal_button_text', '"Cotizá tu llavero"'),
  ('welcome_modal_button_link', '"/llaveros"')
on conflict (key) do nothing;

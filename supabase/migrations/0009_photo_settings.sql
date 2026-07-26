-- Fase 5: claves de configuración para el pipeline automático de fotos
-- (compresión, filtro profesional). Ejecutar una sola vez en el SQL Editor,
-- después de 0008_segment_content.sql. No crea tablas nuevas — settings ya
-- existe desde 0001_init.sql, solo se suman filas.

insert into settings (key, value) values
  ('foto_filtro_activo', 'true'),
  ('foto_filtro_intensidad', '"suave"'),
  ('foto_ancho_maximo_px', '1600'),
  ('foto_calidad_webp', '80')
on conflict (key) do nothing;

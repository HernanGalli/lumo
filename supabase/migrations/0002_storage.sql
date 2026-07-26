-- Buckets de Storage para Fase 2 (catálogo, banners, showcase) y Fase 1
-- (PDFs de presupuestos, privados). Ejecutar una sola vez en el SQL Editor.

insert into storage.buckets (id, name, public)
values
  ('products', 'products', true),
  ('showcase', 'showcase', true),
  ('banners', 'banners', true),
  ('branding', 'branding', true),
  ('quotes', 'quotes', false)
on conflict (id) do nothing;

-- Lectura pública en los buckets de contenido (imágenes/video servidos directo
-- en el sitio). "quotes" queda sin policy de select para anon: privado.
create policy "public_buckets_read" on storage.objects for select to anon, authenticated
  using (bucket_id in ('products', 'showcase', 'banners', 'branding'));

create policy "quotes_bucket_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'quotes');

-- Escritura (subir/editar/borrar) solo para el admin autenticado, en cualquiera
-- de los buckets de la app.
create policy "app_buckets_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('products', 'showcase', 'banners', 'branding', 'quotes'));

create policy "app_buckets_admin_update" on storage.objects for update to authenticated
  using (bucket_id in ('products', 'showcase', 'banners', 'branding', 'quotes'))
  with check (bucket_id in ('products', 'showcase', 'banners', 'branding', 'quotes'));

create policy "app_buckets_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('products', 'showcase', 'banners', 'branding', 'quotes'));

-- Fase 4 (ajuste): biblioteca de medios reutilizable, tracking liviano de
-- visitas/clicks (sin PII, para el reporte semanal), y el mail de
-- notificación al dueño del negocio.

-- ---------------------------------------------------------------------------
-- Biblioteca de medios: catálogo de imágenes/videos subidos una vez y
-- reutilizables desde banners, catálogo y showcase.
-- ---------------------------------------------------------------------------

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  file_name text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index media_assets_tags_idx on media_assets using gin (tags);
create index media_assets_created_at_idx on media_assets (created_at desc);

alter table media_assets enable row level security;
create policy "media_assets_admin_all" on media_assets for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('media-library', 'media-library', true)
on conflict (id) do nothing;

create policy "media_library_bucket_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'media-library');
create policy "media_library_bucket_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media-library');
create policy "media_library_bucket_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media-library');
-- Lectura pública: las piezas elegidas "de la biblioteca" se copian al bucket
-- propio de cada entidad (banners/products/showcase) al confirmarlas, así que
-- el bucket de la biblioteca en sí no necesita ser público. Si en el futuro
-- se sirve directo desde acá, agregar policy de select para anon.

-- ---------------------------------------------------------------------------
-- Analytics liviano: solo agregados de path/evento, nada de IP, user agent
-- ni identificadores de sesión — alcanza para el reporte semanal.
-- ---------------------------------------------------------------------------

create table page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  created_at timestamptz not null default now()
);
create index page_views_created_at_idx on page_views (created_at desc);
create index page_views_path_idx on page_views (path);

create table click_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index click_events_created_at_idx on click_events (created_at desc);
create index click_events_event_name_idx on click_events (event_name);

alter table page_views enable row level security;
create policy "page_views_public_insert" on page_views for insert to anon with check (true);
create policy "page_views_admin_read" on page_views for select to authenticated using (true);

alter table click_events enable row level security;
create policy "click_events_public_insert" on click_events for insert to anon with check (true);
create policy "click_events_admin_read" on click_events for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Mail del dueño para notificaciones de actividad (leads/consultas) y el
-- reporte semanal. Editable después en /admin/configuracion.
-- ---------------------------------------------------------------------------

insert into settings (key, value) values
  ('owner_notification_email', '"hernan12galli@gmail.com"')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- El formulario de cotización ahora es el punto de entrada único para
-- cotizar (empresas, cuadros/equipos, eventos), no solo empresas — el
-- nombre de empresa deja de ser obligatorio para no trabar a quien cotiza a
-- título individual o de un grupo/equipo.
-- ---------------------------------------------------------------------------

alter table corporate_leads alter column company_name drop not null;

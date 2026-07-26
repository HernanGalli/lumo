-- Fase 3: leads corporativos (landing /empresas), logos de clientes, y
-- nuevos settings de configuración. Ejecutar una sola vez en el SQL Editor.
-- (Stock y Gmail ya tenían su esquema desde 0001_init.sql: materials.quantity_on_hand /
-- low_stock_threshold, y gmail_tokens / email_log.)

-- Evita descontar el mismo presupuesto del stock dos veces si pasa por
-- "aceptado" más de una vez (ej. lo cancelan y lo reactivan).
alter table quotes add column if not exists stock_deducted boolean not null default false;

create table corporate_leads (
  id uuid primary key default gen_random_uuid(),
  project_type text not null
    check (project_type in ('merchandising', 'presencia_marca', 'premios', 'prototipado')),
  volume_range text not null check (volume_range in ('10-50', '50-200', '200+')),
  design_status text not null
    check (design_status in ('tiene_logo_vectorial', 'tiene_stl_step', 'requiere_modelado')),
  reference_file_path text,
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  notes text,
  created_at timestamptz not null default now()
);

create table client_logos (
  id uuid primary key default gen_random_uuid(),
  name text,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table corporate_leads enable row level security;
alter table client_logos enable row level security;

-- Leads: cualquiera puede insertar (formulario público), solo admin lee/gestiona.
create policy "corporate_leads_public_insert" on corporate_leads for insert to anon with check (true);
create policy "corporate_leads_admin_read" on corporate_leads for select to authenticated using (true);
create policy "corporate_leads_admin_update" on corporate_leads for update to authenticated using (true) with check (true);
create policy "corporate_leads_admin_delete" on corporate_leads for delete to authenticated using (true);

-- Logos de clientes: lectura pública (carrusel), escritura solo admin.
create policy "client_logos_public_read" on client_logos for select to anon, authenticated using (true);
create policy "client_logos_admin_write" on client_logos for insert to authenticated with check (true);
create policy "client_logos_admin_update" on client_logos for update to authenticated using (true) with check (true);
create policy "client_logos_admin_delete" on client_logos for delete to authenticated using (true);

-- Buckets nuevos: "leads" privado (archivos de referencia adjuntados por
-- clientes potenciales), "client-logos" público (carrusel de confianza).
insert into storage.buckets (id, name, public)
values
  ('leads', 'leads', false),
  ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

create policy "leads_bucket_public_insert" on storage.objects for insert to anon
  with check (bucket_id = 'leads');
create policy "leads_bucket_admin_all" on storage.objects for select to authenticated
  using (bucket_id = 'leads');
create policy "leads_bucket_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'leads');

create policy "client_logos_bucket_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'client-logos');
create policy "client_logos_bucket_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'client-logos');
create policy "client_logos_bucket_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'client-logos');

-- Categorías del catálogo de soluciones corporativas de /empresas — el admin
-- las usa para etiquetar publicaciones de Showcase y que aparezcan agrupadas
-- ahí (reutiliza la infraestructura de categorías/showcase de Fase 2).
insert into categories (slug, name, sort_order)
select slug, name, sort_order from (values
  ('merchandising-onboarding', 'Merchandising & Onboarding', 10),
  ('presencia-de-marca', 'Presencia de Marca', 11),
  ('premios-reconocimientos', 'Premios & Reconocimientos', 12),
  ('prototipado-tecnico', 'Prototipado Técnico', 13)
) as t(slug, name, sort_order)
where not exists (select 1 from categories c where c.slug = t.slug);

-- Nuevos settings (Configuración ampliada). Valores en blanco/0 a completar
-- por el admin en /admin/configuracion.
insert into settings (key, value) values
  ('iva_pct', '0'),
  ('currency_code', '"UYU"'),
  ('company_rut', '""'),
  ('company_address', '""'),
  ('company_phone', '""'),
  ('email_reply_general', '"¡Hola! Recibimos tu consulta sobre nuestro catálogo, te contactamos a la brevedad. Gracias por escribirnos. — LUMO"'),
  ('email_reply_empresa', '"¡Hola! Recibimos tu consulta sobre tu proyecto para empresa, te contactamos a la brevedad para coordinar los detalles. — LUMO"')
on conflict (key) do nothing;

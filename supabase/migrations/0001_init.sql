-- LUMO backoffice schema (Fase 1-3, created up front to avoid re-migrating later)
-- Run once against a fresh Supabase project (SQL editor or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- Módulo A — contenido
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_original numeric(10,2) not null,
  price_offer numeric(10,2),
  is_offer boolean not null default false,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();

create table product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, category_id)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('video', 'image')),
  storage_path text not null,
  poster_storage_path text,
  cta_text text,
  cta_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_set_updated_at before update on banners
  for each row execute function set_updated_at();

create table showcase_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category_id uuid references categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger showcase_posts_set_updated_at before update on showcase_posts
  for each row execute function set_updated_at();

create table showcase_post_images (
  id uuid primary key default gen_random_uuid(),
  showcase_post_id uuid not null references showcase_posts(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('producto', 'contacto')),
  product_name text,
  name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'new' check (status in ('new', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Módulo B — comercial
-- ---------------------------------------------------------------------------

create table materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'kg',
  quantity_on_hand numeric(10,3) not null default 0, -- almacenado en gramos
  cost_per_kg numeric(10,2) not null,
  supplier text,
  low_stock_threshold numeric(10,3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger materials_set_updated_at before update on materials
  for each row execute function set_updated_at();

create table printers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  watts numeric(6,1) not null,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger settings_set_updated_at before update on settings
  for each row execute function set_updated_at();

create table price_tier_rules (
  id uuid primary key default gen_random_uuid(),
  is_default boolean not null default false,
  min_qty int not null,
  max_qty int, -- null = sin tope superior
  adjustment_pct numeric(5,2) not null default 0, -- positivo = recargo, negativo = descuento
  sort_order int not null default 0
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique,
  client_name text not null,
  client_contact text,
  status text not null default 'cotizado'
    check (status in ('cotizado', 'aceptado', 'en_produccion', 'entregado', 'cancelado')),
  delivery_estimate_date date,
  notes text,
  margin_pct numeric(5,2),
  valid_until date,
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quotes_set_updated_at before update on quotes
  for each row execute function set_updated_at();

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text,
  photo_storage_path text,
  peso_gramos numeric(10,2),
  tiempo_horas numeric(6,2),
  material_id uuid references materials(id),
  printer_id uuid references printers(id),
  tiempo_diseno_horas numeric(6,2),
  costo_material numeric(10,2) not null default 0,
  costo_energia numeric(10,2) not null default 0,
  costo_mano_obra numeric(10,2) not null default 0,
  costo_total numeric(10,2) not null default 0,
  base_unit_price numeric(10,2) not null default 0,
  quantity int not null default 1,
  sort_order int not null default 0
);

create table quote_price_tiers (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  min_qty int not null,
  max_qty int,
  unit_price numeric(10,2) not null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Fase 3 — Gmail
-- ---------------------------------------------------------------------------

create table gmail_tokens (
  id uuid primary key default gen_random_uuid(),
  access_token text,
  refresh_token text,
  expiry_date timestamptz,
  scope text,
  connected_email text,
  updated_at timestamptz not null default now()
);
create trigger gmail_tokens_set_updated_at before update on gmail_tokens
  for each row execute function set_updated_at();

create table email_log (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references inquiries(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  to_email text not null,
  subject text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent' check (status in ('sent', 'failed'))
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table products enable row level security;
alter table product_categories enable row level security;
alter table product_images enable row level security;
alter table banners enable row level security;
alter table showcase_posts enable row level security;
alter table showcase_post_images enable row level security;
alter table inquiries enable row level security;
alter table materials enable row level security;
alter table printers enable row level security;
alter table settings enable row level security;
alter table price_tier_rules enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table quote_price_tiers enable row level security;
alter table gmail_tokens enable row level security;
alter table email_log enable row level security;

-- Contenido: lectura pública solo de lo publicado/activo, escritura solo admin autenticado

create policy "categories_public_read" on categories for select to anon, authenticated using (true);
create policy "categories_admin_write" on categories for all to authenticated using (true) with check (true);

create policy "products_public_read" on products for select to anon using (status = 'published');
create policy "products_admin_read" on products for select to authenticated using (true);
create policy "products_admin_write" on products for insert to authenticated with check (true);
create policy "products_admin_update" on products for update to authenticated using (true) with check (true);
create policy "products_admin_delete" on products for delete to authenticated using (true);

create policy "product_categories_public_read" on product_categories for select to anon
  using (exists (select 1 from products p where p.id = product_id and p.status = 'published'));
create policy "product_categories_admin_all" on product_categories for all to authenticated using (true) with check (true);

create policy "product_images_public_read" on product_images for select to anon
  using (exists (select 1 from products p where p.id = product_id and p.status = 'published'));
create policy "product_images_admin_all" on product_images for all to authenticated using (true) with check (true);

create policy "banners_public_read" on banners for select to anon
  using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "banners_admin_all" on banners for all to authenticated using (true) with check (true);

create policy "showcase_posts_public_read" on showcase_posts for select to anon using (status = 'published');
create policy "showcase_posts_admin_all" on showcase_posts for all to authenticated using (true) with check (true);

create policy "showcase_post_images_public_read" on showcase_post_images for select to anon
  using (exists (select 1 from showcase_posts s where s.id = showcase_post_id and s.status = 'published'));
create policy "showcase_post_images_admin_all" on showcase_post_images for all to authenticated using (true) with check (true);

-- Inquiries: cualquiera puede insertar (formulario público), solo admin puede leer/gestionar
create policy "inquiries_public_insert" on inquiries for insert to anon with check (true);
create policy "inquiries_admin_read" on inquiries for select to authenticated using (true);
create policy "inquiries_admin_update" on inquiries for update to authenticated using (true) with check (true);
create policy "inquiries_admin_delete" on inquiries for delete to authenticated using (true);

-- Comercial: 100% privado, sin ninguna policy para anon
create policy "materials_admin_all" on materials for all to authenticated using (true) with check (true);
create policy "printers_admin_all" on printers for all to authenticated using (true) with check (true);
create policy "settings_admin_all" on settings for all to authenticated using (true) with check (true);
create policy "price_tier_rules_admin_all" on price_tier_rules for all to authenticated using (true) with check (true);
create policy "quotes_admin_all" on quotes for all to authenticated using (true) with check (true);
create policy "quote_items_admin_all" on quote_items for all to authenticated using (true) with check (true);
create policy "quote_price_tiers_admin_all" on quote_price_tiers for all to authenticated using (true) with check (true);
create policy "gmail_tokens_admin_all" on gmail_tokens for all to authenticated using (true) with check (true);
create policy "email_log_admin_all" on email_log for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Datos semilla mínimos (categorías + reglas de tiers de ejemplo)
-- Los valores de settings/tiers reales deben cargarse desde /admin/configuracion
-- o ajustarse en scripts/seed.ts (ver plan) antes de usar en producción.
-- ---------------------------------------------------------------------------

insert into categories (slug, name, sort_order) values
  ('lamparas', 'Lámparas', 0),
  ('hogar', 'Hogar', 1),
  ('pasteleria', 'Pastelería', 2),
  ('empresas', 'Empresas', 3);

insert into price_tier_rules (is_default, min_qty, max_qty, adjustment_pct, sort_order) values
  (true, 1, 9, 20, 0),
  (true, 10, 19, 0, 1),
  (true, 20, 49, -12, 2),
  (true, 50, null, -20, 3);

insert into settings (key, value) values
  ('ute_tariff_kwh', '0'),
  ('default_margin_pct', '40'),
  ('labor_hourly_rate', '0'),
  ('quote_legal_text', '""'),
  ('quote_payment_terms', '""'),
  ('quote_lead_time_text', '""');

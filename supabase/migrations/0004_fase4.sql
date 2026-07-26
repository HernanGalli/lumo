-- Fase 4: experiencia de personalización, banners B2B dinámicos y
-- renovación de presupuestos (código semántico, extras, control de PDF).
-- Ejecutar una sola vez en el SQL Editor, después de 0001/0002/0003.

-- ---------------------------------------------------------------------------
-- Banners: soporte para landing B2B (/empresas) con texto propio, además
-- del carrusel del Home.
-- ---------------------------------------------------------------------------

alter table banners add column if not exists page_target text not null default 'home'
  check (page_target in ('home', 'empresas'));
alter table banners add column if not exists headline text;
alter table banners add column if not exists body_text text;

-- ---------------------------------------------------------------------------
-- Quotes: código semántico editable, resumen del proyecto, y control de qué
-- secciones se ven en el PDF.
-- ---------------------------------------------------------------------------

alter table quotes add column if not exists project_label text;
alter table quotes add column if not exists project_summary text;

alter table quotes add column if not exists pdf_summary_mode text not null default 'resumen'
  check (pdf_summary_mode in ('resumen', 'desglose'));
alter table quotes add column if not exists pdf_summary_label text;
alter table quotes add column if not exists pdf_show_tiers boolean not null default true;
alter table quotes add column if not exists pdf_show_extras boolean not null default true;
alter table quotes add column if not exists pdf_show_project_summary boolean not null default true;
alter table quotes add column if not exists pdf_show_notes boolean not null default true;

-- ---------------------------------------------------------------------------
-- Quote items: distingue ítems de producción de adicionales (aros,
-- embalajes, envío) para que el PDF los agrupe por separado.
-- ---------------------------------------------------------------------------

alter table quote_items add column if not exists item_type text not null default 'producto'
  check (item_type in ('producto', 'extra'));

-- RLS ya cubre estas columnas: las policies existentes son "for all ...
-- using (true) with check (true)" a nivel de fila para authenticated, no
-- por columna, así que no hace falta crear policies nuevas.

-- ---------------------------------------------------------------------------
-- Fases de pago por defecto para el mercado uruguayo, solo si el admin
-- todavía no cargó nada en Configuración (no pisa un valor ya editado).
-- ---------------------------------------------------------------------------

update settings
set value = '"Seña del 50% para compra de materiales y arranque de producción. Saldo del 50% contra entrega. Aceptamos transferencia bancaria (BROU, Itaú, Santander) y Mercado Pago."'
where key = 'quote_payment_terms' and value = '""';

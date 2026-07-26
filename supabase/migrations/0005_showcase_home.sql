-- Fase 4 (ajuste): permite elegir qué publicaciones de Showcase aparecen en
-- el "Muro de Trabajos Reales" del Home, sin depender de que estén entre las
-- primeras N publicadas.

alter table showcase_posts add column if not exists show_on_home boolean not null default false;

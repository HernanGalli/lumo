-- Fase 5 (corrección post-testeo de admin y correo): las políticas de
-- insert público en `inquiries` y `corporate_leads` solo cubrían el rol
-- `anon` — si quien envía el formulario público (Contáctanos, "Me
-- interesa", el wizard de cotización de /llaveros) está en un navegador
-- con una sesión de admin activa (rol `authenticated`), el insert se
-- rechaza con "new row violates row-level security policy" porque ninguna
-- policy cubre ese rol para insert. Se amplían a `anon, authenticated` —
-- cualquiera puede seguir insertando (el check sigue siendo `true`), esto
-- solo agrega el rol que faltaba. Ejecutar una sola vez en el SQL Editor,
-- después de 0016_welcome_modal.sql.

drop policy if exists "inquiries_public_insert" on inquiries;
create policy "inquiries_public_insert" on inquiries
  for insert to anon, authenticated with check (true);

drop policy if exists "corporate_leads_public_insert" on corporate_leads;
create policy "corporate_leads_public_insert" on corporate_leads
  for insert to anon, authenticated with check (true);

-- Mismo criterio para el tracking de analytics (menos crítico, pero mismo
-- gap potencial si el admin navega el sitio público logueado).
drop policy if exists "page_views_public_insert" on page_views;
create policy "page_views_public_insert" on page_views
  for insert to anon, authenticated with check (true);

drop policy if exists "click_events_public_insert" on click_events;
create policy "click_events_public_insert" on click_events
  for insert to anon, authenticated with check (true);

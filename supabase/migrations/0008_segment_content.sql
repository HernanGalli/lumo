-- Fase 5: contenido editable de cada segmento de /llaveros (hero, pilares,
-- mensaje de WhatsApp), gestionado desde /admin/segmentos. Reemplaza la idea
-- de tener este copy hardcodeado en lib/segments.ts. Ejecutar una sola vez
-- en el SQL Editor, después de 0007_multisegmento.sql.

create table if not exists segment_content (
  segment text primary key
    check (segment in ('empresa', 'emprendimiento', 'escuela', 'evento_social', 'grupo')),
  hero_title text not null,
  hero_subtitle text not null,
  pilar_1_titulo text not null,
  pilar_1_texto text not null,
  pilar_2_titulo text not null,
  pilar_2_texto text not null,
  pilar_3_titulo text not null,
  pilar_3_texto text not null,
  pilar_4_titulo text not null,
  pilar_4_texto text not null,
  whatsapp_message text not null,
  updated_at timestamptz not null default now()
);

create trigger segment_content_set_updated_at before update on segment_content
  for each row execute function set_updated_at();

alter table segment_content enable row level security;

-- Lectura pública: el sitio muestra este copy a cualquier visitante.
create policy "segment_content_public_read" on segment_content
  for select to anon, authenticated using (true);
-- Escritura solo admin, mismo criterio que el resto de tablas de contenido.
create policy "segment_content_admin_write" on segment_content
  for insert to authenticated with check (true);
create policy "segment_content_admin_update" on segment_content
  for update to authenticated using (true) with check (true);
create policy "segment_content_admin_delete" on segment_content
  for delete to authenticated using (true);

-- Seed con el copy final de textos-finales-segmentos.md — no son
-- placeholders, es el texto real listo para publicar (editable después
-- desde /admin/segmentos sin tocar código).
insert into segment_content (
  segment, hero_title, hero_subtitle,
  pilar_1_titulo, pilar_1_texto,
  pilar_2_titulo, pilar_2_texto,
  pilar_3_titulo, pilar_3_texto,
  pilar_4_titulo, pilar_4_texto,
  whatsapp_message
) values
(
  'empresa',
  'Regalos corporativos que representan tu marca',
  'Llaveros y merchandising a medida, sin mínimos imposibles y con la calidad que tu empresa necesita.',
  'Sustentabilidad', 'Materiales pensados para durar y producción bajo demanda, sin stock que se desperdicia.',
  'Sin mínimos costosos', 'Pedidos chicos o grandes, con un precio que se ajusta a la cantidad real que necesitás.',
  'Diseño a medida', 'Tu logo, tus colores, tu identidad — cada pieza pensada para tu marca.',
  'Garantía de calidad', 'Revisamos cada lote antes de la entrega.',
  '¡Hola! Quiero cotizar un pedido corporativo de llaveros para mi empresa.'
),
(
  'emprendimiento',
  'Tu marca, en la mano de tus clientes',
  'Sin mínimos altos. Empezá con pocas unidades y escalá cuando tu emprendimiento crezca.',
  'Sin mínimos altos', 'Pedís desde 10 unidades, ideal para probar antes de escalar.',
  'Precio que baja con la cantidad', 'Cuantas más unidades, menor el costo por llavero.',
  'Te ayudamos con el diseño', 'Si no tenés un logo listo, te asesoramos para dejarlo listo para producción.',
  'Entrega rápida', 'Pensado para que puedas vender o regalar sin esperar semanas.',
  '¡Hola! Tengo un emprendimiento y quiero hacer llaveros personalizados con mi marca.'
),
(
  'escuela',
  'Ese recuerdo que se queda para siempre',
  'Llaveros de egreso, aniversario o para juntar fondos con tu grupo. Fácil de coordinar con toda la clase.',
  'Coordinación simple', 'Un solo referente coordina todo el pedido del grupo.',
  'Precio grupal', 'Cuantos más compañeros se sumen, mejor precio para todos.',
  'Diseños para chicos y jóvenes', 'Adaptamos el diseño a la edad y el estilo del grupo.',
  'Envío o retiro flexible', 'Coordinamos la entrega como te resulte más cómodo.',
  '¡Hola! Somos un grupo de la escuela/liceo y queremos hacer llaveros de egreso.'
),
(
  'evento_social',
  'Para que ese día se recuerde en la mano de cada invitado',
  'Casamientos, cumpleaños, baby showers. Vos elegís el diseño, nosotros lo hacemos realidad.',
  'Personalización total', 'Colores, nombres, fechas: el llavero se adapta 100% a tu evento.',
  'Ideal para souvenirs', 'Un regalo que tus invitados van a usar, no a guardar en un cajón.',
  'Cantidades chicas o grandes', 'Desde una mesa de 10 invitados hasta un salón completo.',
  'Fechas coordinadas con tu evento', 'Nos organizamos con la fecha de tu evento como prioridad.',
  '¡Hola! Estoy organizando un evento y quiero cotizar llaveros personalizados como souvenir.'
),
(
  'grupo',
  'Lo que los une, en un llavero',
  'Para el cuadro, la comparsa, el grupo de amigos. Identidad compartida, en un objeto que se usa todos los días.',
  'Identidad compartida', 'Un diseño que representa a todo el grupo, no solo a una persona.',
  'Precio por volumen', 'Cuantos más integrantes participen, menor precio por unidad.',
  'Producción rápida', 'Pensado para que llegue a tiempo para tu próximo evento o encuentro.',
  'Coordinación con un solo contacto', 'Una sola persona del grupo coordina todo el pedido.',
  '¡Hola! Somos un grupo/equipo y queremos hacer llaveros con nuestra identidad.'
)
on conflict (segment) do nothing;

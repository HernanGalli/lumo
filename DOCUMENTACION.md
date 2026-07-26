# LUMO — Documentación completa

Documentación de referencia del sitio + backoffice de LUMO (diseño e
impresión 3D). Cubre arquitectura, modelo de datos, cada funcionalidad por
fase, cómo usar el backoffice día a día, seguridad, deploy y problemas
conocidos.

> Para la puesta en marcha rápida (crear el proyecto de Supabase, variables
> de entorno, migraciones) ver [README.md](README.md). Este documento es la
> referencia completa una vez que ya está andando.

---

## 1. Qué es esto

Dos partes en un mismo proyecto Next.js:

- **Sitio público** (`/`, `/showcase`, `/empresas`): lo que ve cualquier
  visitante — catálogo, banners, portfolio de trabajos a medida, landing
  para empresas con formulario de cotización.
- **Backoffice** (`/admin/*`): panel privado, protegido por login, donde el
  dueño gestiona todo el contenido público y lleva el control comercial
  (costos, presupuestos, stock, ventas, leads).

Todo corre sobre **Next.js 16 (App Router) + Supabase** (Postgres + Auth +
Storage), desplegado en **Vercel**.

---

## 2. Arquitectura y stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Estilos | CSS propio portado del sitio original (`app/globals.css`) + Tailwind v4 para el admin y las secciones nuevas |
| Backend | Supabase: Postgres con RLS, Auth (un solo usuario admin), Storage (buckets por tipo de contenido) |
| Mutaciones | Server Actions (`"use server"`), todas validadas con `zod` |
| PDF | `@react-pdf/renderer` (sin Puppeteer, más liviano para Vercel) |
| Mail | Gmail API vía OAuth2 (`google-auth-library`), sin dependencia pesada de `googleapis` |
| Drag & drop | `@dnd-kit` |
| Hosting | Vercel (deploy automático desde `main`, previews por rama/PR) |
| Tests | Vitest (`lib/pricing.test.ts`) |

### Por qué estas decisiones

- **Server Actions en vez de una API REST propia**: menos código, validación
  y mutación viven juntas, y Next.js maneja la revalidación de caché
  (`revalidatePath`) automáticamente.
- **RLS en vez de una capa de autorización a mano**: cada tabla define en la
  base de datos quién puede leer/escribir qué. Así, aunque alguien tuviera
  la `anon key` (que es pública, viaja al navegador), no puede leer ni
  escribir nada que no esté explícitamente permitido.
- **Service-role client solo donde es imprescindible**: la mayoría del
  código usa el cliente "normal" (respeta RLS, atado a la sesión del
  usuario). El cliente con `service_role` (`lib/supabase/admin.ts`, bypassa
  RLS) se usa únicamente en: el script de seed, y las rutas de Gmail que
  necesitan leer `gmail_tokens`/`settings` desde un contexto público (por
  ejemplo, la auto-respuesta a un formulario que llena un visitante anónimo,
  que no tiene sesión de admin).

---

## 3. Estructura de carpetas

```
app/
  (public)/              sitio público — layout con nav/footer/whatsapp/modales
    page.tsx              home (hero + catálogo + a-medida)
    showcase/              portfolio de trabajos a medida
    empresas/              landing B2B
  admin/
    login/                 login
    (dashboard)/           todo lo protegido, con sidebar
      calculadora/
      presupuestos/
      ventas/
      catalogo/
      banners/
      showcase/
      leads/                consultas del formulario de empresas
      logos-clientes/       carrusel de confianza de /empresas
      materiales/           filamentos/resinas + impresoras + stock
      configuracion/
  api/
    quotes/[id]/pdf/       genera y descarga el PDF de un presupuesto
    gmail/connect/         arranca el OAuth de Gmail
    gmail/callback/        recibe el código de Google y guarda los tokens

components/
  public/                 componentes del sitio público
  public/empresas/        componentes específicos de la landing B2B
  admin/                  componentes del backoffice
  shared/                 tema claro/oscuro

lib/
  pricing.ts              fórmulas de costo/precio (puras, sin dependencias)
  slug.ts                 generación de slugs
  settings.ts             definición de los campos de Configuración
  banners.ts              filtro de banners activos por fecha
  actions/                Server Actions, un archivo por entidad
  supabase/                client.ts / server.ts / admin.ts / storage.ts / middleware.ts
  gmail/                  cliente OAuth + envío + cifrado de tokens
  pdf/                    plantilla y generación del PDF de presupuestos

supabase/migrations/      esquema SQL, se corre en orden en el SQL Editor
scripts/seed.ts           migración única del catálogo/banners originales
legacy-site/               sitio estático original (referencia histórica)
proxy.ts                   protege /admin/* (Next 16 renombró "middleware" a "proxy")
```

---

## 4. Modelo de datos

Todas las tablas tienen RLS activado. Patrón general: lectura pública
(`anon`) solo de lo publicado/activo en tablas de contenido; lo comercial es
100% privado (`authenticated` = el único admin).

### Contenido (Fase 2)

| Tabla | Para qué |
|---|---|
| `categories` | Categorías del catálogo (Lámparas, Hogar, Pastelería, Empresas, + las 4 de la landing B2B) |
| `products` | Productos del catálogo, con precio, oferta, destacado, estado |
| `product_categories` | Relación N a N producto↔categoría, con orden propio por categoría |
| `product_images` | Fotos de cada producto, ordenables |
| `banners` | Banners del home (video o imagen), con programación por fecha |
| `showcase_posts` / `showcase_post_images` | Publicaciones sin precio (portfolio) |
| `inquiries` | Mensajes del formulario de contacto general / "me interesa" de un producto |

### Comercial (Fase 1 y 3)

| Tabla | Para qué |
|---|---|
| `materials` | Filamentos/resinas: costo por kg, stock en gramos, umbral de alerta |
| `printers` | Impresoras: nombre y consumo en W |
| `settings` | Configuración global, clave/valor (ver tabla completa más abajo) |
| `price_tier_rules` | Reglas de descuento/recargo por cantidad (las de por defecto) |
| `quotes` | Presupuestos: cliente, estado, fechas, `stock_deducted` |
| `quote_items` | Ítems de un presupuesto (calculados o manuales) |
| `quote_price_tiers` | Tabla de precios por cantidad ya generada para un presupuesto puntual |

### Fase 3 — B2B y Gmail

| Tabla | Para qué |
|---|---|
| `corporate_leads` | Consultas del formulario de `/empresas` (tipo de proyecto, volumen, archivo adjunto, datos de contacto) |
| `client_logos` | Logos para el carrusel de confianza de `/empresas` |
| `gmail_tokens` | Tokens OAuth de Gmail, cifrados (fila única) |
| `email_log` | Historial de mails enviados (presupuestos + auto-respuestas) |

### Buckets de Storage

| Bucket | Público | Contenido |
|---|---|---|
| `products` | Sí | Fotos de catálogo |
| `showcase` | Sí | Fotos de publicaciones sin precio |
| `banners` | Sí | Videos/imágenes del hero |
| `branding` | Sí | Logo de LUMO |
| `client-logos` | Sí | Logos del carrusel de confianza |
| `quotes` | No | (reservado para cachear PDFs generados) |
| `leads` | No | Archivos de referencia que adjuntan los leads de `/empresas` |

---

## 5. Variables de entorno

Ver [.env.local.example](.env.local.example). Resumen de qué es cada una:

| Variable | Dónde se usa | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor (respeta RLS) | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server-side, bypassa RLS | Sí |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth de Gmail | Solo si usás envío de mail |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | Cifra los tokens de Gmail en la base | Solo si usás envío de mail |

Todas se cargan en dos lugares por separado: `.env.local` (tu compu, no se
sube a git) y **Vercel → Settings → Environment Variables** (producción).
Son independientes — cambiar una no actualiza la otra automáticamente.

---

## 6. Fase 1 — Calculadora y presupuestos

### Fórmulas (`lib/pricing.ts`, sin dependencias, testeadas)

```
costo_material   = (peso_gramos / 1000) × costo_por_kg
costo_energia    = (consumo_watts / 1000) × tiempo_horas × tarifa_UTE_kWh
costo_mano_obra  = tiempo_diseño_horas × valor_hora
costo_total      = costo_material + costo_energia + costo_mano_obra
precio_sugerido  = costo_total × (1 + margen% / 100)
```

Tabla de precios por cantidad: cada regla (`price_tier_rules` o las propias
de un presupuesto en `quote_price_tiers`) define un rango de cantidad y un
`adjustment_pct` (positivo = recargo, negativo = descuento) que se aplica
sobre el precio base.

### Flujo de un presupuesto

1. `/admin/calculadora` — herramienta suelta para probar números rápido, no
   graba nada. Útil para cotizar al toque en una consulta.
2. `/admin/presupuestos/nuevo` — creás el presupuesto (cliente, contacto,
   fecha de entrega, validez, margen).
3. Dentro del presupuesto: agregás ítems (calculados desde material +
   impresora, o precio manual), podés **editar** un ítem existente, y borrar.
4. "Generar tabla de precios" toma un precio base (por defecto, el del
   primer ítem) y aplica las reglas por defecto de Configuración — después
   se puede editar cada precio a mano.
5. Exportar: **PDF** (con tu logo real, datos fiscales si los cargaste, y
   nota de IVA si corresponde) o **imagen** (para mandar por WhatsApp,
   se genera del lado del cliente con `html-to-image`, no pega en el
   servidor).
6. **Enviar por mail** (si Gmail está conectado): manda el PDF adjunto,
   queda registrado en el historial de ese presupuesto.
7. Cambiar el estado a **Aceptado** dispara el descuento automático de
   stock de los materiales usados (ver Fase 3).

---

## 7. Fase 2 — Contenido web

### Catálogo (`/admin/catalogo`)

- Categorías: creás, renombrás o borrás las que quieras (no son fijas).
- Productos: nombre, descripción, precio (+ precio de oferta opcional),
  destacado, estado (publicado/borrador), y sus categorías.
- Fotos: subís varias por producto, las reordenás arrastrando.
- Orden dentro de una categoría: elegís la categoría en las pestañas de
  arriba y arrastrás los productos — ese orden es el que ve el público en
  esa categoría específica (no hay un "orden global" único, cada categoría
  tiene el suyo).

### Banners (`/admin/banners`)

- Video (loop corto) o imagen.
- Texto y link del botón editables.
- Programables por fecha (`Activo desde` / `Activo hasta`) — si no ponés
  fechas, queda activo indefinidamente mientras el toggle "Activo" esté
  prendido.
- Se reordenan arrastrando; ese orden es el del carrusel del hero.

### Showcase (`/admin/showcase`)

Publicaciones sin precio — portfolio de trabajos a medida. Título,
descripción, categoría, varias fotos. Se muestran en `/showcase` y también
alimentan el "Catálogo de Soluciones Corporativas" de `/empresas` si están
etiquetadas con alguna de las 4 categorías B2B (ver sección 8).

### Sitio público

- Todo el contenido (productos, banners, showcase) se lee en vivo desde
  Supabase — no hay nada hardcodeado como en el sitio viejo.
- Formulario de contacto / "me interesa": guarda en `inquiries`, dispara la
  auto-respuesta de mail si Gmail está conectado.
- Burbuja de WhatsApp flotante en todas las páginas (mensaje distinto en
  `/empresas`, ver sección 8).
- Fade-in al hacer scroll y zoom al pasar el mouse sobre las fotos, sin
  librerías externas.

---

## 8. Fase 3 — Stock, Gmail, presupuestos avanzados, landing B2B

### Control de stock (`/admin/materiales`)

- Cada material tiene stock actual (en gramos) y un umbral de alerta.
- Si el stock cae por debajo del umbral, la fila se marca con un badge
  "Bajo" y aparece un aviso arriba de la tabla.
- Al aceptar un presupuesto (estado → "Aceptado"), se descuenta
  automáticamente el peso × cantidad de cada ítem que tenga material
  asociado. Solo pasa una vez por presupuesto aunque cambie de estado varias
  veces (columna `quotes.stock_deducted`).

### Integración Gmail

- **Conectar**: `/admin/configuracion` → botón "Conectar Gmail" → OAuth de
  Google → vuelve con la cuenta conectada.
- **Enviar presupuestos**: botón dentro de cada presupuesto, manda el PDF
  adjunto y queda en el historial.
- **Auto-respuesta**: si Gmail está conectado, cualquier envío del
  formulario de contacto general o del formulario de empresas dispara
  automáticamente un mail de confirmación (textos editables en
  Configuración: `email_reply_general` y `email_reply_empresa`). Si Gmail no
  está conectado, simplemente no se manda nada — no rompe el formulario.
- **Seguridad de los tokens**: se guardan cifrados (AES-256-GCM) en
  `gmail_tokens`, nunca en texto plano. La clave de cifrado es
  `GMAIL_TOKEN_ENCRYPTION_KEY`.
- Detalle técnico: como la auto-respuesta la dispara un visitante anónimo
  (sin sesión de admin), esa lectura de `gmail_tokens`/`settings` usa el
  cliente con `service_role` — es la única forma de que funcione sin abrir
  esas tablas a cualquiera por RLS.

### Configuración ampliada (`/admin/configuracion`)

Todos los campos disponibles hoy:

| Campo | Para qué |
|---|---|
| Tarifa UTE ($/kWh) | Costo de energía en la calculadora |
| Margen por defecto (%) | Precio sugerido |
| Valor hora de mano de obra | Costo de diseño |
| IVA (%) | Se muestra como nota en los presupuestos si es mayor a 0 |
| Moneda (código ISO) | Guardado, a futuro para mostrar en otras monedas |
| RUT / dirección / teléfono de LUMO | Aparecen en el encabezado del presupuesto |
| Tiempo de entrega / forma de pago / condiciones | Texto libre del presupuesto |
| Auto-respuesta general / de empresa | Texto de los mails automáticos |
| Reglas de precio por cantidad | Tabla editable de tramos y % de ajuste |
| Gmail | Conectar/desconectar |

### Landing `/empresas`

Pedida específicamente por UX para diferenciar el discurso "decorativo" del
catálogo consumidor del discurso "soluciones de marca / volumen /
sustentabilidad" para empresas. Estructura de arriba a abajo:

1. **Hero corporativo**: título/bajada fijos, dos CTA — "Solicitar
   Cotización Corporativa" (baja al formulario) y "Pedir Kit de Muestras"
   (abre WhatsApp con un mensaje específico).
2. **4 pilares**: Sustentabilidad, Sin mínimos costosos, Diseño a medida,
   Garantía de calidad — contenido fijo, no editable desde el admin (es
   texto institucional, no contenido dinámico).
3. **Catálogo de soluciones corporativas**: agrupa publicaciones de
   Showcase por 4 categorías fijas (`merchandising-onboarding`,
   `presencia-de-marca`, `premios-reconocimientos`, `prototipado-tecnico`,
   ya creadas por la migración 0003). Para que aparezca algo acá, andá a
   `/admin/showcase` y etiquetá publicaciones con esas categorías.
4. **Carrusel de logos de clientes**: se gestiona en
   `/admin/logos-clientes`. Si no hay ninguno cargado, la sección
   directamente no se muestra (no queda un hueco vacío).
5. **Proceso en 4 pasos**: contenido fijo (Brief → Muestra → Producción →
   Entrega).
6. **Formulario guiado de cotización** (4 pasos): tipo de proyecto, volumen
   estimado, estado del diseño + archivo adjunto opcional (logo, .stl,
   .step, .pdf, .zip, hasta 20MB), datos de contacto. Al enviarse:
   - Sube el archivo (si hay) al bucket privado `leads`.
   - Inserta en `corporate_leads`.
   - Dispara la auto-respuesta de empresa si Gmail está conectado.
   - Aparece en `/admin/leads` con link de descarga del archivo (URL firmada,
     válida 1 hora) y campo de notas internas + estado (Nuevo/Contactado/Cerrado).

La burbuja de WhatsApp cambia el mensaje predefinido automáticamente cuando
estás en cualquier página bajo `/empresas`.

---

## 9. Seguridad

- **RLS en todas las tablas.** Nada es accesible sin una policy explícita.
  Tablas comerciales (`quotes`, `materials`, `gmail_tokens`, etc.) no tienen
  ninguna policy para `anon` — ni siquiera de lectura.
- **Un solo usuario admin**, creado a mano en el dashboard de Supabase. No
  hay registro público en ningún lado.
- **Validación con `zod`** en todas las Server Actions, tanto las del admin
  como las públicas (contacto, leads).
- **Validación de archivos subidos**: tipo y tamaño máximo, tanto en fotos
  (`lib/supabase/storage.ts`) como en los adjuntos de leads
  (`lib/actions/corporateLeads.ts`).
- **Headers de seguridad + CSP** en `next.config.ts` (incluye `media-src`
  para que los videos de Supabase Storage carguen bien).
- **Tokens de Gmail cifrados** en reposo, nunca en texto plano.
- **Service-role key** solo se usa server-side, nunca llega al navegador.

---

## 10. Deploy

- **Vercel** desplegado desde `main`, con preview automático por rama/PR
  (así probamos Fase 3 en un preview antes de mergear).
- **Framework Preset** en Vercel tiene que ser "Next.js" — si en algún
  momento un deploy empieza a tirar 404 en todo, es la primera cosa a
  revisar en Settings → Build and Deployment.
- Variables de entorno se cargan por separado en Vercel (no las toma de
  `.env.local`).
- Redirect URI de Gmail en Google Cloud Console tiene que apuntar al dominio
  real de producción: `https://<tu-dominio>.vercel.app/api/gmail/callback`.

---

## 11. Problemas conocidos y cómo resolverlos

**"Missing required parameter: redirect_uri" al conectar Gmail**
Pasa cuando `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` no están cargados (o
están vacíos) en el entorno donde estás probando. Revisá que estén en
Vercel (producción) o en `.env.local` (local), y que hayas redeployado
después de cargarlas.

**"redirect_uri_mismatch" al conectar Gmail**
La URL en "Authorized redirect URIs" de Google Cloud Console no coincide
exactamente con `https://<tu-dominio>/api/gmail/callback` (protocolo,
dominio y path tienen que ser idénticos, sin barra final).

**Deploy nuevo muestra 404 en todo**
Chequeá Framework Preset en Vercel (tiene que decir "Next.js", no "Other").

**Supabase deja de responder / proyecto "pausado"**
Plan Free se pausa a los 7 días sin actividad. Se reactiva manualmente desde
el dashboard de Supabase, no se pierden datos.

**Un producto/banner/showcase no aparece en el sitio**
Revisá que `status` sea "Publicado" (no "Borrador") y, en banners, que esté
"Activo" y dentro de su rango de fechas si programaste alguna.

---

## 12. Qué no está hecho todavía (ideas a futuro)

- Multi-usuario / permisos (hoy es un solo admin).
- Cachear el PDF generado en el bucket `quotes` (hoy se regenera en cada
  descarga/envío — funciona bien para el volumen actual, pero si en algún
  momento se vuelve lento vale la pena cachear).
- Aplicar el `currency_code` configurado a los formatos de precio del sitio
  público y la calculadora (hoy están fijos en pesos uruguayos).
- Compresión automática de imágenes/videos subidos (hoy se suben tal cual
  las sube el admin; algunas fotos del catálogo original pesan más de 1MB).

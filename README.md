# LUMO

Sitio + backoffice de LUMO (diseño e impresión 3D). Next.js (App Router) +
Supabase. El sitio estático original quedó archivado en
[`legacy-site/`](legacy-site) como referencia histórica — ya fue portado a
Next.js en `app/(public)/`.

Estado actual: **Fases 1, 2 y 3 completas** (rama `fase-3`, sin mergear a
`main` todavía — pendiente de revisión):
- Fase 1: calculadora de costos, presupuestos con precios escalonados,
  export a PDF/imagen.
- Fase 2: catálogo/banners/showcase con CRUD y Storage, sitio público
  migrado a Next.js.
- Fase 3: control de stock, integración Gmail (envío de presupuestos +
  auto-respuesta), logo real y edición de ítems en presupuestos, más
  configuración (IVA, datos de empresa), landing B2B en `/empresas` con
  formulario guiado de cotización corporativa.

## Puesta en marcha

### 1. Crear el proyecto de Supabase

Desde [supabase.com](https://supabase.com) (no se puede automatizar sin tu
cuenta):

1. Creá un proyecto nuevo (plan Free alcanza para arrancar).
2. En **Project Settings → API**, copiá `Project URL` y `anon public key`.
3. En **Project Settings → API → Service role**, copiá la `service_role key`
   (secreta, nunca la compartas ni la subas a git).

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` con los valores del paso anterior. `.env.local`
no se versiona (ya está en `.gitignore`). Las variables de Gmail (paso 6) se
completan después.

### 3. Correr las migraciones

En el SQL Editor del dashboard de Supabase, pegá y ejecutá **en orden** el
contenido de cada archivo de `supabase/migrations/`:

1. `0001_init.sql` — todas las tablas (contenido + comercial), RLS, categorías
   base, reglas de tiers de ejemplo, settings en 0.
2. `0002_storage.sql` — buckets de Storage (productos, banners, showcase,
   presupuestos, branding) y sus políticas.
3. `0003_fase3.sql` — leads corporativos, logos de clientes, categorías del
   catálogo B2B de `/empresas`, y los nuevos settings (IVA, datos de empresa,
   textos de auto-respuesta).

### 4. Crear tu usuario admin

En **Authentication → Users**, click en "Add user" → "Create new user" y
cargá tu email/contraseña. No hay flujo de registro público a propósito:
este es el único usuario que va a poder entrar a `/admin`.

### 5. Migrar el catálogo/banners originales (una sola vez)

```bash
npx tsx scripts/seed.ts
```

Sube a Supabase los 7 productos, los 3 videos de banner y el logo que estaban
hardcodeados en el sitio viejo (`legacy-site/js/productos.js`).

### 6. Conectar Gmail (opcional, para envío de presupuestos y auto-respuesta)

1. En [Google Cloud Console](https://console.cloud.google.com), creá un
   proyecto (o usá uno existente) y habilitá la **Gmail API**.
2. **APIs & Services → OAuth consent screen**: configurá una pantalla básica
   (tipo "External" alcanza si vas a usar tu propia cuenta de Gmail como
   usuario de prueba).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**,
   tipo "Web application". En **Authorized redirect URIs** agregá:
   - `http://localhost:3000/api/gmail/callback` (desarrollo)
   - `https://tu-dominio-de-vercel.vercel.app/api/gmail/callback` (producción)
4. Copiá el `Client ID` y `Client secret` a `.env.local`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
5. Generá una clave para cifrar los tokens en reposo y pegala en
   `GMAIL_TOKEN_ENCRYPTION_KEY`:
   ```bash
   openssl rand -base64 32
   ```
6. Con el server corriendo, andá a `/admin/configuracion` → sección **Gmail**
   → "Conectar Gmail" y aceptá el consentimiento con la cuenta de LUMO.

Sin esto configurado, el resto del backoffice funciona igual — solo no vas a
poder mandar presupuestos por mail ni tener auto-respuesta a consultas.

### 7. Completar la configuración de negocio

Con el proyecto corriendo (`npm run dev`) y ya logueado en `/admin`, andá a:

- **`/admin/materiales`**: filamentos/resinas (costo por kg, stock en gramos,
  umbral de alerta de stock bajo) e impresoras (consumo en W).
- **`/admin/configuracion`**: tarifa UTE, márgenes, valor hora, IVA, datos
  fiscales de LUMO (RUT/dirección/teléfono para el presupuesto), reglas de
  precio por cantidad, y los textos de auto-respuesta de mail.
- **`/admin/logos-clientes`**: logos para el carrusel de confianza de
  `/empresas`.

### 8. Correr en desarrollo

```bash
npm install
npm run dev
npm run test   # tests de las fórmulas de la calculadora (lib/pricing.ts)
```

## Estructura

- `app/(public)/` — sitio público (home, showcase, `/empresas`).
- `app/admin/(dashboard)/` — backoffice protegido.
- `app/admin/login/` — login (Supabase Auth).
- `app/api/gmail/` — OAuth de Gmail (connect/callback).
- `app/api/quotes/[id]/pdf/` — generación de PDF de presupuestos.
- `lib/pricing.ts` — fórmulas de costo/precio, sin dependencias externas.
- `lib/actions/` — Server Actions (mutaciones, todas validadas con `zod`).
- `lib/gmail/` — cliente OAuth + envío de Gmail, cifrado de tokens.
- `lib/pdf/` — plantilla y generación de PDF (`@react-pdf/renderer`).
- `lib/supabase/storage.ts` — helper de subida a Storage con validación.
- `supabase/migrations/` — esquema SQL, en orden.
- `scripts/seed.ts` — migración única del catálogo/banners originales.
- `legacy-site/` — sitio estático original, referencia histórica.
- `proxy.ts` — protege `/admin/*` verificando la sesión de Supabase (Next.js
  16 renombró "middleware" a "proxy"; misma función).

## Deploy

Pensado para Vercel. Cargá las mismas variables de entorno de `.env.local`
(incluidas las de Gmail si las usás) en **Project Settings → Environment
Variables** del proyecto de Vercel, y agregá la URL de producción como
Authorized redirect URI en Google Cloud Console (paso 6 de arriba). Tené en
cuenta las limitaciones del plan gratuito: Supabase Free se pausa a los 7
días sin actividad, y Vercel Hobby es para uso no comercial.

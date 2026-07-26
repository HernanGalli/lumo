# LUMO

Sitio + backoffice de LUMO (diseño e impresión 3D). Next.js (App Router) +
Supabase. El sitio público estático original quedó archivado en
[`legacy-site/`](legacy-site) como referencia para portarlo en Fase 2 (ver
`.claude/plans` para el plan técnico completo).

Estado actual: **Fase 1 (MVP)** — calculadora de costos y generador de
presupuestos con precios escalonados, exportables a PDF/imagen. El sitio
público (`/`) todavía es el placeholder que genera Next.js; se porta en Fase 2.

## Puesta en marcha

### 1. Crear el proyecto de Supabase

Esto lo tenés que hacer vos desde [supabase.com](https://supabase.com) (no es
algo que se pueda automatizar sin tu cuenta):

1. Creá un proyecto nuevo (plan Free alcanza para arrancar).
2. En **Project Settings → API**, copiá `Project URL` y `anon public key`.
3. En **Project Settings → API → Service role**, copiá la `service_role key`
   (secreta, nunca la compartas ni la subas a git).

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`SUPABASE_SERVICE_ROLE_KEY` con los valores del paso anterior. `.env.local` no
se versiona (ya está en `.gitignore`).

### 3. Correr la migración

En el SQL Editor del dashboard de Supabase, pegá y ejecutá el contenido de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Crea
todas las tablas (contenido + comercial), las políticas de RLS, y siembra las
categorías base, reglas de tiers de ejemplo y settings en 0 (a completar por
vos, ver paso 5).

### 4. Crear tu usuario admin

En **Authentication → Users**, click en "Add user" → "Create new user" y
cargá tu email/contraseña. No hay flujo de registro público a propósito:
este es el único usuario que va a poder entrar a `/admin`.

### 5. Completar la configuración de negocio

Con el proyecto corriendo (`npm run dev`) y ya logueado en `/admin`, andá a:

- **`/admin/materiales`**: cargá tus filamentos/resinas (costo por kg) e
  impresoras (consumo en W).
- **`/admin/configuracion`**: tarifa eléctrica UTE vigente ($/kWh), margen de
  ganancia por defecto, valor hora de mano de obra/diseño, y los porcentajes
  reales de las reglas de precio por cantidad (la migración siembra valores
  de ejemplo del spec: +20% / base / -12% / -20% para 1-9 / 10-19 / 20-49 /
  50+ unidades — ajustalos a los tuyos).

### 6. Correr en desarrollo

```bash
npm install
npm run dev
npm run test   # tests de las fórmulas de la calculadora (lib/pricing.ts)
```

## Estructura

- `app/admin/(dashboard)/` — backoffice protegido (calculadora, presupuestos,
  materiales, configuración).
- `app/admin/login/` — login (Supabase Auth).
- `lib/pricing.ts` — fórmulas de costo/precio, sin dependencias externas.
- `lib/actions/` — Server Actions (mutaciones, todas validadas con `zod`).
- `lib/pdf/` — generación de PDF de presupuestos (`@react-pdf/renderer`).
- `supabase/migrations/` — esquema SQL.
- `legacy-site/` — sitio estático original, referencia para la Fase 2.
- `proxy.ts` — protege `/admin/*` verificando la sesión de Supabase (Next.js
  16 renombró "middleware" a "proxy"; misma función).

## Deploy

Pensado para Vercel. Cargá las mismas variables de entorno de `.env.local` en
**Project Settings → Environment Variables** del proyecto de Vercel. Tené en
cuenta las limitaciones del plan gratuito mencionadas en el plan técnico:
Supabase Free se pausa a los 7 días sin actividad, y Vercel Hobby es para uso
no comercial.

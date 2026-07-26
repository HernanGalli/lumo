import { createClient } from "@/lib/supabase/server";
import { SETTINGS_FIELDS, getPhotoSettings, settingsRowsToMap } from "@/lib/settings";
import {
  createTierRule,
  deleteTierRule,
  updateSettings,
  updateTierRule,
} from "@/lib/actions/settings";
import { disconnectGmailAction } from "@/lib/actions/gmail";
import { isGmailConnected } from "@/lib/gmail/client";
import { PhotoSettingsForm } from "@/components/admin/PhotoSettingsForm";
import { WelcomeModalSettingsForm } from "@/components/admin/WelcomeModalSettingsForm";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const { gmail } = await searchParams;
  const supabase = await createClient();

  const [{ data: settingsRows }, { data: tierRules }, gmailStatus] = await Promise.all([
    supabase.from("settings").select("key, value"),
    supabase
      .from("price_tier_rules")
      .select("id, min_qty, max_qty, adjustment_pct")
      .eq("is_default", true)
      .order("min_qty", { ascending: true }),
    isGmailConnected(),
  ]);

  const settings = settingsRowsToMap(settingsRows ?? []);
  const photoSettings = getPhotoSettings(settings);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Configuración</h1>
      <p className="text-foreground-muted mb-8">
        Estos valores alimentan la calculadora de costos y la plantilla de presupuestos.
      </p>

      {gmail === "connected" && (
        <div className="mb-6 rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm">
          Gmail conectado correctamente.
        </div>
      )}
      {gmail === "error" && (
        <div className="mb-6 rounded-md border border-rojo/50 bg-rojo/10 px-4 py-3 text-sm">
          No se pudo conectar Gmail. Probá de nuevo.
        </div>
      )}

      <div className="rounded-lg border border-border bg-surface p-6 mb-10">
        <h2 className="font-medium mb-1">Gmail</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Necesario para enviar presupuestos por mail y auto-responder consultas del sitio.
        </p>
        {gmailStatus.connected ? (
          <div className="flex items-center gap-4">
            <p className="text-sm">
              Conectado como <span className="font-medium">{gmailStatus.email}</span>
            </p>
            <form action={disconnectGmailAction}>
              <button type="submit" className="text-sm text-rojo hover:underline">
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <a
            href="/api/gmail/connect"
            className="inline-block rounded-md bg-azul px-4 py-2 text-sm text-white font-medium hover:bg-azul-claro transition-colors"
          >
            Conectar Gmail
          </a>
        )}
      </div>

      <form action={updateSettings} className="rounded-lg border border-border bg-surface p-6 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SETTINGS_FIELDS.map((field) => (
            <div
              key={field.key}
              className={field.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              <label className="block text-sm text-foreground-muted mb-1" htmlFor={field.key}>
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.key}
                  name={field.key}
                  rows={3}
                  defaultValue={(settings[field.key] as string) ?? ""}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul"
                />
              ) : (
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  step={field.type === "number" ? "0.01" : undefined}
                  defaultValue={(settings[field.key] as string | number | undefined) ?? (field.type === "number" ? 0 : "")}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul"
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-6 rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
        >
          Guardar configuración
        </button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium mb-1">Reglas de precio por cantidad</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Porcentaje de ajuste sobre el precio base para cada rango de cantidad. Dejá
          &quot;Hasta&quot; vacío para un tramo sin tope (ej. &quot;50+&quot;).
        </p>

        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 text-xs text-foreground-muted px-1">
            <span>Desde</span>
            <span>Hasta</span>
            <span>Ajuste %</span>
            <span />
            <span />
          </div>
          {(tierRules ?? []).map((rule) => (
            <form
              key={rule.id}
              action={updateTierRule}
              className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-center"
            >
              <input type="hidden" name="id" value={rule.id} />
              <input
                name="minQty"
                type="number"
                min={1}
                defaultValue={rule.min_qty}
                required
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <input
                name="maxQty"
                type="number"
                min={1}
                defaultValue={rule.max_qty ?? ""}
                placeholder="Sin tope"
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <input
                name="adjustmentPct"
                type="number"
                step="0.01"
                defaultValue={rule.adjustment_pct}
                required
                className="rounded-md border border-border bg-background px-3 py-2"
              />
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-2 text-sm hover:border-azul"
              >
                Guardar
              </button>
              <button
                formAction={deleteTierRule}
                className="rounded-md border border-border px-3 py-2 text-sm text-rojo hover:border-rojo"
              >
                Borrar
              </button>
            </form>
          ))}
        </div>

        <form
          action={createTierRule}
          className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 items-center mt-4 pt-4 border-t border-border"
        >
          <input
            name="minQty"
            type="number"
            min={1}
            placeholder="Desde"
            required
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <input
            name="maxQty"
            type="number"
            min={1}
            placeholder="Hasta (opcional)"
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <input
            name="adjustmentPct"
            type="number"
            step="0.01"
            placeholder="Ajuste %"
            required
            className="rounded-md border border-border bg-background px-3 py-2"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 rounded-md bg-azul px-3 py-2 text-sm text-white hover:bg-azul-claro"
          >
            Agregar tramo
          </button>
          <span />
        </form>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 mt-10">
        <h2 className="font-medium mb-1">Fotos</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Compresión y filtro profesional automático al subir fotos en catálogo, showcase,
          logos de clientes y banners. Se puede desactivar el filtro para una foto puntual desde
          su propio formulario de carga.
        </p>
        <PhotoSettingsForm settings={photoSettings} />
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 mt-10">
        <h2 className="font-medium mb-1">Modal de Bienvenida</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Aparece una sola vez cada 7 días por visitante, nunca en el admin. Si lo apagás acá,
          no se evalúa ni se muestra nunca.
        </p>
        <WelcomeModalSettingsForm
          settings={{
            enabled: settings.welcome_modal_enabled === true,
            imageUrl: (settings.welcome_modal_image_url as string) ?? "",
            title: (settings.welcome_modal_title as string) ?? "",
            subtitle: (settings.welcome_modal_subtitle as string) ?? "",
            buttonText: (settings.welcome_modal_button_text as string) ?? "",
            buttonLink: (settings.welcome_modal_button_link as string) ?? "",
          }}
        />
      </div>
    </div>
  );
}

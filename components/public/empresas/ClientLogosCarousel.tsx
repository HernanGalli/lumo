export interface ClientLogo {
  id: string;
  name: string | null;
  url: string | null;
}

export function ClientLogosCarousel({ logos }: { logos: ClientLogo[] }) {
  if (logos.length === 0) return null;

  return (
    <section className="contenedor py-16">
      <p className="text-center text-sm font-medium text-foreground-muted uppercase tracking-wide mb-8">
        Empresas que confiaron en nosotros
      </p>
      <div className="flex items-center gap-10 overflow-x-auto pb-2">
        {logos.map((logo) =>
          logo.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={logo.id}
              src={logo.url}
              alt={logo.name ?? "Cliente de LUMO"}
              className="h-12 shrink-0 object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all"
            />
          ) : null
        )}
      </div>
    </section>
  );
}

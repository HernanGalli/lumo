export interface WorkWallItem {
  id: string;
  title: string;
  imageUrl: string | null;
}

export function WorkWall({ items }: { items: WorkWallItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">Trabajos reales, terminados</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="foto-armonia h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full bg-background-secundario" />
            )}
            <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="p-3 text-sm font-medium text-white">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

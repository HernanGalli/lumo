"use client";

import { DragReorderList } from "@/components/admin/DragReorderList";
import { deleteClientLogo, reorderClientLogos } from "@/lib/actions/clientLogos";

interface LogoRow {
  id: string;
  name: string | null;
  url: string | null;
}

export function ClientLogoReorderList({ logos }: { logos: LogoRow[] }) {
  return (
    <DragReorderList
      items={logos}
      getId={(l) => l.id}
      onReorder={reorderClientLogos}
      renderItem={(logo) => (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            {logo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.url} alt={logo.name ?? ""} className="h-10 w-20 object-contain" />
            ) : (
              <div className="h-10 w-20 rounded bg-background-secundario" />
            )}
            <span>{logo.name || "(sin nombre)"}</span>
          </div>
          <form action={deleteClientLogo}>
            <input type="hidden" name="id" value={logo.id} />
            <button type="submit" className="text-xs text-rojo hover:underline">
              Borrar
            </button>
          </form>
        </div>
      )}
    />
  );
}

"use client";

import { DragReorderList } from "@/components/admin/DragReorderList";

interface ImageRow {
  id: string;
  url: string;
}

export function GalleryManager({
  entityId,
  entityFieldName,
  images,
  addAction,
  deleteAction,
  reorderAction,
}: {
  entityId: string;
  entityFieldName: string;
  images: ImageRow[];
  addAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  reorderAction: (entityId: string, orderedIds: string[]) => void | Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h2 className="font-medium mb-1">Fotos</h2>
      <p className="text-sm text-foreground-muted mb-4">Arrastrá para cambiar el orden.</p>

      {images.length > 0 && (
        <div className="mb-4">
          <DragReorderList
            items={images}
            getId={(img) => img.id}
            onReorder={(orderedIds) => reorderAction(entityId, orderedIds)}
            renderItem={(img) => (
              <div className="flex items-center justify-between gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-14 w-14 rounded object-cover foto-armonia" />
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name={entityFieldName} value={entityId} />
                  <button type="submit" className="text-xs text-rojo hover:underline">
                    Borrar
                  </button>
                </form>
              </div>
            )}
          />
        </div>
      )}

      <form action={addAction} className="flex items-center gap-2 pt-4 border-t border-border">
        <input type="hidden" name={entityFieldName} value={entityId} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="flex-1 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-azul px-3 py-1.5 text-sm text-white hover:bg-azul-claro"
        >
          Subir
        </button>
      </form>
    </div>
  );
}

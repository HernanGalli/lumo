interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    price_original: number;
    price_offer: number | null;
    is_offer: boolean;
    is_featured: boolean;
    status: string;
  };
  selectedCategoryIds?: string[];
  submitLabel: string;
}

export function ProductForm({
  action,
  categories,
  product,
  selectedCategoryIds = [],
  submitLabel,
}: ProductFormProps) {
  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-sm text-foreground-muted mb-1";

  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div>
        <label className={labelClass} htmlFor="name">
          Nombre
        </label>
        <input id="name" name="name" required defaultValue={product?.name} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="priceOriginal">
            Precio
          </label>
          <input
            id="priceOriginal"
            name="priceOriginal"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={product?.price_original}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="priceOffer">
            Precio oferta (opcional)
          </label>
          <input
            id="priceOffer"
            name="priceOffer"
            type="number"
            step="0.01"
            min={0}
            defaultValue={product?.price_offer ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isOffer" defaultChecked={product?.is_offer} />
          En oferta
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured} />
          Destacado
        </label>
      </div>

      <div>
        <label className={labelClass} htmlFor="status">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={product?.status ?? "published"}
          className={inputClass}
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
      </div>

      <div>
        <span className={labelClass}>Categorías</span>
        <div className="flex flex-wrap gap-4">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={selectedCategoryIds.includes(category.id)}
              />
              {category.name}
            </label>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-foreground-muted">No hay categorías todavía.</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-azul px-4 py-2 text-white font-medium hover:bg-azul-claro transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}

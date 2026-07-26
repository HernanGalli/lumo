interface Category {
  id: string;
  name: string;
}

interface ShowcaseFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  post?: {
    id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    status: string;
  };
  submitLabel: string;
}

export function ShowcaseForm({ action, categories, post, submitLabel }: ShowcaseFormProps) {
  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-azul";
  const labelClass = "block text-sm text-foreground-muted mb-1";

  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-6 flex flex-col gap-4">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <label className={labelClass} htmlFor="title">
          Título
        </label>
        <input id="title" name="title" required defaultValue={post?.title} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Descripción corta
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={post?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="categoryId">
          Categoría
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={post?.category_id ?? ""}
          className={inputClass}
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="status">
          Estado
        </label>
        <select
          id="status"
          name="status"
          defaultValue={post?.status ?? "published"}
          className={inputClass}
        >
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
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

"use client";

import Link from "next/link";
import { DragReorderList } from "@/components/admin/DragReorderList";
import { reorderShowcasePosts } from "@/lib/actions/showcase";

interface PostRow {
  id: string;
  title: string;
  status: string;
  categoryName: string | null;
  thumbUrl: string | null;
  showOnHome: boolean;
}

export function ShowcaseReorderList({ posts }: { posts: PostRow[] }) {
  return (
    <DragReorderList
      items={posts}
      getId={(p) => p.id}
      onReorder={reorderShowcasePosts}
      renderItem={(post) => (
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 min-w-0">
            {post.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.thumbUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover foto-armonia" />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded bg-background-secundario" />
            )}
            <div className="min-w-0">
              <p className="truncate">
                {post.title}
                {post.status === "draft" && (
                  <span className="ml-2 rounded-full bg-background-secundario px-2 py-0.5 text-xs text-foreground-muted">
                    Borrador
                  </span>
                )}
                {post.showOnHome && (
                  <span className="ml-2 rounded-full bg-amarillo/20 px-2 py-0.5 text-xs text-amarillo">
                    En Home
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground-muted">{post.categoryName ?? "Sin categoría"}</p>
            </div>
          </div>
          <Link href={`/admin/showcase/${post.id}`} className="shrink-0 text-azul hover:underline">
            Editar
          </Link>
        </div>
      )}
    />
  );
}

import Link from "next/link";

export interface PublicShowcasePost {
  slug: string;
  title: string;
  description: string | null;
  categoryLabel: string | null;
  imageUrl: string | null;
}

export function ShowcaseCard({ post }: { post: PublicShowcasePost }) {
  return (
    <Link href={`/showcase/${post.slug}`} className="showcase-card">
      <div className="producto-card__imagen-cont">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={post.title} className="card-gallery__image active foto-armonia" />
        ) : (
          <div
            className="card-gallery__image active"
            style={{ backgroundColor: "var(--background-secundario)" }}
          />
        )}
      </div>
      <div className="producto-card__info">
        {post.categoryLabel && <span className="producto-card__categoria">{post.categoryLabel}</span>}
        <h3 className="producto-card__nombre">{post.title}</h3>
        <p className="producto-card__descripcion">{post.description}</p>
      </div>
    </Link>
  );
}

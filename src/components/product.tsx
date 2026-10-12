import { Heart, Star } from "lucide-react";
import { formatMoney, discountPercent, starFloor } from "@/lib/commerce";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";

export function Stars({ rating, count }: { rating: number; count?: number }) {
  const filled = starFloor(rating);
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn("h-3.5 w-3.5", index < filled ? "fill-gold text-gold" : "text-line")}
          strokeWidth={1.5}
        />
      ))}
      {typeof count === "number" && <span className="ml-1 text-xs text-muted">({count})</span>}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const saved = wishlist.includes(product.id);
  const off = discountPercent(product.priceCents, product.compareAtCents);

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden bg-cream">
        <Link href={`/products/${product.slug}`} className="block">
          <img
            src={product.image}
            alt={product.name}
            width={720}
            height={540}
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.05]"
          />
        </Link>
        {product.badge && (
          <span className="absolute left-3 top-3 bg-espresso px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-linen">
            {product.badge}
          </span>
        )}
        {off > 0 && (
          <span className="absolute right-3 top-3 bg-danger px-2 py-1 font-mono text-[10px] text-linen">-{off}%</span>
        )}
        <button
          type="button"
          className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center bg-linen/90 text-espresso"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart className={cn("h-4 w-4", saved ? "fill-danger text-danger" : "text-muted")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-copper">{product.category}</p>
        <Link href={`/products/${product.slug}`} className="mt-1 font-medium text-espresso hover:text-copper">
          {product.name}
        </Link>
        <div className="mt-1">
          <Stars rating={product.rating} count={product.reviewCount} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-sm text-espresso">{formatMoney(product.priceCents)}</span>
          {product.compareAtCents && (
            <span className="font-mono text-xs text-muted line-through">{formatMoney(product.compareAtCents)}</span>
          )}
        </div>
        <button
          type="button"
          className="mt-3 h-11 w-full border border-espresso text-sm text-espresso transition-colors duration-300 hover:bg-espresso hover:text-linen"
          onClick={() => addToCart(product.id)}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, empty }: { products: Product[]; empty: string }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-muted">{empty}</p>;
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

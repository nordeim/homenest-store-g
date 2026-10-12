import { ShoppingBag, Star } from "lucide-react";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import { discountPercent, formatMoney, starFloor } from "@/lib/commerce";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";

export function Stars({ rating, count }: { rating: number; count?: number }) {
  const filled = starFloor(rating);
  return (
    <span className="flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5`}>
      <span className="flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className={cn("h-3.5 w-3.5", index < filled ? "fill-badge text-badge" : "fill-border text-border")}
          />
        ))}
      </span>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">({count})</span>}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toast } = useStore();
  const discount = discountPercent(product.priceCents, product.compareAtCents);

  const quickAdd = () => {
    const error = addToCart(product.id, 1);
    if (error) toast(error);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow duration-300 hover:shadow-pop">
      <div className="relative bg-muted">
        <Link href={`/product/${product.id}`} className="block" aria-label={product.name}>
          <img
            src={product.image}
            alt={product.name}
            width={640}
            height={640}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
          />
        </Link>
        <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-badge px-2.5 py-1 text-xs font-bold text-white">Featured</span>
          )}
        </span>
        <button
          type="button"
          className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
          aria-label={`Add ${product.name} to cart`}
          onClick={quickAdd}
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>
      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {product.category.replace("-", " ")}
        </p>
        <h3 className="font-display text-lg font-bold leading-snug text-foreground">{product.name}</h3>
        <Stars rating={product.rating} count={product.reviewCount} />
        <p className="mt-auto flex items-baseline gap-2 pt-1">
          <span data-testid="card-price" className="text-lg font-bold text-foreground">{formatMoney(product.priceCents)}</span>
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <span data-testid="card-compare-at" className="text-sm text-muted-foreground line-through">
              {formatMoney(product.compareAtCents)}
            </span>
          )}
        </p>
      </Link>
    </article>
  );
}

export function ProductGrid({ products, empty }: { products: Product[]; empty: string }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">{empty}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

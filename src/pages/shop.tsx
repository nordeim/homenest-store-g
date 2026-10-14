import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, SearchIcon, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { PrimaryButton } from "@/components/chrome";
import { ProductCard, ProductGrid, Stars } from "@/components/product";
import { CATEGORIES, productById, productBySlug, relatedProducts } from "@/data/catalog";
import { discountPercent, formatMoney } from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { CategoryId, Product, SortKey } from "@/types";
import { cn } from "@/utils/cn";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Highest Rated",
  featured: "Featured",
};

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const copy = [...list];
  if (sort === "price-asc") return copy.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === "price-desc") return copy.sort((a, b) => b.priceCents - a.priceCents);
  if (sort === "rating") return copy.sort((a, b) => b.rating - a.rating);
  if (sort === "newest") return copy.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  return copy.sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function ProductsPage() {
  const query = useQuery();
  const { navigate } = useRouter();
  const { visibleProducts } = useStore();
  const category = (query.get("category") as CategoryId | null) ?? "all";
  const search = query.get("search") ?? "";
  const [sort, setSort] = useState<SortKey>("newest");

  const setParams = (nextCategory: string, nextSearch: string) => {
    const params = new URLSearchParams();
    if (nextCategory && nextCategory !== "all") params.set("category", nextCategory);
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    const qs = params.toString();
    navigate(qs ? `/products?${qs}` : "/products", { replace: true });
  };

  const filtered = useMemo(() => {
    let list = visibleProducts;
    if (category !== "all") list = list.filter((product) => product.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.materials.some((material) => material.toLowerCase().includes(q)),
      );
    }
    return sortProducts(list, sort);
  }, [category, search, sort, visibleProducts]);

  const categoryName = CATEGORIES.find((item) => item.id === category)?.name ?? "All Products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-foreground">{categoryName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "product" : "products"} found
      </p>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            aria-label="Search products"
            placeholder="Search products..."
            onChange={(event) => setParams(category, event.target.value)}
            className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-3">
          <label className="relative">
            <span className="sr-only">Filter by category</span>
            <select
              value={category === "all" ? "" : category}
              onChange={(event) => setParams(event.target.value, search)}
              className="h-12 w-full appearance-none rounded-full border border-border bg-card pl-4 pr-10 text-sm font-medium text-foreground lg:w-48"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </label>
          <label className="relative">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-12 w-full appearance-none rounded-full border border-border bg-card pl-4 pr-10 text-sm font-medium text-foreground lg:w-48"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
          </label>
        </div>
      </div>

      <div className="mt-8">
        <ProductGrid products={filtered} empty="No products match those filters. Try clearing the search." />
      </div>
    </div>
  );
}

export function ProductPage({ slug }: { slug: string }) {
  const { visibleProducts, addToCart, toast } = useStore();
  const { navigate } = useRouter();
  const bySlug = productBySlug(slug, visibleProducts);
  const byId = productById(slug, visibleProducts);
  const product = bySlug ?? byId;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">Product not found</h1>
        <p className="mt-3 text-muted-foreground">That piece may have sold out or been delisted.</p>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse products
        </PrimaryButton>
      </div>
    );
  }

  const discount = discountPercent(product.priceCents, product.compareAtCents);
  const related = relatedProducts(product, visibleProducts).slice(0, 8);
  const inStock = product.stock > 0;

  const onAdd = () => {
    const error = addToCart(product.id, quantity);
    if (error) {
      toast(error);
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const onBuyNow = () => {
    const error = addToCart(product.id, quantity);
    if (error) {
      toast(error);
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted">
          <img
            src={product.image}
            alt={product.name}
            width={900}
            height={900}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {product.category.replace("-", " ")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-foreground">{product.name}</h1>
          <div className="mt-3">
            <Stars rating={product.rating} count={product.reviewCount} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{formatMoney(product.priceCents)}</span>
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatMoney(product.compareAtCents)}
                </span>
                {discount > 0 && (
                  <span className="rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-sm font-medium",
              inStock ? "text-accent" : "text-destructive",
            )}
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {inStock ? "In Stock" : "Out of stock"}
          </p>

          <hr className="my-6 border-border" />

          <h2 className="text-base font-bold text-foreground">Description</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {product.features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.features.map((feature) => (
                <span key={feature} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
                  {feature}
                </span>
              ))}
            </div>
          )}

          <hr className="my-6 border-border" />

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="inline-flex items-center rounded-full border border-border bg-card">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-40"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground disabled:opacity-40"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Session-36 (F36-11) re-measurement: the reference's PDP action row
              is a ROW at every width (flex gap-3) — Add-to-Cart h-10 px-8
              flex-1 (14px/500, shadow, hover:bg-primary/90), Buy Now h-10 px-6
              with NO flex-1. The old clone markup (flex-col on mobile with
              BOTH buttons flex-1 h-12) collapsed them to 20-22px: the flex
              algorithm ignores `height` under `flex-basis: 0%`, so the
              buttons fell to min-content. Row layout + reference geometry
              fixes both the collapse and the parity. */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[9999px] bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              onClick={onAdd}
              disabled={!inStock}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </>
              )}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-[9999px] border border-border bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={onBuyNow}
              disabled={!inStock}
            >
              Buy Now
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Free shipping over $50
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> 30-day returns
            </span>
          </div>
          {product.shippingNote && (
            <p className="mt-3 text-xs text-muted-foreground">Shipping: {product.shippingNote}</p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-2xl font-bold text-foreground">
            You May Also Like
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Similar products you might enjoy</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Page Not Found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <PrimaryButton className="mt-8" onClick={() => navigate("/")}>
        Go Home
      </PrimaryButton>
    </div>
  );
}

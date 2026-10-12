import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { ProductGrid, Stars } from "@/components/product";
import { PrimaryButton } from "@/components/chrome";
import { CATEGORIES, productBySlug, relatedProducts } from "@/data/catalog";
import { formatMoney, discountPercent } from "@/lib/commerce";
import { Link, useQuery } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { CategoryId, Product, SortKey } from "@/types";
import { cn } from "@/utils/cn";

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
  const { visibleProducts } = useStore();
  const category = (query.get("category") as CategoryId | null) ?? "all";
  const search = query.get("search") ?? "";
  const [sort, setSort] = useState<SortKey>("featured");
  const [band, setBand] = useState("all");

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
    if (band === "under50") list = list.filter((product) => product.priceCents < 5000);
    if (band === "50to100") list = list.filter((product) => product.priceCents >= 5000 && product.priceCents < 10000);
    if (band === "over100") list = list.filter((product) => product.priceCents >= 10000);
    return sortProducts(list, sort);
  }, [band, category, search, sort, visibleProducts]);

  const categoryName = CATEGORIES.find((item) => item.id === category)?.name ?? "All products";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-espresso">
          Home
        </Link>{" "}
        / Shop
      </p>
      <h1 className="mt-3 font-display text-4xl text-espresso">{search ? `Results for “${search}”` : categoryName}</h1>
      <p className="mt-2 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "product" : "products"} found
      </p>

      <div className="mt-8 flex flex-col gap-3 border-y border-line py-4 md:flex-row md:items-center">
        <label className="text-sm text-muted">
          Category
          <select
            className="ml-2 h-11 w-[160px] border border-line bg-linen px-2 text-sm"
            value={category}
            onChange={(event) => {
              const value = event.target.value;
              window.history.pushState({}, "", value === "all" ? "/products" : `/products?category=${value}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          >
            <option value="all">All</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          Price
          <select
            className="ml-2 h-11 w-[160px] border border-line bg-linen px-2 text-sm"
            value={band}
            onChange={(event) => setBand(event.target.value)}
          >
            <option value="all">Any</option>
            <option value="under50">Under $50</option>
            <option value="50to100">$50–$100</option>
            <option value="over100">$100+</option>
          </select>
        </label>
        <label className="text-sm text-muted md:ml-auto">
          Sort
          <select
            className="ml-2 h-11 w-[150px] border border-line bg-linen px-2 text-sm"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price · low</option>
            <option value="price-desc">Price · high</option>
          </select>
        </label>
      </div>

      {(category !== "all" || search) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {category !== "all" && (
            <Link href="/products" className="border border-line px-3 py-1 text-xs text-muted">
              {categoryName} ×
            </Link>
          )}
          {search && (
            <Link href="/products" className="border border-line px-3 py-1 text-xs text-muted">
              “{search}” ×
            </Link>
          )}
        </div>
      )}

      <div className="mt-10">
        <ProductGrid products={filtered} empty="Nothing in this corner of the atelier. Clear a filter and look again." />
      </div>
    </div>
  );
}

export function ProductPage({ slug }: { slug: string }) {
  const { products, addToCart, toggleWishlist, wishlist } = useStore();
  const product = productBySlug(slug, products);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews" | "shipping">("description");
  const [active, setActive] = useState(0);

  if (!product || !product.visible) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-espresso">Product not found</h1>
        <p className="mt-3 text-muted">That piece has left the atelier — or never belonged here.</p>
        <Link href="/products" className="mt-8 inline-flex h-12 items-center bg-copper px-6 text-sm text-linen">
          Browse the shop
        </Link>
      </div>
    );
  }

  const related = relatedProducts(product, products.filter((item) => item.visible));
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const saved = wishlist.includes(product.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Shop</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`}>{product.category}</Link>
        <span>/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <img
            src={product.gallery[active] ?? product.image}
            alt={product.name}
            width={1000}
            height={750}
            className="aspect-[4/3] w-full object-cover bg-cream"
          />
          <div className="mt-3 flex gap-2">
            {product.gallery.map((src, index) => (
              <button
                key={src + index}
                type="button"
                className={cn("h-16 w-16 overflow-hidden border", index === active ? "border-espresso" : "border-line")}
                onClick={() => setActive(index)}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          {product.badge && (
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">{product.badge}</p>
          )}
          <h1 className="mt-2 font-display text-4xl text-espresso">{product.name}</h1>
          <div className="mt-3">
            <Stars rating={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-2xl text-espresso">{formatMoney(product.priceCents)}</span>
            {product.compareAtCents && (
              <span className="font-mono text-muted line-through">{formatMoney(product.compareAtCents)}</span>
            )}
            {off > 0 && <span className="text-sm text-danger">Save {off}%</span>}
          </div>
          <p className="mt-5 leading-relaxed text-muted">{product.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {product.features.map((feature) => (
              <li key={feature} className="border border-line bg-cream px-3 py-1 text-xs text-espresso">
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">{product.stock > 0 ? `${product.stock} in the atelier` : "Out of stock"}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-line">
              <button type="button" className="h-12 w-11" aria-label="Decrease quantity" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                −
              </button>
              <span className="w-8 text-center">{qty}</span>
              <button
                type="button"
                className="h-12 w-11"
                aria-label="Increase quantity"
                onClick={() => setQty((n) => Math.min(product.stock, n + 1))}
              >
                +
              </button>
            </div>
            <PrimaryButton onClick={() => addToCart(product.id, qty)} disabled={product.stock < 1}>
              Add to cart
            </PrimaryButton>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center border border-line"
              aria-pressed={saved}
              aria-label="Toggle wishlist"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart className={cn("h-4 w-4", saved ? "fill-danger text-danger" : "text-muted")} />
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">{product.shippingNote}</p>
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <div className="flex gap-6 text-sm">
          {(["description", "reviews", "shipping"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={cn("pb-2 capitalize", tab === key ? "border-b-2 border-copper text-espresso" : "text-muted")}
              onClick={() => setTab(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
          {tab === "description" && (
            <p>
              {product.description} Materials: {product.materials.join(", ")}.
            </p>
          )}
          {tab === "reviews" && (
            <p>
              Rated {product.rating.toFixed(1)} across {product.reviewCount} verified notes from the house. We publish
              every review that names the piece — including the ones that sting.
            </p>
          )}
          {tab === "shipping" && <p>{product.shippingNote} Free shipping on orders over $100. Flat $9.99 below.</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl text-espresso">Also from this room</h2>
          <div className="mt-8">
            <ProductGrid products={related} empty="" />
          </div>
        </section>
      )}
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-copper">404</p>
      <h1 className="mt-3 font-display text-4xl text-espresso">This page could not be found</h1>
      <p className="mt-3 text-muted">The path you asked for is not in the house.</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center bg-copper px-6 text-sm text-linen">
        Return home
      </Link>
    </div>
  );
}

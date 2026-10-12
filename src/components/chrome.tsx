import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChefHat,
} from "lucide-react";
import { BRAND, FOOTER_LEGAL, FOOTER_SHOP, NAV_LINKS, productById } from "@/data/catalog";
import { formatMoney } from "@/lib/commerce";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

export function AnnouncementBar() {
  return (
    <p className="bg-copper px-4 py-2 text-center text-[13px] font-medium tracking-wide text-linen">
      Free shipping on orders over $100 · Use NEST10 for 10% off $40+
    </p>
  );
}

export function Header() {
  const { path, navigate } = useRouter();
  const { cartCount, setCartOpen, user, wishlist, visibleProducts, setSearchOpen, searchOpen } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return visibleProducts
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.category.includes(q) ||
          product.materials.some((material) => material.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, visibleProducts]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [path, setSearchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-[300] border-b border-line bg-linen/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-espresso md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X strokeWidth={1.75} /> : <Menu strokeWidth={1.75} />}
          </button>
          <Link href="/" className="flex items-baseline gap-2" aria-label="HomeNest Kitchen home">
            <span className="font-display text-[1.35rem] font-semibold tracking-tight text-espresso sm:text-2xl">
              HomeNest
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-copper sm:inline">
              Kitchen
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm tracking-wide text-muted transition-colors duration-300 hover:text-espresso",
                path === item.href && "text-espresso",
              )}
              aria-current={path === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-espresso"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen(!searchOpen);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
          >
            <Search strokeWidth={1.75} className="h-5 w-5" />
          </button>
          <Link
            href="/account"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-espresso"
            aria-label={user ? "Account" : "Sign in"}
          >
            <UserRound strokeWidth={1.75} className="h-5 w-5" />
          </Link>
          <Link
            href="/account"
            className="relative hidden h-11 w-11 items-center justify-center rounded-md text-espresso sm:inline-flex"
            aria-label="Wishlist"
          >
            <Heart strokeWidth={1.75} className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 font-mono text-[10px] text-linen">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-espresso"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag strokeWidth={1.75} className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 font-mono text-[10px] text-linen">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id={searchId} className="border-t border-line bg-linen px-4 py-3 sm:px-6">
          <form onSubmit={submitSearch} className="mx-auto max-w-6xl" role="search">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                id="site-search"
                role="combobox"
                aria-expanded={matches.length > 0}
                aria-autocomplete="list"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search copper, knives, jars…"
                className="h-12 w-full rounded-md border border-line bg-cream pl-10 pr-4 text-sm text-espresso placeholder:text-muted"
              />
            </div>
            {query.trim() && (
              <ul className="mt-2 overflow-visible rounded-md border border-line bg-linen shadow-sm" role="listbox">
                {matches.length === 0 && (
                  <li className="px-4 py-3 text-sm text-muted">No matches in the atelier.</li>
                )}
                {matches.map((product) => (
                  <li key={product.id} role="option">
                    <Link
                      href={`/products/${product.slug}`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-espresso hover:bg-cream"
                      onClick={() => setSearchOpen(false)}
                    >
                      <img src={product.image} alt="" width={40} height={40} className="h-10 w-10 object-cover" />
                      <span>{product.name}</span>
                      <span className="ml-auto font-mono text-xs text-muted">{formatMoney(product.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      )}

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[400] bg-espresso/40 md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-nav"
            className="fixed inset-y-0 left-0 z-[500] flex w-72 flex-col bg-linen shadow-[8px_0_32px_rgb(28_20_16_/_0.18)] md:hidden"
            aria-label="Mobile"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="font-display text-lg text-espresso">Menu</span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-base text-espresso"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/account"
                className="flex min-h-11 items-center rounded-md px-3 text-base text-espresso"
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Account" : "Sign in"}
              </Link>
              <Link
                href="/cart"
                className="flex min-h-11 items-center rounded-md bg-copper px-3 text-base text-linen"
                onClick={() => setMenuOpen(false)}
              >
                Cart
              </Link>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, products, setLineQty, removeLine, totals, cartCount } = useStore();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[500]">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/40"
        aria-label="Close cart"
        onClick={() => setCartOpen(false)}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-linen shadow-[8px_0_32px_rgb(28_20_16_/_0.18)]">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-xl text-espresso">Cart ({cartCount})</h2>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 && <p className="text-sm text-muted">Your cart is resting. The board is clear.</p>}
          <ul className="flex flex-col gap-4">
            {cart.map((line) => {
              const product = productById(line.productId, products);
              if (!product) return null;
              return (
                <li key={line.productId} className="flex gap-3 border-b border-line pb-4">
                  <img src={product.image} alt="" width={72} height={72} className="h-[72px] w-[72px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-espresso">{product.name}</p>
                    <p className="font-mono text-sm text-copper">{formatMoney(product.priceCents)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="h-9 w-9 border border-line"
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <button
                        type="button"
                        className="h-9 w-9 border border-line"
                        aria-label={`Increase ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-xs text-muted underline"
                        onClick={() => removeLine(line.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="border-t border-line px-5 py-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-mono">{formatMoney(totals.subtotalCents)}</span>
          </div>
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center bg-copper text-sm font-medium text-linen"
            onClick={() => {
              setCartOpen(false);
              navigate("/checkout");
            }}
            disabled={cart.length === 0}
          >
            Checkout
          </button>
          <button
            type="button"
            className="mt-2 flex h-11 w-full items-center justify-center text-sm text-espresso underline"
            onClick={() => {
              setCartOpen(false);
              navigate("/cart");
            }}
          >
            View full cart
          </button>
        </div>
      </aside>
    </div>
  );
}

export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[800] flex flex-col gap-2" role="status">
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="pointer-events-auto max-w-xs bg-espresso px-4 py-3 text-sm text-linen shadow-[0_12px_32px_rgb(28_20_16_/_0.18)]"
        >
          {toast.text}
        </p>
      ))}
    </div>
  );
}

export function Footer() {
  const { subscribe, toast } = useStore();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      setNote("Enter a valid email.");
      return;
    }
    const message = subscribe(email);
    setNote(message);
    toast(message);
    setEmail("");
  };

  return (
    <footer className="mt-20 bg-espresso text-linen">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl">Stay Updated</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-linen/70">
            Atelier notes, restocks, and the occasional recipe — never a blast.
          </p>
          <form onSubmit={onSubmit} className="mt-6 flex max-w-md gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@kitchen.email"
              className="h-12 flex-1 border border-linen/20 bg-transparent px-3 text-sm text-linen placeholder:text-linen/40"
            />
            <button type="submit" className="h-12 bg-copper px-5 text-sm font-medium text-linen">
              Join
            </button>
          </form>
          {note && (
            <p className="mt-2 text-sm text-linen/80" role="status" aria-label="Newsletter status">
              {note}
            </p>
          )}
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Shop</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-linen/80">
            {FOOTER_SHOP.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-linen">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">House</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-linen/80">
            <li>
              <Link href="/about" className="hover:text-linen">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-linen">
                Contact
              </Link>
            </li>
            {FOOTER_LEGAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-linen">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-linen/10 px-4 py-5 text-center font-mono text-[11px] tracking-wide text-linen/50">
        © {new Date().getFullYear()} {BRAND.name} · {BRAND.address}
      </div>
    </footer>
  );
}

export function FeatureBar() {
  const items = [
    { icon: Truck, title: "Free over $100", body: "Flat $9.99 under the threshold." },
    { icon: RotateCcw, title: "30-day returns", body: "Unused, original packing." },
    { icon: ShieldCheck, title: "Lifetime honing", body: "Edges we sold, we keep true." },
    { icon: ChefHat, title: "Atelier support", body: "Cooks, not a call center." },
  ];
  return (
    <section className="border-y border-line bg-cream">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3">
            <item.icon className="mt-0.5 h-5 w-5 text-copper" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium text-espresso">{item.title}</p>
              <p className="text-sm text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PageShell({ children, admin }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-linen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[800] focus:bg-copper focus:px-4 focus:py-2 focus:text-linen"
      >
        Skip to content
      </a>
      {!admin && <AnnouncementBar />}
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <Toaster />
    </div>
  );
}

export function Field({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-espresso">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function inputClass(error?: boolean) {
  return cn(
    "h-12 w-full border bg-linen px-3 text-sm text-espresso",
    error ? "border-danger" : "border-line",
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 min-w-[44px] items-center justify-center bg-copper px-6 text-sm font-medium text-linen transition-colors duration-300 hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  House,
  Menu,
  MessageCircle,
  Search,
  ShoppingBag,
  UserRound,
  X,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
} from "lucide-react";
import { BRAND, FOOTER_LEGAL, FOOTER_QUICK_LINKS, NAV_LINKS, productById } from "@/data/catalog";
import { formatMoney } from "@/lib/commerce";
import { Link, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <House className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="font-display text-[1.4rem] font-bold tracking-tight text-foreground">
        {compact ? BRAND.name : BRAND.name}
      </span>
    </span>
  );
}

export function Header() {
  const { path, navigate } = useRouter();
  const { cartCount, setCartOpen, user, setSearchOpen, searchOpen, visibleProducts } = useStore();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  // The menu's search control matches the reference's compact muted pill at
  // rest; tapping it expands the working input (functional superset — the
  // reference's pill is inert).
  const [menuSearchOpen, setMenuSearchOpen] = useState(false);
  const searchId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  // APG combobox state (session 5, R5-02): which suggestion the arrow keys
  // have activated. -1 = none active. The DOM focus stays in the input; the
  // active option is exposed via aria-activedescendant + aria-selected.
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return visibleProducts
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.category.replace("-", " ").includes(q) ||
          product.materials.some((material) => material.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, visibleProducts]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [path, setSearchOpen]);

  useEffect(() => {
    if (menuOpen) return;
    setMenuSearchOpen(false);
  }, [menuOpen]);

  // Expanding the pill hands focus straight to the revealed input.
  useEffect(() => {
    if (menuSearchOpen) document.getElementById("mobile-search")?.focus();
  }, [menuSearchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // Move focus into the modal panel (first focusable: the search pill, or
    // the search input once expanded).
    document
      .querySelector<HTMLElement>(
        '#mobile-nav-holder input, #mobile-nav-holder button:not([tabindex="-1"]), #mobile-nav-holder a[href]',
      )
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Focus trap: cycle Tab/Shift+Tab within the modal panel so keyboard
      // users cannot reach the dimmed background page (aria-modal contract).
      const holder = document.getElementById("mobile-nav-holder");
      if (!holder) return;
      const focusables = Array.from(
        holder.querySelectorAll<HTMLElement>(
          'a[href], input:not([disabled]), button:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && holder.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so keyboard users keep their place.
      previouslyFocused?.focus?.();
    };
  }, [menuOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMenuOpen(false);
    setSearchOpen(false);
    setActiveIndex(-1);
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  // WAI-ARIA 1.2 combobox, listbox-popup variant (session 5, R5-02). The
  // overlay previously had no keyboard path to its suggestions at all.
  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (matches.length === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % matches.length); // -1 → 0, last wraps to first
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1)); // -1/0 → last
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(matches.length - 1);
        break;
      case "Enter": {
        if (activeIndex < 0) return; // default form submit → /products?search=
        event.preventDefault();
        const product = matches[activeIndex];
        if (!product) return;
        setMenuOpen(false);
        setSearchOpen(false);
        setActiveIndex(-1);
        navigate(`/product/${product.id}`);
        break;
      }
    }
  };

  return (
    <header className="sticky top-0 z-[300] border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="rounded-md" aria-label="HomeNest home">
            <BrandMark />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="hidden h-11 items-center gap-2 rounded-full border border-border bg-muted px-4 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen(!searchOpen);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
          >
            <Search className="h-4 w-4" />
            Search products...
          </button>
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-foreground md:inline-flex lg:hidden"
            aria-label="Search products"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen(!searchOpen);
              window.setTimeout(() => inputRef.current?.focus(), 40);
            }}
          >
            <Search strokeWidth={2} />
          </button>
          <Link
            href="/account"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground"
            aria-label={user ? "Account" : "Sign in"}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full",
                user ? "bg-accent text-white" : "",
              )}
            >
              <UserRound className="h-5 w-5" strokeWidth={2} />
            </span>
          </Link>
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground"
            aria-label="Open cart"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {/* Session-5 re-measurement: the reference dropped the green close
                disc — BOTH states are a bare dark icon in the trigger. */}
            {menuOpen ? <X className="h-5 w-5" strokeWidth={2.2} /> : <Menu strokeWidth={2} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div id={searchId} className="border-t border-border bg-card px-4 py-3 sm:px-6">
          <form onSubmit={submitSearch} className="mx-auto max-w-7xl" role="search">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                id="site-search"
                role="combobox"
                aria-expanded={matches.length > 0}
                aria-autocomplete="list"
                aria-controls={matches.length > 0 ? "site-search-listbox" : undefined}
                aria-activedescendant={
                  activeIndex >= 0 && matches.length > 0 ? `site-search-opt-${activeIndex}` : undefined
                }
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1); // new query, fresh activation
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Search products..."
                className="h-12 w-full rounded-full border border-border bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {query.trim() && matches.length === 0 && (
              <div className="mt-2 rounded-xl border border-border bg-card p-1 shadow-pop">
                <p className="px-4 py-3 text-sm text-muted-foreground">No products match that search.</p>
              </div>
            )}
            {matches.length > 0 && (
              <ul
                id="site-search-listbox"
                className="mt-2 overflow-visible rounded-xl border border-border bg-card p-1 shadow-pop"
                role="listbox"
                aria-label="Suggested products"
              >
                {matches.map((product, index) => (
                  <li
                    key={product.id}
                    role="option"
                    id={`site-search-opt-${index}`}
                    aria-selected={index === activeIndex}
                  >
                    <Link
                      href={`/product/${product.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted",
                        index === activeIndex && "bg-muted",
                      )}
                      onClick={() => setSearchOpen(false)}
                    >
                      <img src={product.image} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
                      <span className="font-medium">{product.name}</span>
                      <span className="ml-auto font-semibold text-primary">{formatMoney(product.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      )}

      {typeof document !== "undefined" &&
        createPortal(
          menuOpen ? (
            <div
              className="fixed inset-x-0 top-16 z-[350] md:hidden"
              id="mobile-nav-holder"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <button
                type="button"
                tabIndex={-1}
                className="fixed inset-0 top-16 -z-10 h-[calc(100vh-4rem)] cursor-default bg-transparent"
                aria-label="Close menu overlay"
                onClick={() => setMenuOpen(false)}
              />
              <nav
                id="mobile-nav"
                className="border-b border-border bg-panel px-4 pb-5 pt-4"
                aria-label="Mobile"
              >
                {menuSearchOpen ? (
                  <form onSubmit={submitSearch} role="search" className="mb-2">
                    <label htmlFor="mobile-search" className="sr-only">
                      Search products
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="mobile-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search products..."
                        className="h-11 w-full rounded-full border border-border bg-muted pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="mb-2">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[9999px] bg-muted text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Search products"
                      aria-expanded={menuSearchOpen}
                      onClick={() => setMenuSearchOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((item) => {
                    const active = path === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex min-h-11 items-center rounded-md px-4 text-sm font-medium",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/account"
                      className="flex min-h-11 items-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      {user ? "Account" : "Sign in"}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          ) : null,
          document.body,
        )}
    </header>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, products, setLineQty, removeLine, totals, cartCount } = useStore();
  const { navigate } = useRouter();
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!cartOpen) return;
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // Move focus into the modal dialog (first focusable = the close button).
    const drawer = drawerRef.current;
    drawer
      ?.querySelector<HTMLElement>('a[href], button:not([disabled]):not([tabindex="-1"])')
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCartOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Focus trap: cycle Tab/Shift+Tab within the dialog so keyboard users
      // cannot reach the dimmed background page (aria-modal contract).
      const panel = drawerRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]):not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && panel.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so keyboard users keep their place.
      previouslyFocused?.focus?.();
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[500]">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close cart"
        onClick={() => setCartOpen(false)}
      />
      <aside
        ref={drawerRef}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-card shadow-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <h2 className="font-display text-xl font-bold text-foreground">Cart ({cartCount})</h2>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Your cart is empty.</p>
          )}
          <ul className="flex flex-col gap-4">
            {cart.map((line) => {
              const product = productById(line.productId, products);
              if (!product) return null;
              return (
                <li key={line.productId} className="flex gap-3 border-b border-border pb-4">
                  <img
                    src={product.image}
                    alt=""
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] rounded-lg border border-border bg-muted object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm font-semibold text-primary">{formatMoney(product.priceCents)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
                        aria-label={`Increase ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => removeLine(line.productId)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="border-t border-border px-5 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">{formatMoney(totals.subtotalCents)}</span>
          </div>
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
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
            className="mt-2 flex h-11 w-full items-center justify-center rounded-full text-sm font-medium text-foreground underline-offset-4 hover:underline"
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
          className="pointer-events-auto max-w-xs rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-toast"
        >
          {toast.text}
        </p>
      ))}
    </div>
  );
}

export function ChatButton() {
  const { navigate } = useRouter();
  return (
    <button
      type="button"
      className="fixed bottom-5 right-5 z-[420] inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform hover:scale-105"
      aria-label="Chat with us"
      onClick={() => navigate("/contact")}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
    </button>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-footer text-card-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <p className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <House className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-2xl font-bold text-white">{BRAND.name}</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{BRAND.tagline}</p>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white">Quick Links</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            {FOOTER_QUICK_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white">Policies</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            {FOOTER_LEGAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white">Contact Us</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            <li>
              <a href={`mailto:${BRAND.email}`} className="hover:text-white">
                {BRAND.email}
              </a>
            </li>
            <li>
              <a href={`tel:${BRAND.phone.replace(/[^+\d]/g, "")}`} className="hover:text-white">
                {BRAND.phone}
              </a>
            </li>
            <li>{BRAND.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function FeatureBar() {
  const items = [
    { icon: Truck, title: "Free Shipping", body: "On orders over $50" },
    { icon: ShieldCheck, title: "Secure Payment", body: "100% protected checkout" },
    { icon: RotateCcw, title: "Easy Returns", body: "30-day return policy" },
    { icon: Headphones, title: "24/7 Support", body: "Dedicated customer care" },
  ];
  return (
    <section aria-label="Store highlights">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PageShell({ children, admin }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[800] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      {!admin && <Footer />}
      <CartDrawer />
      <Toaster />
      {!admin && <ChatButton />}
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
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function inputClass(error?: boolean) {
  return cn(
    "h-12 w-full rounded-lg border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground",
    error ? "border-destructive" : "border-border",
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
        "inline-flex h-12 min-w-[44px] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-12 min-w-[44px] items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

import { useMemo, useState } from "react";
import {
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Mail,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { OutlineButton, PrimaryButton, inputClass } from "@/components/chrome";
import { productById } from "@/data/catalog";
import {
  deliveryWindow,
  formatCardNumber,
  formatExpiry,
  formatMoney,
  isCardNumberValid,
  isEmail,
  isExpiryValid,
  isZip,
} from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

function CodNotice({ totalCents, amountDue }: { totalCents?: number; amountDue?: string }) {
  return (
    <div className="rounded-xl border border-badge/40 bg-badge/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
        <Banknote className="h-4 w-4 text-primary" />
        Cash on Delivery
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {amountDue ? (
          <>
            Amount due: <span className="font-bold text-primary">{amountDue}</span>
          </>
        ) : (
          <>
            Pay when your order arrives. Please have{" "}
            <span className="font-bold text-primary">{totalCents !== undefined ? formatMoney(totalCents) : ""}</span>{" "}
            ready when your order arrives. Our delivery team will collect payment at your door.
          </>
        )}
      </p>
    </div>
  );
}

export function CartPage() {
  const { cart, products, setLineQty, removeLine, totals, promoCode, setPromo } = useStore();
  const { navigate } = useRouter();
  const [code, setCode] = useState(promoCode ?? "");
  const [promoOpen, setPromoOpen] = useState(Boolean(promoCode));

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-9 w-9 text-muted-foreground" strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">No items in cart. Start shopping to fill it up.</p>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse Products
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-foreground">
        Your Cart{" "}
        <span className="align-middle text-base font-normal text-muted-foreground">
          ({cart.reduce((sum, line) => sum + line.quantity, 0)} {cart.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <ul className="flex flex-col gap-4">
            {cart.map((line) => {
              const product = productById(line.productId, products);
              if (!product) return null;
              return (
                <li key={line.productId} className="relative flex gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
                  <img
                    src={product.image}
                    alt=""
                    width={88}
                    height={88}
                    className="h-[88px] w-[88px] rounded-lg border border-border bg-muted object-cover"
                  />
                  <div className="min-w-0 flex-1 pr-8">
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                      {product.category.replace("-", " ")}
                    </p>
                    <p className="mt-1 font-semibold text-primary">{formatMoney(product.priceCents)}</p>
                    <div className="mt-3 inline-flex items-center rounded-full border border-border">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground"
                        aria-label={`Decrease ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-medium" aria-live="polite">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground"
                        aria-label={`Increase ${product.name}`}
                        onClick={() => setLineQty(line.productId, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="ml-auto self-center font-bold text-foreground">
                    {formatMoney(product.priceCents * line.quantity)}
                  </p>
                  <button
                    type="button"
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => removeLine(line.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Continue Shopping
          </Link>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-2xl font-bold text-foreground">Order Summary</h2>
          <hr className="my-4 border-border" />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-foreground">{formatMoney(totals.subtotalCents)}</dd>
            </div>
            {totals.discountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({totals.appliedCode})</dt>
                <dd className="font-semibold text-accent">−{formatMoney(totals.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className={cn("font-semibold", totals.shippingCents === 0 ? "text-accent" : "text-foreground")}>
                {totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="text-base font-bold text-foreground">Total</dt>
              <dd className="text-base font-bold text-foreground">{formatMoney(totals.totalCents)}</dd>
            </div>
          </dl>

          <div className="mt-4">
            <CodNotice totalCents={totals.totalCents} />
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              aria-expanded={promoOpen}
              onClick={() => setPromoOpen((open) => !open)}
            >
              Have a promo code?
            </button>
            {promoOpen && (
              <div className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className={inputClass()}
                />
                <PrimaryButton className="h-12 px-5" onClick={() => setPromo(code)}>
                  Apply
                </PrimaryButton>
              </div>
            )}
            {totals.notice && (
              <p className="mt-2 text-sm text-destructive" role="status" aria-label="Promotion notice">
                {totals.notice}
              </p>
            )}
            {totals.appliedCode && (
              <p className="mt-2 text-sm text-accent" role="status" aria-label="Promotion status">
                {totals.appliedCode} applied.
              </p>
            )}
          </div>

          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            Proceed to Checkout
            <ChevronRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
  payment: "cod" | "card";
  card: string;
  expiry: string;
  cvc: string;
};

export function CheckoutPage() {
  const { cart, products, totals, user, placeOrder } = useStore();
  const { navigate } = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultAddress = user?.addresses.find((item) => item.isDefault) ?? user?.addresses[0];
  const [form, setForm] = useState<CheckoutForm>({
    name: defaultAddress?.name ?? user?.name ?? "",
    phone: "",
    email: user?.email ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    zip: defaultAddress?.zip ?? "",
    country: defaultAddress?.country ?? "United States",
    notes: "",
    payment: "cod",
    card: "",
    expiry: "",
    cvc: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">No items in cart</h1>
        <PrimaryButton className="mt-8" onClick={() => navigate("/products")}>
          Browse Products
        </PrimaryButton>
      </div>
    );
  }

  const set = (key: keyof CheckoutForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Full name is required.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number.";
    if (form.email && !isEmail(form.email)) next.email = "Enter a valid email.";
    if (form.line1.trim().length < 4) next.line1 = "Street address is too short.";
    if (form.city.trim().length < 2) next.city = "City is required.";
    if (form.state.trim().length < 2) next.state = "State is required.";
    if (form.zip.trim() && !isZip(form.zip)) next.zip = "Use a 5-digit ZIP.";
    if (form.payment === "card") {
      if (!isCardNumberValid(form.card)) next.card = "Enter a card number of at least 13 digits.";
      if (!isExpiryValid(form.expiry)) next.expiry = "Use MM/YY.";
      if (form.cvc.replace(/\D/g, "").length < 3) next.cvc = "CVC needs 3 digits.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPlace = () => {
    if (!validate()) return;
    setPending(true);
    setError(null);
    const result = placeOrder({
      email: form.email,
      last4:
        form.payment === "card"
          ? form.card.replace(/\D/g, "").slice(-4)
          : "COD",
      address: {
        name: form.name,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(`/order-success?order=${encodeURIComponent(result.order.number)}&token=${result.order.guestToken}`);
  };

  const summary = (
    <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-2xl font-bold text-foreground">Order Summary</h2>
      <hr className="my-4 border-border" />
      <ul className="flex flex-col gap-3 text-sm">
        {cart.map((line) => {
          const product = productById(line.productId, products);
          if (!product) return null;
          return (
            <li key={line.productId} className="flex items-center gap-3">
              <img
                src={product.image}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg border border-border bg-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {line.quantity}</p>
              </div>
              <span className="font-semibold text-foreground">
                {formatMoney(product.priceCents * line.quantity)}
              </span>
            </li>
          );
        })}
      </ul>
      <hr className="my-4 border-border" />
      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-semibold text-foreground">{formatMoney(totals.subtotalCents)}</dd>
        </div>
        {totals.discountCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount ({totals.appliedCode})</dt>
            <dd className="font-semibold text-accent">−{formatMoney(totals.discountCents)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className={cn("font-semibold", totals.shippingCents === 0 ? "text-accent" : "text-foreground")}>
            {totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-3">
          <dt className="text-base font-bold text-foreground">Total</dt>
          <dd className="text-base font-bold text-foreground">{formatMoney(totals.totalCents)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-primary" /> Fast delivery
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure
        </span>
      </div>
      <PrimaryButton className="mt-5 w-full" onClick={onPlace} disabled={pending}>
        {pending ? "Placing..." : "Place Order"}
        {!pending && <ChevronRight className="h-4 w-4" />}
      </PrimaryButton>
      {error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </aside>
  );

  const card = (title: string, children: React.ReactNode) => (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-foreground">Checkout</h1>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {card(
            "Contact Information",
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-name" className="text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <input
                  id="co-name"
                  autoComplete="name"
                  required
                  placeholder="John Doe"
                  className={cn(inputClass(Boolean(fieldErrors.name)), "mt-1.5")}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                {fieldErrors.name && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="co-phone" className="text-sm font-medium text-foreground">
                  Phone Number *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  className={cn(inputClass(Boolean(fieldErrors.phone)), "mt-1.5")}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
                {fieldErrors.phone && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(inputClass(Boolean(fieldErrors.email)), "mt-1.5")}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.email}</p>}
              </div>
            </div>,
          )}

          {card(
            "Shipping Address",
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label htmlFor="co-line1" className="text-sm font-medium text-foreground">
                  Street Address *
                </label>
                <input
                  id="co-line1"
                  autoComplete="address-line1"
                  required
                  placeholder="123 Main Street"
                  className={cn(inputClass(Boolean(fieldErrors.line1)), "mt-1.5")}
                  value={form.line1}
                  onChange={(e) => set("line1", e.target.value)}
                />
                {fieldErrors.line1 && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.line1}</p>}
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="co-line2" className="text-sm font-medium text-foreground">
                  Apartment, Suite, etc. (optional)
                </label>
                <input
                  id="co-line2"
                  autoComplete="address-line2"
                  placeholder="Apt 4B"
                  className={cn(inputClass(), "mt-1.5")}
                  value={form.line2}
                  onChange={(e) => set("line2", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="co-city" className="text-sm font-medium text-foreground">
                  City *
                </label>
                <input
                  id="co-city"
                  autoComplete="address-level2"
                  required
                  placeholder="New York"
                  className={cn(inputClass(Boolean(fieldErrors.city)), "mt-1.5")}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
                {fieldErrors.city && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.city}</p>}
              </div>
              <div>
                <label htmlFor="co-state" className="text-sm font-medium text-foreground">
                  State
                </label>
                <input
                  id="co-state"
                  autoComplete="address-level1"
                  placeholder="NY"
                  className={cn(inputClass(Boolean(fieldErrors.state)), "mt-1.5")}
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                />
                {fieldErrors.state && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.state}</p>}
              </div>
              <div>
                <label htmlFor="co-zip" className="text-sm font-medium text-foreground">
                  ZIP Code
                </label>
                <input
                  id="co-zip"
                  autoComplete="postal-code"
                  placeholder="10001"
                  className={cn(inputClass(Boolean(fieldErrors.zip)), "mt-1.5")}
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                />
                {fieldErrors.zip && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.zip}</p>}
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="co-country" className="text-sm font-medium text-foreground">
                  Country
                </label>
                <select
                  id="co-country"
                  autoComplete="country-name"
                  className={cn(inputClass(), "mt-1.5 appearance-none")}
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  {["United States", "Canada", "United Kingdom", "Australia", "Singapore"].map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>,
          )}

          {card(
            "Payment Method",
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                role="radio"
                aria-checked={form.payment === "cod"}
                onClick={() => set("payment", "cod")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  form.payment === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Banknote className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-foreground">Cash on Delivery</span>
                  <span className="block text-sm text-muted-foreground">
                    Pay with cash when your order arrives
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border-2",
                    form.payment === "cod" ? "border-primary" : "border-border",
                  )}
                >
                  {form.payment === "cod" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={form.payment === "card"}
                onClick={() => set("payment", "card")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  form.payment === "card" ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-foreground">Credit / Debit Card</span>
                  <span className="block text-sm text-muted-foreground">
                    Demo checkout — card data never leaves this browser
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border-2",
                    form.payment === "card" ? "border-primary" : "border-border",
                  )}
                >
                  {form.payment === "card" && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
              {form.payment === "card" && (
                <div className="grid gap-4 rounded-xl border border-border bg-muted/50 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="co-card" className="text-sm font-medium text-foreground">
                      Card number
                    </label>
                    <input
                      id="co-card"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      className={cn(inputClass(Boolean(fieldErrors.card)), "mt-1.5")}
                      value={formatCardNumber(form.card)}
                      onChange={(e) => set("card", e.target.value)}
                    />
                    {fieldErrors.card && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.card}</p>}
                  </div>
                  <div>
                    <label htmlFor="co-expiry" className="text-sm font-medium text-foreground">
                      Expiry
                    </label>
                    <input
                      id="co-expiry"
                      autoComplete="cc-exp"
                      placeholder="12/28"
                      className={cn(inputClass(Boolean(fieldErrors.expiry)), "mt-1.5")}
                      value={form.expiry}
                      onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                    />
                    {fieldErrors.expiry && (
                      <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.expiry}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="co-cvc" className="text-sm font-medium text-foreground">
                      CVC
                    </label>
                    <input
                      id="co-cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      className={cn(inputClass(Boolean(fieldErrors.cvc)), "mt-1.5")}
                      value={form.cvc}
                      onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                    {fieldErrors.cvc && <p className="mt-1 text-sm text-destructive" role="alert">{fieldErrors.cvc}</p>}
                  </div>
                </div>
              )}
            </div>,
          )}

          {card(
            "Order Notes (optional)",
            <div>
              <label htmlFor="co-notes" className="sr-only">
                Order notes
              </label>
              <textarea
                id="co-notes"
                rows={4}
                placeholder="Any special delivery instructions..."
                className="w-full rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>,
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}

export function OrderSuccessPage() {
  const query = useQuery();
  const { navigate } = useRouter();
  const { orders, user } = useStore();
  const number = query.get("order");
  const token = query.get("token");
  const order = useMemo(
    () => orders.find((item) => item.number === number && (item.guestToken === token || item.userId === user?.id)),
    [number, orders, token, user?.id],
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">We cannot show that order</h1>
        <p className="mt-3 text-muted-foreground">The confirmation link is missing or expired.</p>
      </div>
    );
  }

  const windowLabel = deliveryWindow(order.placedAt, order.status);
  const isCod = order.paymentLast4 === "COD";

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft">
          <Check className="h-10 w-10 text-accent" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold text-foreground">Order Placed!</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you for your order. We'll start processing it right away.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
          <Package className="h-4 w-4" />
          Order #{order.number}
        </p>
      </div>

      {isCod && (
        <div className="mt-8">
          <CodNotice totalCents={order.totalCents} />
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-bold text-foreground">Order Details</h2>
        </div>
        <ul className="flex flex-col gap-4 px-6 py-5">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-4">
              <img
                src={item.image}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-lg border border-border bg-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-foreground">{formatMoney(item.unitCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border px-6 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="text-muted-foreground">{formatMoney(order.subtotalCents)}</dd>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="text-accent">−{formatMoney(order.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className={order.shippingCents === 0 ? "text-accent" : "text-muted-foreground"}>
              {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{formatMoney(order.totalCents)}</dd>
          </div>
        </dl>
        <div className="border-t border-border px-6 py-5">
          <h3 className="text-sm font-bold text-foreground">Delivery Information</h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> {order.shippingAddress.name}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {order.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state} {order.shippingAddress.zip}, {order.shippingAddress.country}
            </li>
          </ul>
          {windowLabel && (
            <p className="mt-3 text-sm text-muted-foreground">
              <Truck className="mr-1.5 inline h-4 w-4 text-primary" />
              Estimated delivery: <span className="font-semibold text-foreground">{windowLabel}</span>
            </p>
          )}
        </div>
      </section>

      {/* Session-36 (F36-12): `flex-1` + h-12 inside this mobile flex-col row
          collapsed both buttons to 20px — the flex algorithm ignores
          `height` under `flex-basis: 0%`. w-full sm:w-auto keeps the
          stacked-full-width mobile layout at the designed 48px height. */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <OutlineButton className="w-full sm:w-auto" onClick={() => navigate("/")}>
          Back to Home
        </OutlineButton>
        <PrimaryButton className="w-full sm:w-auto" onClick={() => navigate("/products")}>
          Continue Shopping
        </PrimaryButton>
      </div>
    </div>
  );
}

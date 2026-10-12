import { useMemo, useState, type FormEvent } from "react";
import { Field, PrimaryButton, inputClass } from "@/components/chrome";
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

export function CartPage() {
  const { cart, products, setLineQty, removeLine, totals, promoCode, setPromo } = useStore();
  const [code, setCode] = useState(promoCode ?? "");

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-espresso">Your cart is empty</h1>
        <p className="mt-3 text-muted">No items in cart. The board is clear.</p>
        <Link href="/products" className="mt-8 inline-flex h-12 items-center bg-copper px-6 text-sm text-linen">
          Shop the atelier
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-display text-4xl text-espresso">Cart</h1>
        <ul className="mt-8 flex flex-col gap-6">
          {cart.map((line) => {
            const product = productById(line.productId, products);
            if (!product) return null;
            return (
              <li key={line.productId} className="flex gap-4 border-b border-line pb-6">
                <img src={product.image} alt="" width={96} height={96} className="h-24 w-24 object-cover" />
                <div className="flex-1">
                  <Link href={`/products/${product.slug}`} className="font-medium text-espresso">
                    {product.name}
                  </Link>
                  <p className="font-mono text-sm text-copper">{formatMoney(product.priceCents)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" className="h-10 w-10 border border-line" onClick={() => setLineQty(line.productId, line.quantity - 1)}>
                      −
                    </button>
                    <span className="w-8 text-center">{line.quantity}</span>
                    <button type="button" className="h-10 w-10 border border-line" onClick={() => setLineQty(line.productId, line.quantity + 1)}>
                      +
                    </button>
                    <button type="button" className="ml-4 text-sm text-muted underline" onClick={() => removeLine(line.productId)}>
                      Remove
                    </button>
                  </div>
                </div>
                <p className="font-mono text-sm">{formatMoney(product.priceCents * line.quantity)}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="h-fit border border-line bg-cream p-6">
        <h2 className="font-display text-2xl text-espresso">Summary</h2>
        <div className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Promo code"
            className={inputClass()}
            aria-label="Promo code"
          />
          <PrimaryButton className="px-4" onClick={() => setPromo(code)}>
            Apply
          </PrimaryButton>
        </div>
        {totals.notice && (
          <p className="mt-2 text-sm text-danger" role="status" aria-label="Promotion notice">
            {totals.notice}
          </p>
        )}
        {totals.appliedCode && (
          <p className="mt-2 text-sm text-success" role="status" aria-label="Promotion status">
            {totals.appliedCode} applied.
          </p>
        )}
        <dl className="mt-6 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-mono">{formatMoney(totals.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd className="font-mono">−{formatMoney(totals.discountCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="font-mono">{totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd className="font-mono">{formatMoney(totals.taxCents)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-3 text-base">
            <dt>Total</dt>
            <dd className="font-mono">{formatMoney(totals.totalCents)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="mt-6 flex h-12 items-center justify-center bg-copper text-sm text-linen">
          Checkout
        </Link>
      </aside>
    </div>
  );
}

export function CheckoutPage() {
  const { cart, products, totals, user, placeOrder } = useStore();
  const { navigate } = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultAddress = user?.addresses.find((item) => item.isDefault) ?? user?.addresses[0];
  const [form, setForm] = useState({
    email: user?.email ?? "",
    name: defaultAddress?.name ?? user?.name ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    zip: defaultAddress?.zip ?? "",
    country: defaultAddress?.country ?? "United States",
    card: "",
    expiry: "",
    cvc: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-espresso">No items in cart</h1>
        <Link href="/products" className="mt-8 inline-flex h-12 items-center bg-copper px-6 text-sm text-linen">
          Shop the atelier
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validateShipping = () => {
    const next: Record<string, string> = {};
    if (!isEmail(form.email)) next.email = "Enter a valid email.";
    if (form.name.trim().length < 2) next.name = "Name is required.";
    if (form.line1.trim().length < 4) next.line1 = "Street address is too short.";
    if (form.city.trim().length < 2) next.city = "City is required.";
    if (form.state.trim().length < 2) next.state = "State is required.";
    if (!isZip(form.zip)) next.zip = "Use a 5-digit ZIP.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = () => {
    const next: Record<string, string> = {};
    if (!isCardNumberValid(form.card)) next.card = "Enter a card number of at least 13 digits.";
    if (!isExpiryValid(form.expiry)) next.expiry = "Use MM/YY.";
    if (form.cvc.replace(/\D/g, "").length < 3) next.cvc = "CVC needs 3 digits.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPlace = async () => {
    setPending(true);
    setError(null);
    const result = placeOrder({
      email: form.email,
      last4: form.card.replace(/\D/g, "").slice(-4),
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

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-display text-4xl text-espresso">Checkout</h1>
        <ol className="mt-4 flex gap-4 font-mono text-xs uppercase tracking-wider text-muted">
          <li className={step === 1 ? "text-copper" : ""}>1 · Shipping</li>
          <li className={step === 2 ? "text-copper" : ""}>2 · Payment</li>
          <li className={step === 3 ? "text-copper" : ""}>3 · Review</li>
        </ol>

        {error && (
          <p className="mt-4 border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {step === 1 && (
          <form
            className="mt-8 grid gap-4"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (validateShipping()) setStep(2);
            }}
          >
            <Field id="email" label="Email" error={fieldErrors.email}>
              <input id="email" autoComplete="email" className={inputClass(Boolean(fieldErrors.email))} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field id="name" label="Full name" error={fieldErrors.name}>
              <input id="name" autoComplete="name" className={inputClass(Boolean(fieldErrors.name))} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field id="line1" label="Street address" error={fieldErrors.line1}>
              <input id="line1" autoComplete="address-line1" className={inputClass(Boolean(fieldErrors.line1))} value={form.line1} onChange={(e) => set("line1", e.target.value)} />
            </Field>
            <Field id="line2" label="Apartment, suite (optional)">
              <input id="line2" autoComplete="address-line2" className={inputClass()} value={form.line2} onChange={(e) => set("line2", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="city" label="City" error={fieldErrors.city}>
                <input id="city" autoComplete="address-level2" className={inputClass(Boolean(fieldErrors.city))} value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field id="state" label="State" error={fieldErrors.state}>
                <input id="state" autoComplete="address-level1" className={inputClass(Boolean(fieldErrors.state))} value={form.state} onChange={(e) => set("state", e.target.value)} />
              </Field>
              <Field id="zip" label="ZIP" error={fieldErrors.zip}>
                <input id="zip" autoComplete="postal-code" className={inputClass(Boolean(fieldErrors.zip))} value={form.zip} onChange={(e) => set("zip", e.target.value)} />
              </Field>
            </div>
            <PrimaryButton type="submit">Continue to payment</PrimaryButton>
          </form>
        )}

        {step === 2 && (
          <form
            className="mt-8 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (validatePayment()) setStep(3);
            }}
          >
            <p className="text-sm text-muted">Demo checkout — card data never leaves this browser.</p>
            <Field id="card" label="Card number" error={fieldErrors.card}>
              <input
                id="card"
                autoComplete="cc-number"
                className={inputClass(Boolean(fieldErrors.card))}
                value={formatCardNumber(form.card)}
                onChange={(e) => set("card", e.target.value)}
                placeholder="4242 4242 4242 4242"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="expiry" label="Expiry" error={fieldErrors.expiry}>
                <input
                  id="expiry"
                  autoComplete="cc-exp"
                  className={inputClass(Boolean(fieldErrors.expiry))}
                  value={form.expiry}
                  onChange={(e) => set("expiry", formatExpiry(e.target.value))}
                  placeholder="12/28"
                />
              </Field>
              <Field id="cvc" label="CVC" error={fieldErrors.cvc}>
                <input
                  id="cvc"
                  autoComplete="cc-csc"
                  className={inputClass(Boolean(fieldErrors.cvc))}
                  value={form.cvc}
                  onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
            </div>
            <div className="flex gap-3">
              <button type="button" className="h-12 px-4 text-sm underline" onClick={() => setStep(1)}>
                Back
              </button>
              <PrimaryButton type="submit">Review order</PrimaryButton>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h2 className="font-display text-2xl">Review</h2>
            <p className="mt-3 text-sm text-muted">
              {form.name} · {form.email}
              <br />
              {form.line1}, {form.city} {form.state} {form.zip}
              <br />
              Card ending {form.card.replace(/\D/g, "").slice(-4)}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="h-12 px-4 text-sm underline" onClick={() => setStep(1)}>
                Edit
              </button>
              <PrimaryButton onClick={onPlace} disabled={pending}>
                {pending ? "Placing..." : `Pay ${formatMoney(totals.totalCents)}`}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
      <aside className="h-fit border border-line bg-cream p-6">
        <h2 className="font-display text-xl">Order</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {cart.map((line) => {
            const product = productById(line.productId, products);
            if (!product) return null;
            return (
              <li key={line.productId} className="flex justify-between gap-3">
                <span>
                  {product.name} × {line.quantity}
                </span>
                <span className="font-mono">{formatMoney(product.priceCents * line.quantity)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
          <span>Total</span>
          <span className="font-mono">{formatMoney(totals.totalCents)}</span>
        </p>
      </aside>
    </div>
  );
}

export function OrderSuccessPage() {
  const query = useQuery();
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
        <h1 className="font-display text-4xl">We cannot show that order</h1>
        <p className="mt-3 text-muted">The confirmation link is missing or expired.</p>
      </div>
    );
  }

  const windowLabel = deliveryWindow(order.placedAt, order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-copper">Thank you</p>
      <h1 className="mt-3 font-display text-4xl text-espresso">Order {order.number}</h1>
      <p className="mt-3 text-muted">Paid · {formatMoney(order.totalCents)}. A cook, not a call center, packed this.</p>
      {windowLabel && <p className="mt-2 text-sm text-espresso">Estimated delivery: {windowLabel}</p>}
      <ul className="mt-8 flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-mono">{formatMoney(item.unitCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex gap-4">
        <Link href={user ? `/account/orders/${order.id}` : "/account"} className="inline-flex h-12 items-center bg-copper px-6 text-sm text-linen">
          View orders
        </Link>
        <Link href="/products" className="inline-flex h-12 items-center border border-espresso px-6 text-sm">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

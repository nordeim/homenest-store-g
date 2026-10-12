import { useState, type FormEvent } from "react";
import { Field, PrimaryButton, inputClass } from "@/components/chrome";
import { ProductCard } from "@/components/product";
import {
  deliveryWindow,
  formatMoney,
  isEmail,
  isZip,
  statusLabel,
  trackingUrl,
  validateRedirectPath,
} from "@/lib/commerce";
import { Link, useQuery, useRouter } from "@/lib/router";
import { useStore } from "@/lib/store";
import type { Address, Order } from "@/types";

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useStore();
  const { navigate } = useRouter();
  const query = useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const message =
      mode === "login" ? login(email, password) : register(email, password, email.split("@")[0] ?? "Guest");
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    navigate(validateRedirectPath(query.get("redirect")));
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl text-espresso">{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "login" ? (
          <>
            New to the house?{" "}
            <Link href="/register" className="text-copper underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already nested?{" "}
            <Link href="/login" className="text-copper underline">
              Sign in
            </Link>
          </>
        )}
      </p>
      {error && (
        <p className="mt-4 border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <Field id="auth-email" label="Email">
          <input id="auth-email" type="email" autoComplete="email" className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="auth-password" label="Password">
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {mode === "register" && (
          <Field id="auth-confirm" label="Confirm password">
            <input id="auth-confirm" type="password" autoComplete="new-password" className={inputClass()} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        )}
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? (mode === "login" ? "Signing in..." : "Creating account...") : mode === "login" ? "Sign in" : "Create account"}
        </PrimaryButton>
      </form>
      {mode === "login" && (
        <p className="mt-6 text-xs text-muted">
          Demo customer: john@example.com / Demo1234!
          <br />
          Demo admin: admin@homenest.kitchen / Admin1234!
        </p>
      )}
    </div>
  );
}

export function LoginPage() {
  return <AuthForm mode="login" />;
}

export function RegisterPage() {
  return <AuthForm mode="register" />;
}

function OrderRow({ order }: { order: Order }) {
  const refunded = order.status === "refunded";
  return (
    <li className="flex flex-col gap-2 border-b border-line py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href={`/account/orders/${order.id}`} className="font-mono text-sm text-copper">
          {order.number}
        </Link>
        <p className="text-sm text-muted">
          {new Date(order.placedAt).toLocaleDateString("en-US")} · {statusLabel(order.status)}
        </p>
        {refunded && (
          <p className="text-sm text-muted">Refunded · {formatMoney(order.totalCents)} returned</p>
        )}
      </div>
      <p className="font-mono text-sm">{formatMoney(order.totalCents)}</p>
    </li>
  );
}

export function AccountPage() {
  const { user, logout, orders, wishlist, products, updateProfile, changePassword, saveAddress, deleteAddress } = useStore();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<"orders" | "profile" | "addresses" | "saved">("orders");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);

  if (!user) {
    return <AuthForm mode="login" />;
  }

  const mine = orders.filter((order) => order.userId === user.id);
  const saved = products.filter((product) => wishlist.includes(product.id) && product.visible);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-copper">Account</p>
          <h1 className="mt-2 font-display text-4xl text-espresso">{user.name}</h1>
        </div>
        <div className="flex gap-3">
          {user.role === "admin" && (
            <Link href="/admin" className="h-11 px-4 text-sm leading-[44px] text-copper underline">
              Admin
            </Link>
          )}
          <button
            type="button"
            className="h-11 text-sm underline"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 border-b border-line">
        {(["orders", "profile", "addresses", "saved"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`h-11 capitalize ${tab === key ? "border-b-2 border-copper text-espresso" : "text-muted"}`}
            onClick={() => setTab(key)}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <ul className="mt-6">
          {mine.length === 0 && <p className="py-10 text-muted">No orders yet.</p>}
          {mine.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}

      {tab === "profile" && (
        <div className="mt-8 grid max-w-lg gap-8">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const err = updateProfile(name, email);
              setProfileMsg(err ?? "Profile updated.");
            }}
          >
            <Field id="profile-name" label="Name">
              <input id="profile-name" className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field id="profile-email" label="Email">
              <input id="profile-email" className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {profileMsg && <p className="text-sm text-muted">{profileMsg}</p>}
            <PrimaryButton type="submit" className="w-fit">
              Save
            </PrimaryButton>
          </form>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (pw.next !== pw.confirm) {
                setPwMsg("Passwords do not match.");
                return;
              }
              if (pw.next.length < 8) {
                setPwMsg("Password must be at least 8 characters.");
                return;
              }
              const err = changePassword(pw.current, pw.next);
              setPwMsg(err ?? "Password updated.");
            }}
          >
            <h2 className="font-display text-2xl">Change password</h2>
            <Field id="pw-current" label="Current password">
              <input id="pw-current" type="password" className={inputClass()} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field id="pw-next" label="New password">
              <input id="pw-next" type="password" className={inputClass()} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field id="pw-confirm" label="Confirm">
              <input id="pw-confirm" type="password" className={inputClass()} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            {pwMsg && <p className="text-sm text-muted">{pwMsg}</p>}
            <PrimaryButton type="submit" className="w-fit">
              Update password
            </PrimaryButton>
          </form>
        </div>
      )}

      {tab === "addresses" && (
        <div className="mt-8">
          <ul className="grid gap-4">
            {user.addresses.map((address) => (
              <li key={address.id} className="border border-line p-4">
                <p className="font-medium">
                  {address.label} {address.isDefault && <span className="ml-2 text-xs text-copper">Default</span>}
                </p>
                <p className="text-sm text-muted">
                  {address.line1}, {address.city} {address.state} {address.zip}
                </p>
                <div className="mt-3 flex gap-3 text-sm">
                  <button type="button" className="underline" onClick={() => setEditing(address)}>
                    Edit
                  </button>
                  <button type="button" className="underline" onClick={() => deleteAddress(address.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <PrimaryButton className="mt-6 w-fit" onClick={() => setEditing({
            id: `a-${Date.now()}`,
            label: "Home",
            name: user.name,
            line1: "",
            line2: "",
            city: "",
            state: "",
            zip: "",
            country: "United States",
            isDefault: user.addresses.length === 0,
          })}>
            Add address
          </PrimaryButton>
          {editing && (
            <form
              className="mt-6 grid max-w-lg gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (editing.line1.trim().length < 4 || !isZip(editing.zip)) return;
                saveAddress(editing);
                setEditing(null);
              }}
            >
              <Field id="addr-label" label="Label">
                <input id="addr-label" className={inputClass()} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </Field>
              <Field id="addr-line1" label="Street">
                <input id="addr-line1" className={inputClass()} value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} />
              </Field>
              <Field id="addr-city" label="City">
                <input id="addr-city" className={inputClass()} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
              <Field id="addr-zip" label="ZIP">
                <input id="addr-zip" className={inputClass()} value={editing.zip} onChange={(e) => setEditing({ ...editing, zip: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isDefault}
                  onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
                />
                Default address
              </label>
              <div className="flex gap-3">
                <PrimaryButton type="submit">Save</PrimaryButton>
                <button type="button" className="h-12 px-4 text-sm underline" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="mt-8">
          {saved.length === 0 ? (
            <p className="text-muted">Nothing saved yet.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {saved.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountOrderPage({ id }: { id: string }) {
  const { user, orders } = useStore();
  const order = orders.find((item) => item.id === id);
  if (!user || !order || order.userId !== user.id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
      </div>
    );
  }
  const href = trackingUrl(order.carrier, order.trackingNumber);
  const windowLabel = deliveryWindow(order.placedAt, order.status);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/account" className="text-sm text-muted">
        ← Orders
      </Link>
      <h1 className="mt-4 font-display text-4xl">{order.number}</h1>
      <p className="mt-2 text-muted">
        {statusLabel(order.status)} · {formatMoney(order.totalCents)}
      </p>
      {order.status === "refunded" && <p className="text-sm text-muted">Refunded · {formatMoney(order.totalCents)} returned</p>}
      {windowLabel && <p className="mt-2 text-sm">Estimated delivery: {windowLabel}</p>}
      {order.trackingNumber && (
        <p className="mt-2 text-sm">
          Tracking: {order.carrier}{" "}
          {href ? (
            <a href={href} className="text-copper underline" target="_blank" rel="noreferrer">
              {order.trackingNumber}
            </a>
          ) : (
            order.trackingNumber
          )}
        </p>
      )}
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
      <ol className="mt-8 border-t border-line pt-6 text-sm text-muted">
        {order.timeline.map((event) => (
          <li key={event.at + event.label} className="py-1">
            {event.label} · {new Date(event.at).toLocaleString()}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TrackOrderPage() {
  const { orders } = useStore();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<Order | null | "miss">(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const match = orders.find(
      (order) => order.number.toLowerCase() === number.trim().toLowerCase() && order.email === email.trim().toLowerCase(),
    );
    setFound(match ?? "miss");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl text-espresso">Order tracking</h1>
      <p className="mt-3 text-muted">Enter the order number and the email used at checkout.</p>
      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
        <Field id="track-number" label="Order number">
          <input id="track-number" className={inputClass()} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="ORD-2026-001" />
        </Field>
        <Field id="track-email" label="Email">
          <input id="track-email" className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <PrimaryButton type="submit">Track</PrimaryButton>
      </form>
      {found === "miss" && <p className="mt-6 text-sm text-muted">No matching order.</p>}
      {found && found !== "miss" && (
        <div className="mt-8 border border-line p-5">
          <p className="font-mono text-copper">{found.number}</p>
          <p className="mt-1">{statusLabel(found.status)}</p>
          {found.trackingNumber && (
            <p className="mt-2 text-sm">
              {found.carrier} {found.trackingNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Field, PrimaryButton, inputClass } from "@/components/chrome";
import { BRAND } from "@/data/catalog";
import { isEmail } from "@/lib/commerce";
import { useStore } from "@/lib/store";

export function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-copper">About</p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-espresso">The nest, explained.</h1>
      <img src="/images/atelier.jpg" alt="HomeNest atelier" width={1200} height={800} className="mt-10 w-full object-cover" />
      <div className="mt-10 space-y-5 text-base leading-relaxed text-muted">
        <p>
          HomeNest Kitchen is a professional destination for premium kitchen essentials, organized storage solutions, and
          gourmet cooking tools. We opened a one-room atelier in San Francisco because the tools we wanted — copper that
          actually cooks, knives that stay honest, jars that do not cloud — were either museum pieces or disposable.
        </p>
        <p>
          Every piece we list has to earn the counter. If it will live in a drawer after two uses, it does not ship. We
          hone the blades we sell. We crate the copper. We answer the mail ourselves.
        </p>
        <p>
          {BRAND.address}. Walk-ins on Saturdays. The kettle is usually on.
        </p>
      </div>
    </article>
  );
}

export function ContactPage() {
  const { toast } = useStore();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Name is required.");
      return;
    }
    if (!isEmail(form.email)) {
      setError("Enter a valid email.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Tell us a little more.");
      return;
    }
    setError(null);
    setSent(true);
    toast("Message received. The atelier will write back.");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl text-espresso">Contact</h1>
        <p className="mt-4 text-muted">
          {BRAND.email}
          <br />
          {BRAND.phone}
          <br />
          {BRAND.address}
        </p>
      </div>
      {sent ? (
        <p className="self-center text-lg text-espresso">Message received. We read every note.</p>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          {error && (
            <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Field id="c-name" label="Name">
            <input id="c-name" className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field id="c-email" label="Email">
            <input id="c-email" className={inputClass()} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field id="c-message" label="Message">
            <textarea
              id="c-message"
              rows={5}
              className="w-full border border-line bg-linen p-3 text-sm"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </Field>
          <PrimaryButton type="submit">Send</PrimaryButton>
        </form>
      )}
    </div>
  );
}

function Legal({ title, children }: { title: string; children: string[] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl text-espresso">{title}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        {children.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

export function PrivacyPage() {
  return (
    <Legal title="Privacy Policy">
      {[
        "HomeNest Kitchen collects only what a working shop needs: account email, shipping address, and order history. We do not sell lists.",
        "Cart and session data live in your browser for this demo. In production they would sit in a private database keyed by a signed cookie.",
        "You may request deletion of an account by writing hello@homenest.kitchen. Orders already placed are retained for tax records.",
      ]}
    </Legal>
  );
}

export function TermsPage() {
  return (
    <Legal title="Terms of Service">
      {[
        "By placing an order you agree that descriptions are honest, prices are in USD, and stock is reserved only when payment is captured.",
        "Title passes on delivery. Risk of loss follows the carrier once the crate leaves the atelier.",
        "These terms are governed by the laws of the State of California.",
      ]}
    </Legal>
  );
}

export function RefundPage() {
  return (
    <Legal title="Refund Policy">
      {[
        "Unused pieces in original packing may be returned within 30 days for a refund of merchandise (not outbound shipping).",
        "Copper and iron that have been cooked in are not returnable except for manufacturing defects.",
        "Knives with a damaged edge from misuse are honed, not refunded. Manufacturing chips are replaced.",
      ]}
    </Legal>
  );
}

export function CookiePage() {
  return (
    <Legal title="Cookie Policy">
      {[
        "We use a single first-party store (homenest.v1) to remember your cart, session, and wishlist on this device.",
        "No advertising pixels. No third-party trackers. Analytics, when enabled, are first-party and aggregated.",
        "Clearing site data logs you out and empties the guest cart.",
      ]}
    </Legal>
  );
}

export function DisclaimerPage() {
  return (
    <Legal title="Disclaimer">
      {[
        "Product photography is of the actual line or a faithful studio stand-in. Glaze and grain vary piece to piece — that is the point of clay and wood.",
        "Nutrition, recipe, or technique notes on this site are editorial, not medical advice.",
        "This storefront is a production-grade clone for demonstration; card fields are a demo wizard and never charge a network.",
      ]}
    </Legal>
  );
}

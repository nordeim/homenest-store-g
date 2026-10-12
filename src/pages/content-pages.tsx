import { useState, type FormEvent } from "react";
import { Award, Globe, Heart, HeartHandshake, Mail, MapPin, Phone, Send, Users } from "lucide-react";
import { PrimaryButton, inputClass } from "@/components/chrome";
import { useStore } from "@/lib/store";
import { BRAND } from "@/data/catalog";
import { cn } from "@/utils/cn";

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">{title}</h1>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
      )}
    </div>
  );
}

const VALUES = [
  {
    icon: Award,
    title: "Quality First",
    body: "Every product is carefully curated to meet our high standards of craftsmanship and durability.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    body: "Our customers are at the heart of everything we do. Your satisfaction is our top priority.",
  },
  {
    icon: Heart,
    title: "Passion for Design",
    body: "We believe great design makes everyday life more enjoyable. Each item is chosen for both form and function.",
  },
  {
    icon: Globe,
    title: "Sustainability",
    body: "We're committed to offering eco-friendly options and reducing our environmental footprint.",
  },
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageHeading
        title="About Us"
        subtitle="We are passionate about bringing you the finest home and kitchen products that combine quality, functionality, and beautiful design. Our mission is to help you create a home you love."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {VALUES.map((value) => (
          <div key={value.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <value.icon className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-secondary px-6 py-12 text-center sm:px-10">
        <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Our Promise</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          We stand behind every product we offer. If you're not completely satisfied, our dedicated support team is
          here to help. We believe in building lasting relationships with our customers through trust, transparency,
          and exceptional service.
        </p>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { toast } = useStore();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError("Please tell us your name.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Enter a valid email so we can reply.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Add a few more words to your message.");
      return;
    }
    setError(null);
    setSent(true);
    toast("Message sent — we reply within one business day.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const cards = [
    { icon: Mail, title: "Email", value: BRAND.email, href: `mailto:${BRAND.email}` },
    { icon: Phone, title: "Phone", value: BRAND.phone, href: `tel:${BRAND.phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, title: "Address", value: BRAND.address, href: null },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageHeading title="Contact Us" subtitle="We'd love to hear from you. Reach out anytime." />
      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-card">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <h2 className="mt-3 text-sm font-bold text-foreground">{card.title}</h2>
            {card.href ? (
              <a href={card.href} className="mt-1 block text-sm text-muted-foreground hover:text-foreground">
                {card.value}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <form
        className="mx-auto mt-10 max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card sm:p-8"
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="contact-name"
              className={cn(inputClass(), "mt-1.5")}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              className={cn(inputClass(), "mt-1.5")}
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="contact-subject" className="text-sm font-medium text-foreground">
            Subject
          </label>
          <input
            id="contact-subject"
            className={cn(inputClass(), "mt-1.5")}
            placeholder="How can we help?"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Tell us more..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {sent && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent" role="status">
            Thanks — your message is in. We reply within one business day.
          </p>
        )}
        <PrimaryButton type="submit" className="mt-6 w-full">
          <Send className="h-4 w-4" />
          Send Message
        </PrimaryButton>
      </form>

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <HeartHandshake className="h-4 w-4 text-primary" />
        Prefer self-service? Try Track Order for live status on any order.
      </p>
    </div>
  );
}

type LegalProps = { title: string; children: React.ReactNode };

function LegalLayout({ title, children }: LegalProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 12, 2026</p>
      <div className="prose-legal mt-8 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        HomeNest ("we", "us") respects your privacy. This demo storefront stores all customer, cart, and order data in
        your own browser's local storage — nothing you type here is transmitted to a server. Clearing your browser
        storage removes every trace of your session.
      </p>
      <h2>What we store</h2>
      <p>
        Account details (name, email, hashed-for-demo password), cart contents, wishlist, addresses you save, and the
        orders you place are kept in local storage under the key <code>homenest.v1</code> so that your cart survives a
        refresh and your order history stays available offline.
      </p>
      <h2>What we never do</h2>
      <ul>
        <li>Sell or share personal data with third parties.</li>
        <li>Run third-party analytics or advertising trackers.</li>
        <li>Transmit payment card data anywhere — card fields in checkout are demo-only and never leave the page.</li>
      </ul>
      <h2>Newsletter</h2>
      <p>
        Newsletter signups are stored locally and used only to demonstrate the subscription flow. In a production
        deployment this form would post to a consent-based mailing provider with an unsubscribe link in every email.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
      </p>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        By using this demo storefront you agree to these terms. The site is a portfolio-grade demonstration: products,
        prices, stock levels, and order flows are simulated in your browser and no real goods will be shipped.
      </p>
      <h2>Orders and payment</h2>
      <p>
        Placing an order creates a simulated order record with a confirmation number. Cash on Delivery and card
        checkout are demonstration flows; no charge is ever made. Order numbers, stock decrements, and status
        timelines mirror a production commerce engine so the experience is faithful end to end.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not attempt to disrupt the service, submit unlawful content through forms, or misrepresent your identity.
        The demo is provided as-is, without warranties of any kind.
      </p>
      <h2>Intellectual property</h2>
      <p>
        Product copy, layout, and design belong to their respective authors and are used here for demonstration.
      </p>
    </LegalLayout>
  );
}

export function RefundPage() {
  return (
    <LegalLayout title="Refund Policy">
      <p>
        We want you to love what you unbox. If a piece is not right, you have 30 days from delivery to request a
        return — unused, in original packaging, with any seals intact.
      </p>
      <h2>How to start a return</h2>
      <ul>
        <li>Email <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> with your order number and the reason.</li>
        <li>We reply with a prepaid label within one business day.</li>
        <li>Refunds land on the original payment method within 5–7 business days of arrival at our warehouse.</li>
      </ul>
      <h2>Exceptions</h2>
      <p>
        For hygiene reasons, opened storage sets and final-sale items marked at checkout cannot be returned. Damaged
        in transit? Send a photo within 48 hours and we replace it, no return needed.
      </p>
    </LegalLayout>
  );
}

export function CookiePage() {
  return (
    <LegalLayout title="Cookie Policy">
      <p>
        This storefront sets no tracking cookies. The only client-side persistence is your own local storage, used to
        keep your cart, session, and orders between visits. There are no analytics pixels, no advertising cookies, and
        no cross-site trackers of any kind.
      </p>
      <h2>Local storage keys</h2>
      <ul>
        <li><code>homenest.v1</code> — cart, wishlist, session, orders, and product overrides.</li>
      </ul>
      <p>
        You can inspect or delete this at any time in your browser's developer tools; the app re-seeds cleanly on the
        next load.
      </p>
    </LegalLayout>
  );
}

export function DisclaimerPage() {
  return (
    <LegalLayout title="Disclaimer">
      <p>
        This website is a functional demonstration built for engineering review. All products, prices, availability,
        reviews, and business details — including the brand, address, and contact details — are fictional and provided
        for evaluation only.
      </p>
      <h2>No commercial transactions</h2>
      <p>
        No payment is processed and no goods are shipped. Card fields accept demo input only; cash-on-delivery flows
        are simulated locally.
      </p>
      <h2>Liability</h2>
      <p>
        Nothing on this site constitutes professional advice. Use of the demo is at your own discretion; the authors
        accept no liability for decisions made on the basis of its content.
      </p>
    </LegalLayout>
  );
}

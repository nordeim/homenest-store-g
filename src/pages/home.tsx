import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FeatureBar } from "@/components/chrome";
import { ProductCard } from "@/components/product";
import { CATEGORIES } from "@/data/catalog";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";

export function HomePage() {
  const { carousel, visibleProducts } = useStore();
  const slides = carousel.filter((slide) => slide.active);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  const trending = visibleProducts.filter((product) => product.featured).slice(0, 6);
  const arrivals = visibleProducts.filter((product) => product.isNew);
  const sale = visibleProducts.filter((product) => product.compareAtCents);

  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden bg-espresso text-linen">
        {slides.map((item, slideIndex) => (
          <img
            key={item.id}
            src={item.image}
            alt=""
            width={1600}
            height={900}
            aria-hidden={slideIndex !== index}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: slideIndex === index ? 1 : 0 }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgb(28 20 16 / 0.78) 0%, rgb(28 20 16 / 0.18) 70%)" }}
        />
        {slide && (
          <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-4 py-16 sm:px-6 md:justify-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-copper">{slide.kicker}</p>
            <h1 className="mt-4 max-w-xl font-display text-[2.35rem] leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-linen/80">{slide.body}</p>
            <Link
              href={slide.href}
              className="mt-8 inline-flex h-12 w-fit items-center bg-copper px-6 text-sm font-medium text-linen"
            >
              {slide.cta}
            </Link>
            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center border border-linen/30"
                aria-label="Previous slide"
                onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center border border-linen/30"
                aria-label="Next slide"
                onClick={() => setIndex((current) => (current + 1) % slides.length)}
              >
                <ChevronRight />
              </button>
              <div className="flex gap-2 pl-2">
                {slides.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Show slide ${dotIndex + 1}`}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: dotIndex === index ? "hsl(18 58% 44%)" : "rgb(247 243 236 / 0.45)" }}
                    onClick={() => setIndex(dotIndex)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <FeatureBar />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Trending</p>
            <h2 className="mt-2 font-display text-3xl text-espresso md:text-4xl">On the counter this week</h2>
          </div>
          <Link href="/products" className="hidden text-sm text-copper underline sm:inline">
            Shop all
          </Link>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">Shop by category</p>
          <h2 className="mt-2 font-display text-3xl text-espresso">Six rooms of the house</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`} className="group relative block overflow-hidden">
                <img
                  src={category.image}
                  alt=""
                  width={800}
                  height={520}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 30%, rgb(28 20 16 / 0.72))" }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5 text-linen">
                  <p className="font-display text-2xl">{category.name}</p>
                  <p className="mt-1 text-sm text-linen/80">{category.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">New arrivals</p>
          <h2 className="mt-2 font-display text-3xl text-espresso">Just uncrated</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {arrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {sale.length > 0 && (
        <section className="border-t border-line bg-cream py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">On sale</p>
            <h2 className="mt-2 font-display text-3xl text-espresso">Quiet markdowns</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {sale.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
        <img src="/images/atelier.jpg" alt="The HomeNest atelier" width={900} height={700} className="w-full object-cover" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-copper">The house</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-espresso">A kitchen is a nest you build by hand.</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            HomeNest started as a one-room atelier in the Mission: copper that actually cooks, knives that stay sharp, jars
            that do not cloud. We still hone every blade we sell. We still refuse the gadget that will live in a drawer.
          </p>
          <Link href="/about" className="mt-8 inline-flex h-12 items-center border border-espresso px-6 text-sm text-espresso">
            Read the story
          </Link>
        </div>
      </section>
    </>
  );
}

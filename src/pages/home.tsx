import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FeatureBar } from "@/components/chrome";
import { ProductCard } from "@/components/product";
import { CATEGORIES } from "@/data/catalog";
import { Link } from "@/lib/router";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";

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
  const trending = visibleProducts.filter((product) => product.featured).slice(0, 8);
  const arrivals = visibleProducts.filter((product) => product.isNew).slice(0, 8);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8" aria-label="Featured collections">
        <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-foreground text-white md:min-h-[520px]">
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
            style={{ background: "linear-gradient(90deg, rgb(28 25 23 / 0.55) 0%, rgb(28 25 23 / 0.12) 65%)" }}
          />
          {slide && (
            <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-6 py-14 md:min-h-[520px] sm:px-10">
              <h1 className="max-w-xl font-display text-[2.4rem] font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">{slide.body}</p>
              <Link
                href={slide.href}
                className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
              >
                {slide.cta}
              </Link>
              <div className="absolute bottom-6 left-6 flex items-center gap-2 sm:left-10">
                {slides.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Show slide ${dotIndex + 1}`}
                    aria-pressed={dotIndex === index}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      dotIndex === index ? "w-7 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80",
                    )}
                    onClick={() => setIndex(dotIndex)}
                  />
                ))}
              </div>
              <div className="absolute bottom-6 right-6 flex gap-2 sm:right-10">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="Previous slide"
                  onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  aria-label="Next slide"
                  onClick={() => setIndex((current) => (current + 1) % slides.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <FeatureBar />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="categories-heading">
        <div className="text-center">
          <h2 id="categories-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Find exactly what your kitchen needs</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group relative block overflow-hidden rounded-xl border border-border shadow-card"
              aria-label={`Shop ${category.name}`}
            >
              <img
                src={category.image}
                alt=""
                width={800}
                height={520}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.05]"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 45%, rgb(28 25 23 / 0.72))" }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="font-display text-xl font-bold">{category.name}</p>
                <p className="mt-0.5 text-xs text-white/80">{category.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="featured-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Featured Products
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Hand-picked favorites from our collection</p>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:inline-flex"
          >
            View All
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {arrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="arrivals-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="arrivals-heading" className="font-display text-3xl font-bold text-foreground md:text-4xl">
                New Arrivals
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">Fresh pieces, just uncrated</p>
            </div>
            <Link
              href="/products"
              className="hidden shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted sm:inline-flex"
            >
              View All
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {arrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-label="Call to action">
        <div className="rounded-2xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-10">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Transform Your Kitchen Today</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            Browse our curated collection of premium home and kitchen essentials. Quality that lasts, design that
            inspires.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-foreground transition-colors hover:bg-white/90"
          >
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

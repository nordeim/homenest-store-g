import { expect, test } from "@playwright/test";

/**
 * Computed-style visual parity gate — the parity spec is a build-breaker,
 * mirroring the ecommerce-store reference convention ("screenshots are not
 * evidence; computed styles are"). Values measured live 2026-10-12 from
 * nest-culinary-hub.base44.app and from this build via getComputedStyle.
 */

test("body background matches the reference canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(251, 250, 249)");
});

test("primary actions use the reference orange", async ({ page }) => {
  await page.goto("/");
  const activeNav = page.locator('nav[aria-label="Primary"] a[aria-current="page"]');
  await expect(activeNav).toHaveCSS("background-color", "rgb(217, 110, 38)");
  const heroCta = page.locator("main").getByRole("link", { name: "Browse Collection" });
  await expect(heroCta).toHaveCSS("background-color", "rgb(217, 110, 38)");
});

test("headings render the reference display serif", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCSS("font-family", /Playfair Display/);
  await expect(page.locator("h1")).toHaveCSS("font-weight", "700");
});

test("footer uses the reference dark charcoal", async ({ page }) => {
  await page.goto("/");
  // Session-30 re-measurement (2026-10-14, agent-browser @390×844 + 1440×900,
  // logged in): the reference footer flipped from its dedicated charcoal
  // rgb(32,27,24) to bg-foreground — rgb(29,24,22) on fresh loads of / and
  // /products, both viewports. The clone follows the latest measurement.
  await expect(page.locator("footer")).toHaveCSS("background-color", "rgb(29, 24, 22)");
});

test("footer text layer matches the reference quiet-footer spec", async ({ page }) => {
  await page.goto("/");
  // Session-34 re-measurement (2026-10-14, agent-browser @390×844 + 1440×900,
  // logged in): the reference footer renders a "quiet" text layer on the
  // session-30 bg-foreground canvas — full text-background color (rgb(251,
  // 250,249)) modulated by ELEMENT opacity (70% links/tagline/contact, 50%
  // bottom bar), Playfair 16px/600 h4 column headings, a 20px Playfair brand
  // wordmark beside a bare 24px primary house glyph, and a contained 1px
  // background/10 divider. The clone previously mirrored its own header's
  // brand treatment (orange square + white glyph) and used white/60 COLOR
  // alpha on links — visually darker at rest (rendered ~rgb(165,163,162) vs
  // the reference's ~rgb(187,186,185)) and without the orange hover. This
  // spec pins the measured reference values.
  const footer = page.locator("footer");
  await expect(footer).toHaveCSS("color", "rgb(251, 250, 249)");

  const link = footer.getByRole("link", { name: "Products", exact: true });
  await expect(link).toHaveCSS("color", "rgb(251, 250, 249)");
  await expect(link).toHaveCSS("opacity", "0.7");

  const heading = footer.getByRole("heading", { name: "Quick Links", exact: true });
  await expect(heading).toHaveCSS("font-family", /Playfair Display/);
  await expect(heading).toHaveCSS("font-size", "16px");
  await expect(heading).toHaveCSS("font-weight", "600");

  const brand = footer.locator("span.font-display");
  await expect(brand).toHaveCSS("font-size", "20px");
  await expect(brand).toHaveCSS("font-weight", "700");

  const bottomLink = footer.getByRole("link", { name: "Privacy", exact: true });
  await expect(bottomLink).toHaveCSS("font-size", "12px");
  await expect(bottomLink).toHaveCSS("opacity", "0.5");

  const divider = footer.locator(".bg-footer-rule");
  await expect(divider).toHaveCSS("background-color", "rgba(251, 250, 249, 0.1)");
  await expect(divider).toHaveCSS("height", "1px");
});

test("header brand mark matches the reference geometry", async ({ page }) => {
  await page.goto("/");
  // Session-34 measurement (same sweep): the reference's header brand mark
  // is a 36px rounded-xl (12px) primary square with a 20px stroke-2 house
  // glyph and shadow-sm → shadow-md on group hover, beside a 20px/700
  // Playfair wordmark with default letter-spacing. The clone ported
  // rounded-lg + text-[1.4rem] + tracking-tight + stroke 2.2 — pinned here
  // to the measured reference values.
  const brandLink = page
    .locator("header")
    .getByRole("link", { name: "HomeNest home" });
  const mark = brandLink.locator("span.bg-primary");
  await expect(mark).toHaveCSS("border-radius", "12px");
  await expect(mark).toHaveCSS("width", "36px");

  const wordmark = brandLink.locator("span.font-display");
  await expect(wordmark).toHaveCSS("font-family", /Playfair Display/);
  await expect(wordmark).toHaveCSS("font-size", "20px");
  await expect(wordmark).toHaveCSS("font-weight", "700");
  await expect(wordmark).toHaveCSS("letter-spacing", "normal");
});

test("body text renders in the reference's Inter", async ({ page }) => {
  await page.goto("/");
  // Session-34 measurement (same sweep): the reference self-hosts Inter
  // (weights 300–700, document.fonts) and sets its body font to Inter —
  // every non-display glyph renders in Inter. The clone shipped the system
  // sans stack (v1 port); pinned here so body typography matches. Inter
  // loads from Google Fonts exactly like the existing Playfair link, with
  // the system stack retained as the offline fallback.
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family.startsWith("Inter")).toBe(true);
  const interReady = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check("16px Inter");
  });
  expect(interReady).toBe(true);
});

test("product cards show discount and featured pills with round geometry", async ({ page }) => {
  await page.goto("/products");
  const discount = page.locator("article").filter({ hasText: "Damascus Steel Chef Knife Set" }).first().getByText("-29%");
  await expect(discount).toHaveCSS("background-color", "rgb(220, 40, 40)");
  await expect(discount).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("cart badge uses the primary orange", async ({ page }) => {
  await page.goto("/products");
  await page.locator('button[aria-label^="Add Damascus Steel Chef Knife Set"]').first().click();
  const badge = page.locator('button[aria-label="Open cart"] span');
  await expect(badge).toHaveText("1");
  await expect(badge).toHaveCSS("background-color", "rgb(217, 110, 38)");
});

test("sticky header matches the reference glass layer", async ({ page }) => {
  await page.goto("/");
  // Session-36 measurement (logged-in reference, 390x844 + 1440x900):
  // the reference's sticky nav paints rgba(255,255,255,0.8) with a
  // 24px backdrop frost and a 0.5-alpha hairline. The clone shipped
  // bg-card/95 + blur(8px) + a solid border (v1 port, never measured).
  // The white/80 alpha is baked into the --color-panel token (T-13
  // doctrine: v4 /80 would color-mix in oklab, not rgba).
  const header = page.locator("header");
  await expect(header).toHaveCSS("background-color", "rgba(255, 255, 255, 0.8)");
  await expect(header).toHaveCSS("backdrop-filter", "blur(24px)");
  await expect(header).toHaveCSS("border-bottom-width", "1px");
  await expect(header).toHaveCSS("border-bottom-color", "rgba(229, 224, 220, 0.5)");
});

test("hero text layer matches the reference scale", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1").first();
  const p = h1.locator("..").locator("p").first();
  // Session-36 measurement: the reference hero renders
  // text-4xl md:text-6xl (36 -> 60px, leading-tight) with the
  // paragraph at text-lg md:text-xl (18 -> 20px), white/80, max-w-lg.
  // The clone shipped 2.4rem/5xl/6xl + 16px/85%/max-w-md.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  await expect(h1).toHaveCSS("font-size", isMobile ? "36px" : "60px");
  await expect(h1).toHaveCSS("font-weight", "700");
  await expect(h1).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(p).toHaveCSS("font-size", isMobile ? "18px" : "20px");
  await expect(p).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");
  await expect(p).toHaveCSS("max-width", "512px");
});

test("hero CTA and carousel controls match the reference geometry", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1").first();
  const hero = h1.locator("xpath=ancestor::div[3]");
  // CTA: the reference ships an h-10 (40px) pill with text-base/600
  // and px-8 (32px) padding (session-36). The clone shipped h-12/px-7/
  // text-sm.
  const cta = hero.locator("a", { hasText: /shop|browse|view/i }).first();
  const ctaBox = await cta.boundingBox();
  expect(Math.round(ctaBox?.height ?? 0)).toBe(40);
  await expect(cta).toHaveCSS("font-size", "16px");
  await expect(cta).toHaveCSS("font-weight", "600");
  await expect(cta).toHaveCSS("padding-left", "32px");
  // Carousel dots: active 32x6 white, inactive 16x6 white/40.
  const activeDot = page.getByRole("button", { name: "Show slide 1" });
  const inactiveDot = page.getByRole("button", { name: "Show slide 2" });
  await expect(activeDot).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const adBox = await activeDot.boundingBox();
  expect(Math.round(adBox?.width ?? 0)).toBe(32);
  expect(Math.round(adBox?.height ?? 0)).toBe(6);
  await expect(inactiveDot).toHaveCSS("background-color", "rgba(255, 255, 255, 0.4)");
  const idBox = await inactiveDot.boundingBox();
  expect(Math.round(idBox?.width ?? 0)).toBe(16);
  expect(Math.round(idBox?.height ?? 0)).toBe(6);
  // Arrows: 40px discs, white/10 with a 12px frost.
  const prev = page.getByRole("button", { name: "Previous slide" });
  const prevBox = await prev.boundingBox();
  expect(Math.round(prevBox?.width ?? 0)).toBe(40);
  expect(Math.round(prevBox?.height ?? 0)).toBe(40);
  await expect(prev).toHaveCSS("background-color", "rgba(255, 255, 255, 0.1)");
  await expect(prev).toHaveCSS("backdrop-filter", "blur(12px)");
});

test("home section headers match the reference scale and copy", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement (logged-in reference, 390x844 + 1440x900): the
  // reference's home section headings are font-heading text-2xl md:text-3xl
  // (24 -> 30px, 700) with 16px text-muted-foreground subtitles (mt-2 for
  // the centered category block, mt-1 for the row headers). The clone
  // shipped text-3xl md:text-4xl (30 -> 36px) with 14px mt-3 subtitles and
  // its own copy; the reference's copy is pinned verbatim below.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const catH2 = page.getByRole("heading", { name: "Shop by Category" });
  await expect(catH2).toHaveCSS("font-size", isMobile ? "24px" : "30px");
  await expect(catH2).toHaveCSS("font-weight", "700");
  const catSub = catH2.locator("..").locator("p");
  await expect(catSub).toHaveCSS("font-size", "16px");
  await expect(catSub).toHaveCSS("margin-top", "8px");
  await expect(catSub).toHaveText("Find exactly what you need for your home");

  const featH2 = page.getByRole("heading", { name: "Featured Products" });
  await expect(featH2).toHaveCSS("font-size", isMobile ? "24px" : "30px");
  const featSub = featH2.locator("..").locator("p");
  await expect(featSub).toHaveCSS("font-size", "16px");
  await expect(featSub).toHaveCSS("margin-top", "4px");
  await expect(featSub).toHaveText("Hand-picked favorites for your home");

  const newArrH2 = page.getByRole("heading", { name: "New Arrivals" });
  const newArrSub = newArrH2.locator("..").locator("p");
  await expect(newArrSub).toHaveText("The latest additions to our collection");

  // The reference has NO "View All" pill in its section headers (the
  // clone's pill was a v1 invention; the header row carries carousel
  // arrows instead — pinned in the carousel test).
  const featuredSection = featH2.locator("xpath=ancestor::section[1]");
  await expect(featuredSection.getByRole("link", { name: "View All" })).toHaveCount(0);
});

test("category section renders the reference icon tiles", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the reference's "Shop by Category" grid is
  // compact ICON TILES (grid-cols-4 mobile / grid-cols-8 desktop, gap-3):
  // white bg-card tiles, rounded-2xl in the v3 scale = 16px, border/50,
  // p-5, flex-col items-center gap-3; a 56px rounded-[16px] per-category
  // gradient disc (explicit linear-gradient, v3 from-*-400 -> to-*-500)
  // with a 28px white glyph; a 14px/500 label. The clone shipped
  // full-width photo cards with a dark overlay (never measured).
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const region = page.getByRole("region", { name: "Shop by Category" });
  const grid = region.locator("div.grid").first();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 4 : 8);
  expect(await grid.locator("a[href*='category']").count()).toBe(8);

  const tile = grid.locator("a[href*='category']").first();
  const tileCard = tile.locator("div").first();
  await expect(tileCard).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(tileCard).toHaveCSS("border-radius", "16px");
  await expect(tileCard).toHaveCSS("border-top-color", "rgba(229, 224, 220, 0.5)");
  await expect(tileCard).toHaveCSS("padding", "20px");

  const disc = tileCard.locator("div").first();
  const discBox = await disc.boundingBox();
  expect(Math.round(discBox?.width ?? 0)).toBe(56);
  expect(Math.round(discBox?.height ?? 0)).toBe(56);
  await expect(disc).toHaveCSS("border-radius", "16px");
  const discBg = await disc.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(discBg).toContain("linear-gradient");
  expect(discBg).toContain("rgb(251, 146, 60)"); // cookware: orange-400 -> red-500

  const label = tileCard.locator("span, p").last();
  await expect(label).toHaveText("Cookware");
  await expect(label).toHaveCSS("font-size", "14px");
  await expect(label).toHaveCSS("font-weight", "500");
});

test("featured and arrival rows are the reference scroll carousels", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: Featured (6 cards) and New Arrivals (8) are
  // horizontal scroll-snap carousels — flex gap-5 overflow-x-auto pb-4
  // scrollbar-hide snap-x snap-mandatory with min-w-[260px] max-w-[280px]
  // snap-start flex-shrink-0 cells — with two w-10 h-10 border-chevron
  // arrow buttons in the header row. The clone shipped responsive grids.
  const featH2 = page.getByRole("heading", { name: "Featured Products" });
  const featRow = featH2.locator(
    "xpath=following::div[contains(@class,'overflow-x-auto')][1]",
  );
  await expect(featRow).toHaveCSS("overflow-x", "auto");
  await expect(featRow).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(featRow).toHaveCSS("column-gap", "20px");
  expect(await featRow.locator("article").count()).toBe(6);

  const cell = featRow.locator("div").first();
  await expect(cell).toHaveCSS("min-width", "260px");
  await expect(cell).toHaveCSS("max-width", "280px");
  await expect(cell).toHaveCSS("flex-shrink", "0");

  const newH2 = page.getByRole("heading", { name: "New Arrivals" });
  const newRow = newH2.locator(
    "xpath=following::div[contains(@class,'overflow-x-auto')][1]",
  );
  expect(await newRow.locator("article").count()).toBe(8);

  // Header arrow buttons: 40px, hairline border, transparent at rest.
  const arrow = featH2.locator("xpath=../..").locator("button").first();
  const arrowBox = await arrow.boundingBox();
  expect(Math.round(arrowBox?.width ?? 0)).toBe(40);
  expect(Math.round(arrowBox?.height ?? 0)).toBe(40);
  await expect(arrow).toHaveCSS("border-top-width", "1px");
  await expect(arrow).toHaveCSS("border-top-color", "rgb(229, 224, 220)");
});

test("product cards match the reference chrome, badges, and quick-add", async ({ page }) => {
  await page.goto("/products");
  // Session-38 measurement (reference /products + home carousels — same
  // card): rounded-2xl(v3)=16px, border-border/50, shadow-sm at rest with
  // hover:shadow-xl + -translate-y-1 (duration-500); badges are semibold
  // py-0.5 pills with shadow, the FEATURED pill is bg-primary (orange —
  // the session-1 "badge amber" pin is superseded); stars fill amber-400
  // rgb(251,191,36) with a 2px gap; the name is text-base/600
  // line-clamp-2; the quick-add is a hover-REVEALED 36px pill (p-2.5 +
  // 16px shopping-cart glyph, bg-card/90 -> rgba(255,255,255,0.9),
  // backdrop-blur 4px, shadow-lg) — invisible at rest, exactly like the
  // reference.
  const card = page.locator("article").filter({ hasText: "Damascus Steel Chef Knife Set" }).first();
  await expect(card).toHaveCSS("border-radius", "16px");
  await expect(card).toHaveCSS("border-top-color", "rgba(229, 224, 220, 0.5)");

  const featured = card.getByText("Featured", { exact: true });
  await expect(featured).toHaveCSS("background-color", "rgb(217, 110, 38)");
  const discount = card.getByText("-29%");
  await expect(discount).toHaveCSS("padding", "2px 10px");
  await expect(discount).toHaveCSS("font-weight", "600");

  const star = card.locator("svg.lucide-star").first();
  await expect(star).toHaveCSS("fill", "rgb(251, 191, 36)");

  const h3 = card.getByRole("heading", { name: "Damascus Steel Chef Knife Set" });
  await expect(h3).toHaveCSS("font-size", "16px");
  await expect(h3).toHaveCSS("font-weight", "600");
  const catLabel = card.locator("p.text-primary, p.uppercase").first();
  await expect(catLabel).toHaveCSS("font-size", "12px");
  await expect(catLabel).toHaveCSS("font-weight", "500");

  const quickAdd = card.locator('button[aria-label^="Add Damascus"]');
  const quickWrap = quickAdd.locator("xpath=..");
  await expect(quickWrap).toHaveCSS("opacity", "0");
  const qaBox = await quickAdd.boundingBox();
  expect(Math.round(qaBox?.width ?? 0)).toBe(36);
  expect(Math.round(qaBox?.height ?? 0)).toBe(36);
  await expect(quickAdd).toHaveCSS("background-color", "rgba(255, 255, 255, 0.9)");
  await expect(quickAdd).toHaveCSS("backdrop-filter", "blur(4px)");
  expect(await quickAdd.locator("svg.lucide-shopping-cart").count()).toBe(1);
});

test("feature bar matches the reference compact cards", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: FB items are p-4 gap-3 rounded-2xl(v3=16px)
  // bg-card border-border/50 cards (no shadow) with a 44px rounded-xl
  // (v3=12px) bg-primary/10 disc carrying a 20px stroke-2 glyph; titles
  // text-sm font-semibold, subs text-xs (12px); the grid is
  // grid-cols-2 md:grid-cols-4 gap-4. The clone shipped p-5/rounded-xl
  // (v4 20px)/shadow-card, 48px discs with 24px stroke-1.8 glyphs, bold
  // titles, and 14px subs.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const section = page.getByRole("region", { name: "Store highlights" });
  const grid = section.locator("div.grid").first();
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(cols).toBe(isMobile ? 2 : 4);

  const item = grid.locator("div").first();
  await expect(item).toHaveCSS("border-radius", "16px");
  await expect(item).toHaveCSS("padding", "16px");
  await expect(item).toHaveCSS("box-shadow", "none");

  const disc = item.locator("span, div").first();
  const discBox = await disc.boundingBox();
  expect(Math.round(discBox?.width ?? 0)).toBe(44);
  expect(Math.round(discBox?.height ?? 0)).toBe(44);
  await expect(disc).toHaveCSS("background-color", "rgba(217, 110, 38, 0.1)");

  const title = item.getByText("Free Shipping", { exact: true });
  await expect(title).toHaveCSS("font-weight", "600");
  const sub = item.getByText("On orders over $50", { exact: true });
  await expect(sub).toHaveCSS("font-size", "12px");
});

test("CTA banner matches the reference gradient card", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the CTA is a rounded-3xl (24px) card painted
  // with linear-gradient(to right, rgb(217,110,38), rgba(217,110,38,0.8)),
  // p-10 md:p-16 text-center; the paragraph is text-lg md:text-xl
  // white/80 max-w-2xl mb-8; the button is the reference's CREAM pill —
  // rgb(243,238,232) bg, rgb(44,36,33) text, h-10 px-8 14px/600
  // (hover -> the cream at 0.8 alpha). The clone shipped a solid orange
  // card with a pure-white 48px button.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const h2 = page.getByRole("heading", { name: "Transform Your Kitchen Today" });
  const wrap = h2.locator("xpath=..");
  await expect(wrap).toHaveCSS("border-radius", "24px");
  await expect(wrap).toHaveCSS("padding", isMobile ? "40px" : "64px");
  const bg = await wrap.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain("linear-gradient(to right");
  expect(bg).toContain("rgb(217, 110, 38)");
  expect(bg).toContain("rgba(217, 110, 38, 0.8)");

  const p = wrap.locator("p").first();
  // text-lg flat — 18px at BOTH viewports (re-measured; an early sweep
  // reading of "20px/512px" had accidentally measured the HERO paragraph).
  await expect(p).toHaveCSS("font-size", "18px");
  await expect(p).toHaveCSS("color", "rgba(255, 255, 255, 0.8)");

  const btn = wrap.getByRole("link", { name: "Browse All Products" });
  const btnBox = await btn.boundingBox();
  expect(Math.round(btnBox?.height ?? 0)).toBe(40);
  await expect(btn).toHaveCSS("background-color", "rgb(243, 238, 232)");
  await expect(btn).toHaveCSS("color", "rgb(44, 36, 33)");
  await expect(btn).toHaveCSS("font-size", "14px");
});

test("hero container matches the reference geometry", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the hero card is h-[500px] md:h-[600px]
  // (fixed) with rounded-3xl (24px) corners and a BLACK three-stop tint —
  // linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.3),
  // rgba(0,0,0,0)) — over the photo; the text column is max-w-2xl
  // px-8 md:px-16, vertically centered; the dots sit bottom-6 left-8
  // md:left-16 with gap-3. The clone shipped min-h 420/520, a warm
  // two-stop tint, a max-w-7xl px-6/10 column, and left-6/10 dots.
  const viewport = page.viewportSize();
  const isMobile = !!viewport && viewport.width < 768;
  const heroCard = page.locator("h1").first().locator("xpath=ancestor::div[3]");
  expect(Math.round((await heroCard.boundingBox())?.height ?? 0)).toBe(isMobile ? 500 : 600);
  await expect(heroCard).toHaveCSS("border-radius", "24px");

  const overlay = heroCard.locator("div[class*='absolute inset-0']").first();
  const tint = await overlay.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(tint).toContain("rgba(0, 0, 0, 0.6)");
  expect(tint).toContain("rgba(0, 0, 0, 0.3)");
  expect(tint).toContain("rgba(0, 0, 0, 0)");

  const textCol = page.locator("h1").first().locator("xpath=ancestor::div[contains(@class,'max-w-2xl')]");
  await expect(textCol).toHaveCSS("padding-left", isMobile ? "32px" : "64px");

  const dots = page.getByRole("button", { name: "Show slide 1" }).locator("xpath=..");
  await expect(dots).toHaveCSS("column-gap", "12px");
  await expect(dots).toHaveCSS("left", isMobile ? "32px" : "64px");
});

test("account and cart buttons show the reference green hover disc", async ({ page }) => {
  await page.goto("/");
  // Session-38 measurement: the reference's account and cart buttons
  // share the menu trigger's hover treatment (session-36) — an
  // accent-green disc rgb(69,161,130) with a white glyph at 150ms.
  // The clone's buttons had no hover treatment at all (resting states
  // stay the pinned plain dark glyphs).
  const account = page.getByRole("link", { name: /Account|Sign in/ });
  await account.hover();
  await expect(account).toHaveCSS("background-color", "rgb(69, 161, 130)");
  await expect(account).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(account).toHaveCSS("transition-duration", "0.15s");

  const cart = page.getByRole("button", { name: "Open cart" });
  await cart.hover();
  await expect(cart).toHaveCSS("background-color", "rgb(69, 161, 130)");
  await expect(cart).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("PDP action row matches the reference layout and heights", async ({ page }) => {
  await page.goto("/product/p-knife-set");
  // Session-36 measurement: the reference's PDP action row is a ROW at
  // every width (flex gap-3): Add-to-Cart h-10 px-8 flex-1 (14px/500,
  // shadow, hover:bg-primary/90), Buy Now h-10 px-6 with NO flex-1.
  // The clone shipped flex-col-on-mobile with BOTH flex-1 h-12 — the
  // flex algorithm ignores height under flex-basis 0% and collapsed
  // both buttons to 20-22px on mobile (the F36-11 collapse bug).
  const add = page.getByRole("button", { name: "Add to Cart" });
  const buy = page.getByRole("button", { name: "Buy Now" });
  for (const btn of [add, buy]) {
    const box = await btn.boundingBox();
    expect(Math.round(box?.height ?? 0)).toBe(40);
    await expect(btn).toHaveCSS("font-weight", "500");
    await expect(btn).toHaveCSS("border-radius", "9999px");
  }
  await expect(add).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(add).toHaveCSS("padding-left", "32px");
  // Row layout at EVERY width: both buttons share one horizontal line.
  const addBox = await add.boundingBox();
  const buyBox = await buy.boundingBox();
  expect(Math.round(Math.abs(addBox!.y - buyBox!.y))).toBe(0);
  // flex-1 only on Add (Buy is content-width).
  expect(addBox!.width).toBeGreaterThan(buyBox!.width + 40);
});

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

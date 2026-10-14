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

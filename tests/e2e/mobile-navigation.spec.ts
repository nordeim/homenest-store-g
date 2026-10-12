import { expect, test } from "@playwright/test";

/**
 * Mobile navigation — the parity-critical surface.
 *
 * Reference behavior (measured live 2026-10-12 on nest-culinary-hub.base44.app
 * at 390x844): the TRAILING-EDGE hamburger (right of the cart icon) toggles an
 * INLINE dropdown panel below the header (not a side drawer). The active route
 * renders as an orange pill row, body scroll locks while open, Escape closes,
 * navigating closes the menu, and the page below stays UNDIMMED (matching the
 * current reference; session-3 measurement).
 *
 * Session-5 re-measurement (same reference, same day): the trigger no longer
 * swaps to the session-3 green disc — BOTH states render a bare dark icon
 * (transparent button, foreground-colored glyph, no inner span). The clone
 * follows the latest measurement, per the follow-the-latest-measurement
 * doctrine (remediation plan §10.5.2).
 *
 * Session-4 re-measurement (same reference, same day): the panel is a
 * translucent white/80 surface with NO drop shadow; menu rows render at
 * 14px/500 with muted-foreground inactive text and a 12px radius on the
 * active row (NOT a full pill); and the menu's search control is a compact
 * muted icon pill at rest — not an expanded input. The reference's search
 * pill is functionally inert (and even unclickable: its own toast viewport
 * covers it); the clone expands it into a working search input on tap, a
 * registered functional superset (PAD §5.6).
 *
 * Touch-target note: the reference pill measures 40x28; the clone ships a
 * 40x40 disc to honor the repo's documented large-touch-target posture
 * (README a11y features) — width parity kept, height deliberately larger.
 *
 * Implementation note: the menu is portaled to <body>. Tailwind v4's
 * backdrop-filter on the sticky header creates a containing block for fixed
 * descendants, so the drawer must NOT live inside the header DOM.
 */

test.use({ viewport: { width: 390, height: 844 } });

test("hamburger opens the dropdown panel with search pill and links", async ({ page }) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open menu" });
  await expect(open).toBeVisible();
  await open.click();

  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  // Resting state: the compact muted search pill — the expanded input only
  // appears after tapping the pill (reference resting visual).
  await expect(nav.getByRole("button", { name: "Search products" })).toBeVisible();
  await expect(nav.getByPlaceholder("Search products...")).toHaveCount(0);
  for (const label of ["Home", "Products", "Track Order", "About", "Contact"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("menu resting visuals match the session-4 reference measurement", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });

  // Panel: translucent white, NO drop shadow, 1px bottom border.
  await expect(nav).toHaveCSS("background-color", "rgba(255, 255, 255, 0.8)");
  await expect(nav).toHaveCSS("box-shadow", "none");
  await expect(nav).toHaveCSS("border-bottom-width", "1px");

  // Search pill: muted disc, fully rounded, 40px wide.
  const pill = nav.getByRole("button", { name: "Search products" });
  await expect(pill).toHaveCSS("background-color", "rgb(242, 240, 237)");
  await expect(pill).toHaveCSS("border-radius", "9999px");
  const box = await pill.boundingBox();
  expect(Math.round(box?.width ?? 0)).toBe(40);

  // Rows: 14px/500, muted inactive text, 12px active-row radius.
  const active = nav.getByRole("link", { name: "Home", exact: true });
  await expect(active).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(active).toHaveCSS("border-radius", "12px");
  await expect(active).toHaveCSS("font-size", "14px");
  const inactive = nav.getByRole("link", { name: "About", exact: true });
  await expect(inactive).toHaveCSS("color", "rgb(126, 111, 103)");
  await expect(inactive).toHaveCSS("font-size", "14px");
});

test("tapping the search pill expands the input and focuses it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await nav.getByRole("button", { name: "Search products" }).click();
  const input = nav.getByPlaceholder("Search products...");
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await expect(nav.getByRole("button", { name: "Search products" })).toHaveCount(0);
});

test("expanded search collapses after the menu closes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await nav.getByRole("button", { name: "Search products" }).click();
  await expect(nav.getByPlaceholder("Search products...")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" }).getByRole("button", { name: "Search products" })).toBeVisible();
});

test("active route renders as the orange pill row", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  const activeLink = nav.getByRole("link", { name: "About", exact: true });
  await expect(activeLink).toBeVisible();
  await expect(activeLink).toHaveCSS("background-color", "rgb(217, 110, 38)");
  await expect(activeLink).toHaveAttribute("aria-current", "page");
});

test("menu trigger renders a bare dark icon in both states (no colored disc)", async ({ page }) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open menu" });
  // Closed state: transparent button, foreground glyph, no inner span disc.
  await expect(open).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(open.locator("span")).toHaveCount(0);
  await open.click();
  const close = page.getByRole("button", { name: "Close menu", exact: true });
  await expect(close).toBeVisible();
  // Open state: SAME treatment — the reference dropped its green disc in the
  // session-5 re-measurement; the X renders directly in the trigger.
  await expect(close).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(close.locator("span")).toHaveCount(0);
  await expect(close).toHaveCSS("color", "rgb(29, 24, 22)");
});

test("body scroll locks while the menu is open and unlocks after navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await nav.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("overflow", "visible");
});

test("menu closes on navigation and the trigger resets to the hamburger", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveCount(0);
});

test("Escape closes the menu without navigating", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("hamburger is hidden on desktop widths and the primary nav shows", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test("menu search submits to the products page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await nav.getByRole("button", { name: "Search products" }).click();
  const input = nav.getByPlaceholder("Search products...");
  await input.fill("knife");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/products\?search=knife/);
  await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
});

test("open menu is announced as a modal dialog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialog).toBeVisible();
  // The inner nav keeps its landmark role and accessible name (E2E contract).
  await expect(dialog.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await page.getByRole("button", { name: "Close menu", exact: true }).click();
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
});

test("focus moves into the menu on open and Tab cycles within it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  // Initial focus lands on the first focusable (the collapsed search pill).
  const panel = page.locator("#mobile-nav-holder");
  const pill = panel.getByRole("button", { name: "Search products" });
  await expect(pill).toBeFocused();

  // Tab past every focusable in the panel (pill + 6 links = 7 focusables):
  // the full cycle wraps back onto the pill — focus must never reach the
  // background page.
  for (let i = 0; i < 7; i += 1) await page.keyboard.press("Tab");
  await expect(pill).toBeFocused();
  expect(panel.locator("a[href]")).not.toHaveCount(0);

  // Shift+Tab from the first focusable wraps to the last link.
  await page.keyboard.press("Shift+Tab");
  await expect(panel.getByRole("link", { name: "Sign in" })).toBeFocused();
});

test("closing the menu restores focus to the trigger", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
});

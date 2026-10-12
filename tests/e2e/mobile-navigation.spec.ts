import { expect, test } from "@playwright/test";

/**
 * Mobile navigation — the parity-critical surface.
 *
 * Reference behavior (measured live 2026-10-12 on nest-culinary-hub.base44.app
 * at 390x844): the hamburger toggles an INLINE dropdown panel below the header
 * (not a side drawer). The trigger swaps to a green circle with a white X, the
 * active route renders as an orange pill row, the page below is dimmed, body
 * scroll locks while open, Escape closes, and navigating closes the menu.
 *
 * Implementation note: the menu is portaled to <body>. Tailwind v4's
 * backdrop-filter on the sticky header creates a containing block for fixed
 * descendants, so the drawer must NOT live inside the header DOM.
 */

test.use({ viewport: { width: 390, height: 844 } });

test("hamburger opens the dropdown panel with search and links", async ({ page }) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open menu" });
  await expect(open).toBeVisible();
  await open.click();

  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await expect(nav.getByPlaceholder("Search products...")).toBeVisible();
  for (const label of ["Home", "Products", "Track Order", "About", "Contact"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
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

test("hamburger swaps to the green close circle while open", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const close = page.getByRole("button", { name: "Close menu", exact: true });
  await expect(close).toBeVisible();
  // The green disc lives on the inner span (button itself is transparent).
  await expect(close.locator("span").first()).toHaveCSS("background-color", "rgb(69, 161, 130)");
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
  await nav.getByPlaceholder("Search products...").fill("knife");
  await nav.getByPlaceholder("Search products...").press("Enter");
  await expect(page).toHaveURL(/\/products\?search=knife/);
  await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
});

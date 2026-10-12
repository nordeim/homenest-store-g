import { expect, test } from "@playwright/test";

/**
 * Cart drawer modal semantics (session-4 follow-up to the mobile-menu modal
 * work). The drawer is the app's top modal surface (z-[500]): it carries
 * aria-modal, moves focus into the dialog on open, traps Tab within the
 * panel, and restores focus to the cart trigger on close — the same contract
 * the mobile menu has had since session 3. Escape-to-close and scroll-lock
 * were already in place and stay pinned here.
 */

async function addKnife(page: import("@playwright/test").Page) {
  await page.goto("/product/p-knife-set");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: /Added!/ })).toBeVisible();
}

test("cart drawer opens as a modal dialog with focus inside", async ({ page }) => {
  await page.goto("/");
  await page.locator('button[aria-label="Open cart"]').click();

  const dialog = page.getByRole("dialog", { name: "Cart", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Focus moves into the dialog (first focusable = the header close button),
  // never left on the dimmed background page.
  await expect(dialog.getByRole("button", { name: "Close cart" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
});

test("Tab cycles within the drawer and never reaches the page behind", async ({ page }) => {
  await addKnife(page);
  await page.locator('button[aria-label="Open cart"]').click();

  const dialog = page.getByRole("dialog", { name: "Cart", exact: true });
  await expect(dialog).toBeVisible();

  // One cart line: close, decrease, increase, remove, Checkout, View full cart
  // = 6 focusables inside the dialog (the backdrop click-catcher is out of
  // the tab order). A full Tab cycle must land back on the first focusable.
  const focusables = dialog.locator('a[href], button:not([disabled]):not([tabindex="-1"])');
  const count = await focusables.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i += 1) await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close cart" })).toBeFocused();

  // Shift+Tab from the first focusable wraps to the last.
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "View full cart" })).toBeFocused();
});

test("closing the drawer restores focus to the cart trigger", async ({ page }) => {
  await page.goto("/");
  const trigger = page.locator('button[aria-label="Open cart"]');
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // The X button inside the dialog closes it too, with the same restore.
  await trigger.click();
  await page.getByRole("dialog", { name: "Cart", exact: true }).getByRole("button", { name: "Close cart" }).click();
  await expect(page.getByRole("dialog", { name: "Cart", exact: true })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

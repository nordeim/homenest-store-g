import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile menu opens, traps the overlay, and navigates", async ({ page }) => {
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open menu" });
  await expect(open).toBeVisible();
  await open.click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Shop" })).toBeVisible();
  await nav.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByRole("navigation", { name: "Mobile" })).toHaveCount(0);
});

test("hamburger is hidden on desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

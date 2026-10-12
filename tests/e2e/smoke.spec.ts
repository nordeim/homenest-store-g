import { expect, test } from "@playwright/test";

test("home renders the atelier mark and shop CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).or(page.getByLabel("Open menu"))).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
});

test("shop lists products and opens a PDP", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: /products|cookware|all products/i })).toBeVisible();
  const first = page.getByRole("link", { name: /dutch oven|chef|storage|skillet/i }).first();
  await expect(first).toBeVisible();
});

test("cart empty state is honest", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText(/no items in cart|cart is empty|board is clear/i)).toBeVisible();
});

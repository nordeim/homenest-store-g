import { describe, expect, it } from "vitest";
import type { CartLine, Product } from "@/types";
import {
  cartSubtotal,
  cartTotals,
  clampQuantity,
  discountPercent,
  formatCardNumber,
  formatExpiry,
  formatMoney,
  isCardNumberValid,
  isEmail,
  isExpiryValid,
  isZip,
  mergeCartLine,
  nextOrderNumber,
  promoDiscount,
  shippingCents,
  starFloor,
  taxCents,
  trackingUrl,
  validateRedirectPath,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD,
  PROMO_MIN_SPEND,
  TAX_BPS,
} from "./commerce";
import { resolveDbPath, isLocalFileUrl } from "./db-path";

const pan: Product = {
  id: "p1",
  slug: "pan",
  name: "Pan",
  category: "cookware",
  priceCents: 3499,
  compareAtCents: 4999,
  rating: 4.8,
  reviewCount: 10,
  stock: 5,
  visible: true,
  featured: true,
  isNew: false,
  image: "/x.jpg",
  gallery: [],
  badge: null,
  materials: [],
  features: [],
  description: "",
  shippingNote: "",
};

describe("formatMoney", () => {
  it("formats cents as USD", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(999)).toBe("$9.99");
    expect(formatMoney(10000)).toBe("$100.00");
    expect(formatMoney(-50)).toBe("-$0.50");
  });
});

describe("shipping and tax", () => {
  it("waives shipping at the $50 threshold (reference parity)", () => {
    expect(shippingCents(0)).toBe(0);
    expect(shippingCents(4999)).toBe(FLAT_SHIPPING_CENTS);
    expect(shippingCents(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });

  it("adds no tax line (reference shows subtotal/shipping/total only)", () => {
    expect(TAX_BPS).toBe(0);
    expect(taxCents(10000)).toBe(0);
    expect(taxCents(0)).toBe(0);
  });
});

describe("promo", () => {
  it("applies NEST10 above the min spend", () => {
    const hit = promoDiscount(PROMO_MIN_SPEND, "nest10");
    expect(hit.appliedCode).toBe("NEST10");
    expect(hit.discountCents).toBe(400);
  });

  it("drops the code below the threshold with a notice", () => {
    const miss = promoDiscount(3999, "NEST10");
    expect(miss.discountCents).toBe(0);
    expect(miss.appliedCode).toBeNull();
    expect(miss.notice).toMatch(/NEST10/);
  });
});

describe("cart", () => {
  it("sums line merchandise", () => {
    const lines: CartLine[] = [
      { productId: "p1", quantity: 2 },
      { productId: "missing", quantity: 9 },
    ];
    expect(cartSubtotal(lines, [pan])).toBe(6998);
  });

  it("clamps quantity to stock and merges lines", () => {
    expect(clampQuantity(9, 5)).toBe(5);
    expect(clampQuantity(0, 5)).toBe(0);
    const merged = mergeCartLine([], "p1", 2, 5);
    expect(merged).toEqual([{ productId: "p1", quantity: 2 }]);
    expect(mergeCartLine(merged, "p1", 10, 5)[0]?.quantity).toBe(5);
    expect(mergeCartLine(merged, "p1", -2, 5)).toEqual([]);
  });

  it("re-derives totals with free shipping over $50", () => {
    const expensive: Product = { ...pan, priceCents: 12000 };
    const totals = cartTotals([{ productId: "p1", quantity: 1 }], [expensive], null);
    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(12000);
  });

  it("charges flat shipping under the threshold", () => {
    const totals = cartTotals([{ productId: "p1", quantity: 1 }], [pan], null);
    expect(pan.priceCents).toBe(3499);
    expect(totals.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(totals.totalCents).toBe(3499 + FLAT_SHIPPING_CENTS);
  });
});

describe("orders and validation", () => {
  it("increments ORD-YYYY-NNN", () => {
    expect(nextOrderNumber([], new Date("2026-03-01T00:00:00Z"))).toBe("ORD-2026-001");
    expect(nextOrderNumber(["ORD-2026-004"], new Date("2026-03-01T00:00:00Z"))).toBe("ORD-2026-005");
  });

  it("validates email, zip, card, expiry", () => {
    expect(isEmail("ada@homenest.kitchen")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isZip("94110")).toBe(true);
    expect(isZip("94110-1234")).toBe(true);
    expect(isZip("94")).toBe(false);
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(isCardNumberValid("4242424242424")).toBe(true);
    expect(formatExpiry("1228")).toBe("12/28");
    expect(isExpiryValid("12/28")).toBe(true);
    expect(isExpiryValid("13/28")).toBe(false);
  });

  it("builds carrier tracking URLs and rejects open redirects", () => {
    expect(trackingUrl("ups", "1Z999")).toContain("1Z999");
    expect(trackingUrl("other", "abc")).toBeNull();
    expect(validateRedirectPath("/account")).toBe("/account");
    expect(validateRedirectPath("https://evil.test")).toBe("/account");
    expect(validateRedirectPath("//evil.test")).toBe("/account");
  });

  it("floors ratings and discount percents", () => {
    expect(starFloor(4.8)).toBe(4);
    expect(discountPercent(18900, 24000)).toBe(21);
    expect(discountPercent(100, null)).toBe(0);
  });
});

describe("db path", () => {
  it("keeps the schema-relative file URL contract", () => {
    expect(resolveDbPath("file:../db/custom.db")).toBe("db/custom.db");
    expect(isLocalFileUrl("file:../db/custom.db")).toBe(true);
  });
});

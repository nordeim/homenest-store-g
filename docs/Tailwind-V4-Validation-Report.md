# Tailwind CSS v4 trap log — HomeNest Kitchen

Ported from `ecommerce-store` / ScandiHaven notes. These are the engine variances this clone is pinned against.

1. **Bare-HSL theme tokens** — `@theme` colors must be full `hsl(...)` values. Bare triplets resolve to transparent.
2. **shadow-sm scale shift** — v4 inserted `shadow-xs` at v3's `shadow-sm` geometry. `--shadow-sm` is pinned to `0 1px 2px 0 rgb(0 0 0 / 0.05)`.
3. **space-y specificity** — v4 wraps `space-y-*` in `:where()`, so a child `mt-3` wins. The mobile nav CTA is a sibling flex column with `gap-1`, not `space-y` + `mt-3`.
4. **Static class strings** — dynamic class construction is not scanned. Desktop nav is `hidden … md:flex`; hamburger is `md:hidden`; the sheet is a separate tree.
5. **hover media** — v4 wraps `hover:` in `@media (hover: hover)`. Card zoom uses `motion-safe:group-hover:scale-[1.05]`.
6. **Mobile nav** — overlay `z-[400]`, panel `z-[500]`, body scroll lock, Escape to close, 44px targets, no `space-y` on the sheet.

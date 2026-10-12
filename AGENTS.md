# AGENTS.md — HomeNest Kitchen

Production e-commerce storefront + admin console: Vite 7 · React 19 · TypeScript strict · Tailwind CSS 4 (CSS-first) · Vitest + Playwright, built to a single HTML file via `vite-plugin-singlefile`.

## Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Dev server | `npm run dev` (port 5173) |
| Production build | `npm run build` (single file: `dist/index.html`) |
| Preview production build | `npm run preview` |
| Typecheck | `npm run typecheck` (must exit 0) |
| Unit tests | `npm run test` (Vitest, node env) |
| Unit tests (watch) | `npm run test:watch` |
| Single unit test | `npx vitest run src/lib/commerce.test.ts` |
| E2E (**requires build first**) | `npm run e2e` (Playwright against `vite preview` on :4173) |
| Single E2E spec | `npx playwright test tests/e2e/cart-checkout.spec.ts` |
| Full pre-push gate | `npm run verify && npm run e2e` |

There is no ESLint config — `tsc --noEmit` with `noUnusedLocals`/`noUnusedParameters` is the lint gate. Do not add ESLint casually; if you do, wire it into `npm run verify`.

## Environment & database contract

- `.env` pins `DATABASE_URL="file:../db/custom.db"`. `db/` sits at the **repo root** and is git-ignored.
- The URL is **schema-relative** (resolves the way the Prisma CLI would: against a `prisma/` anchor), so `file:../db/custom.db` lands in `<repoRoot>/db/custom.db` regardless of CWD. The resolution rules live in `src/lib/db-path.ts` and are pinned by `tests/db-path.test.ts` — do not simplify them.
- The SPA itself never opens the SQLite file: all state lives in `localStorage` under the key `homenest.v2`. The env contract exists for tooling parity with the reference architecture and for the admin Settings surface.

## Architecture rules

1. **Dependencies point downward only** — `pages/ → components/ → lib/ → data/`. `lib/` must not import from `pages/` or `components/`. There is no backend; `lib/store.tsx` is the single state seam.
2. **One `StoreProvider`** (`src/lib/store.tsx`) owns products, cart, wishlist, orders, users, promo, toasts, overlay flags. Mutations flow through its callbacks only. Persisted state re-hydrates from localStorage in a mount effect; the `ready` flag exists so role/session gates don't fire early.
3. **Gate on `ready` before navigating away.** `AdminFrame` and `AccountPage` wait for `ready` before redirecting unauthenticated visitors. On a hard refresh the session hydrates after mount — navigating on first render kicks logged-in users out (this was a real bug; don't reintroduce it).
4. **Router is a custom history-API router** (`src/lib/router.tsx`). Route matching is centralized in `matchPath`; new routes need (a) a `matchPath` entry, (b) an `App.tsx` switch case, (c) guards if privileged. Product pages respond to BOTH `/product/:id` (reference URL shape) and `/products/:slug` (slug deep links).
5. **Money is integer cents everywhere.** Formatting happens at display time via `formatMoney`. Shipping/tax/promo math lives in `lib/commerce.ts` and is unit-pinned.
6. **Totals are always re-derived, never trusted from a caller.** `cartTotals(lines, products, code)` is the single source of truth for subtotal → discount → shipping → total.
7. **Cart mutations are delta-based with stock clamps** (`mergeCartLine`, `clampQuantity`) — no absolute-quantity writes, so rapid stepper clicks cannot lose updates.
8. **Deliberate divergences from the reference site are registered** in `Project_Architecture_Document.md` §5.6. Do not "fix" them: promo codes (collapsed in cart), card payment option (second radio), wishlist, admin console, delivery-window estimates, chat FAB → `/contact`, 24-product catalog.

## Tailwind v4 trap log (violations here silently break visual parity)

All tokens live in `src/index.css` under `@theme`. Measured against the reference site (nest-culinary-hub.base44.app) on 2026-10-12.

1. Theme colors are full `hsl(...)` literals — bare `H S% L%` triplets resolve transparent.
2. `--shadow-sm` is pinned to v3 geometry; v4 shifted the scale one notch.
3. Hero/category overlays use explicit `linear-gradient(...)`, not `bg-gradient-to-*` (v4 interpolates in oklab).
4. `space-y-*` is inert on inline first children in v4 (`:where()` specificity) — use explicit `mt-*` on block inputs.
5. **`backdrop-filter` creates a containing block for `position: fixed` descendants.** The sticky header uses `backdrop-blur-sm`, so the mobile menu MUST be portaled to `<body>` (`createPortal` in `Header`). Nesting a fixed drawer inside the header confines it to the header box — the original v1 bug.
6. v4 renames blur/rounded/shadow scales (`blur-sm` is 8px, not v3's 4px). When porting reference values, measure computed styles, do not eyeball.
7. The mobile project in Playwright pins `browserName: "chromium"` on the iPhone 14 profile — WebKit needs host libs most CI images lack.

Parity pins (asserted by `tests/e2e/visual-parity.spec.ts`, computed values from the production build): body `rgb(251,250,249)`, primary `rgb(217,110,38)`, footer `rgb(32,27,24)`, destructive pill `rgb(220,40,40)`, badge `rgb(245,159,10)`, accent `rgb(69,161,130)`, headings Playfair Display 700.

## Testing quirks

- **Two-layer split.** Vitest matches `*.test.ts` only (node env, `src/**` + `tests/**` co-located seams); Playwright matches `tests/e2e/*.spec.ts`. No double pickup.
- **E2E runs against the production build.** `npm run build` before `npm run e2e`; the config boots `vite preview` on :4173 (`--strictPort`) and reuses an already-running server locally.
- **Each test gets a fresh browser context**, i.e. fresh localStorage — tests never share cart/session state. Login through the real UI per test (no rate limiter exists, so per-test logins are fine here).
- **`getByRole` name matching is substring by default.** "Close menu" also matches "Close menu overlay" — use `{ exact: true }` (this bit the mobile-nav spec once).
- **Never click a disabled control** (quantity minus at qty=1) — assert `toBeDisabled()` instead; Playwright waits for enabled state and times out otherwise.
- **Strict-mode text collisions**: "Total" matches "Subtotal"; "Confirmed" matches "Your order has been confirmed". Use `{ exact: true }` or role-scoped locators.
- **Computed styles are the parity gate, not screenshots.** Colors above are asserted with `toHaveCSS`. When you change a token, re-measure and update the spec in the same commit.
- The green mobile-menu close disc is `bg-accent` on an inner `<span>`; the button itself is transparent.

## Conventions

- TypeScript strict; no `any` (`unknown` at boundaries); no `ts-ignore`. Unused locals/params are compile errors — prune imports.
- Components: named-function exports, one domain per file (`chrome.tsx` = shared chrome, `product.tsx` = card primitives). Pages are kebab-cased files with PascalCase exports.
- Assets live in `public/images/` and are referenced by absolute path (`/images/...`). Product images are PNG; the catalog in `src/data/catalog.ts` is the seed (reference-parity products keep exact names/prices/ratings).
- **Versioned storage key**: bump `STORAGE_KEY` (`homenest.v2`) whenever `PersistedState` shape or the seed catalog changes — stale client data otherwise shadows the new catalog (this bit the redesign).
- Conventional Commits; docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, `Project_Architecture_Document.md`) are updated in the same commit as the change they describe.
- Never commit: `.env`, `db/*.db`, `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `tests/e2e/.auth/`.
- The trap log above grows (documented) instead of being worked around.

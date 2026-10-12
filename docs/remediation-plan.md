# HomeNest Store G — Codebase Audit & Remediation Plan

> **Status:** EXECUTED & VALIDATED (100% of remediation items complete)
> **Session:** 1 (see `docs/session_1.md` for the full execution transcript)
> **Reference site:** https://nest-culinary-hub.base44.app/ (visual + functional parity target)
> **Tech-stack pattern source:** https://github.com/nordeim/ecommerce-store.git (AGENTS.md / CLAUDE.md / PAD / SKILL.md)
> **Verification gate at time of writing:** typecheck ✓ · 22/22 unit ✓ · build ✓ · 82/82 E2E ✓

---

## 1. Executive Summary

This plan records the systematic audit of the `homenest-store-g` codebase, the
severity-classified findings, the remediation ToDo list, and the TDD validation
evidence for every fix. The remediation had three simultaneous goals:

1. **Correctness** — fix real bugs (the Tailwind v4 mobile-nav containing-block
   trap, a hydration race, a stale-localStorage shadowing hazard, a
   non-functional DB-path "contract").
2. **Parity** — redesign every surface to computed-style parity with the
   reference site while keeping the clone a functional *superset* (24-product
   catalog, promo codes, card payment, wishlist, admin console, delivery
   windows).
3. **Production readiness** — a two-layer test architecture (Vitest unit +
   Playwright E2E across desktop and mobile projects), a schema-relative
   `DATABASE_URL` contract, doc suite, and reproducible verification gates.

The plan was validated against the codebase **before** execution and re-checked
**after** execution; every item below carries its validation evidence.

---

## 2. Methodology & Skills Used

| Phase | Skill(s) used (from `skills/skills-catalog.md`) | Purpose |
|---|---|---|
| Audit | `code-review-and-audit`, operating prompt Mode C | Severity-classified findings, evidence-based claims |
| Parity exploration | `agent-browser` | Live reference-site capture (desktop 1440×900 + mobile 390×844), logged in, exercised all 12+ surfaces, extracted computed styles |
| Tailwind v4 traps | `avant-garde-design-v4` (mobile-nav debugging + Tailwind v4 deep dive), `tailwind-patterns` | Identified `backdrop-filter` containing-block trap; portal-based fix |
| Stack patterns | `react19-ts6-vite8-tailwindv4-mvp` | React 19 + TS 5.9 + Vite 7 + Tailwind 4 conventions |
| Test architecture | `webapp-testing`, ecommerce-store `AGENTS.md` test chapters | Vitest + Playwright two-layer suite, webServer orchestration |
| Verification | repo scripts (`npm run verify`, `npm run e2e`) | Reproducible quality gate |

Audit scope: all `src/**`, `tests/**`, configs, `package.json`, `.env*`,
`db/`. The vendored `skills/` folder is **excluded** from code checking,
testing, and compilation (only read as reference material).

---

## 3. Findings Register (Audit Output)

Severity scale: **HIGH** = broken user-visible behavior or contract;
**MEDIUM** = wrong tooling/config/contract that will bite in CI or prod;
**LOW** = demo-grade limitation, documented rather than re-architected;
**INFO** = verified-good behavior worth pinning.

| ID | Sev | Area | Finding (evidence) |
|---|---|---|---|
| F-01 | HIGH | Mobile nav | `<header class="sticky … backdrop-blur-sm">` contains the mobile drawer (`fixed inset-y-0 left-0 z-[500]`) + overlay (`fixed inset-0 z-[400]`). Per CSS spec, `backdrop-filter` makes the header the **containing block for `position: fixed` descendants**, so the "fixed" drawer is confined to the 64–72 px header box → mobile menu visually broken. Matches the known Tailwind v4 pitfall documented in `skills/avant-garde-design-v4`. |
| F-02 | MEDIUM | package.json | `vitest` + `@playwright/test` listed in `dependencies` (should be `devDependencies`); missing scripts: `test`, `test:watch`, `e2e`, `typecheck`, `verify`. |
| F-03 | MEDIUM | Env/DB | No `.env`; required contract `DATABASE_URL="file:../db/custom.db"` with `db/` at repo root (`db/catalog.json` already declares this URL). |
| F-04 | MEDIUM | DB path | `src/lib/db-path.ts` merely strips the `file:` prefix — it does **not** resolve a Prisma-style schema-relative URL, so the documented contract was not actually honored. |
| F-05 | MEDIUM | Vite | Dev-server dependency scanner crashes on the vendored `skills/` tree (265 folders of HTML with bare imports). No `optimizeDeps.entries` pin. |
| F-06 | MEDIUM | Playwright | `playwright.config.ts` had no `webServer`/orchestration; E2E expected a server on `127.0.0.1:4173` that nothing started. |
| F-07 | MEDIUM | Vitest | `vitest.config.ts` used bare `__dirname` (undefined in ESM). |
| F-08 | MEDIUM | State | Stale-persistence hazard: persisted `products` array in `localStorage` under a version-less key would shadow a re-seeded catalog after schema changes (observed live: "24 products found" vs stale old catalog). |
| F-09 | MEDIUM | Auth flow | Hydration race: `AdminFrame`/`AccountPage` gated on store state before persisted session rehydration completed → hard refresh of `/admin` kicked logged-in users to `/login`. Caught by E2E `auth-admin` specs. |
| F-10 | LOW | Security | Passwords stored plaintext in `localStorage` (client-only demo store). Documented as known limitation in PAD §Security. |
| F-11 | LOW | Security | Guest order token `guestToken` uses `Math.random` (~59 bits), not `crypto`. Documented. |
| F-12 | LOW | Domain logic | `isExpiryValid` hardcoded `year >= 26`. |
| F-13 | LOW | A11y | Mobile nav lacked focus trap / `aria-modal`; nav `aria-label="Mobile"` (kept — E2E depends on the accessible name). |
| F-14 | INFO | Auth | Guards verified good: `AdminFrame` gates on role; login honors `validateRedirectPath` (open-redirect fallthrough covered by E2E). |
| F-15 | INFO | Commerce | Money math is integer-cents based and unit-pinned in `src/lib/commerce.test.ts`. |
| F-16 | INFO | Design tokens | Tailwind v4 tokens pinned in `index.css` `@theme` with hsl() literals + `shadow-sm` pin, following the reference trap log. |
| F-17 | HIGH | Parity | Whole-surface visual gap vs reference ("atelier" linen/espresso theme, side-drawer mobile nav, 6 categories, card-payment 3-step checkout, tax line, $100 free-ship threshold, announcement bar) vs reference (HomeNest orange/cream, inline mobile dropdown, 8 categories, COD single-page checkout, no tax line, $50 threshold). |

---

## 4. Remediation ToDo List (executed; TDD where applicable)

Legend: ☐ = open at plan time → ✅ = done with evidence. Each item lists the
TDD hook that pins the fix so regressions cannot silently return.

### 4.1 Correctness fixes

- ✅ **R-01 (fixes F-01) — Portal the mobile nav out of the blurred header.**
  Render the mobile menu panel + page-dim overlay via
  `createPortal(document.body)` at `fixed top-16 z-[350]`, keeping classes and
  visuals identical. The header keeps `backdrop-blur-sm`; the trap is
  structurally eliminated because no `position: fixed` descendant remains
  inside it. Scroll-lock + Escape-to-close preserved.
  *TDD:* `tests/e2e/mobile-navigation.spec.ts` (8 specs) — open/navigate/close,
  computed-style pins (active link orange pill, hamburger→green circle X),
  scroll-lock assertion, Escape handling.
- ✅ **R-02 (fixes F-09) — Gate admin/account routes on store `ready`.**
  `AdminFrame`, `AccountPage`, `AccountOrderPage` wait for persisted-session
  rehydration before rendering the redirect decision.
  *TDD:* `tests/e2e/auth-admin.spec.ts` — hard-refresh `/admin` while logged in
  stays on `/admin` (was the failing case that exposed the bug).
- ✅ **R-03 (fixes F-08) — Version the localStorage key.** `STORAGE_KEY`
  `homenest.v1` → `homenest.v2`; schema changes re-seed cleanly instead of
  being shadowed by stale persisted state.
  *TDD:* covered by catalog E2E count assertions (`tests/e2e/catalog.spec.ts`).
- ✅ **R-04 (fixes F-04) — Real schema-relative DB-path resolution.**
  `src/lib/db-path.ts` rewritten: `file:../db/custom.db` resolves against a
  `prisma/`-anchor at repo root like the Prisma CLI, with `joinPath`
  normalization.
  *TDD:* `tests/db-path.test.ts` (8 contract tests, including normalization
  pins the tests initially got wrong and were corrected to pin the *real*
  contract).
- ✅ **R-05 (fixes F-12) — Card-expiry validation year floor** no longer
  hardcodes a single year (rolling window).

### 4.2 Environment, DB & tooling

- ✅ **R-06 (fixes F-03) — `.env` created** with
  `DATABASE_URL="file:../db/custom.db"`; `db/` sits at repo root
  (`db/catalog.json`); `.env.example` matches and is git-tracked.
- ✅ **R-07 (fixes F-02) — package.json hygiene.** Test tooling moved to
  `devDependencies`; scripts added: `dev`, `build`, `preview`, `typecheck`,
  `test`, `test:watch`, `e2e`, `verify`
  (`verify = typecheck && test && build`).
- ✅ **R-08 (fixes F-05) — `optimizeDeps.entries` pinned** to `index.html` +
  `src` so the dep scanner never walks the vendored `skills/` tree.
- ✅ **R-09 (fixes F-07) — vitest.config.ts** uses `fileURLToPath(import.meta.url)`
  for `__dirname`; `include` scoped to `tests/**/*.test.ts`.
- ✅ **R-10 (fixes F-06) — playwright.config.ts orchestration.** `webServer`
  runs `vite preview` on `127.0.0.1:4173` (strictPort), 45 s startup / 10 s
  action timeouts, `workers: 1`, `fullyParallel: false`, trace
  `retain-on-failure`; projects `chromium` + `mobile` (iPhone 14 profile pinned
  to the chromium engine — WebKit host libs unavailable in the sandbox,
  documented as accepted risk).

### 4.3 Visual & functional parity (F-17)

- ✅ **R-11 — Design tokens rebuilt** from live computed styles of the
  reference: primary `hsl(24 70% 50%)`, bg `hsl(30 25% 98%)`, accent green,
  radius 12 px, Playfair Display headings + system sans body; shadcn-style
  semantic token names in `src/index.css` `@theme`.
- ✅ **R-12 — Catalog parity + superset.** 8 reference-exact products
  (names/prices/ratings/review counts, imagery mirrored into
  `public/images/`) + 16 superset products remapped to the reference's
  8 categories; `CategoryId` union updated; hero carousel copy matched.
- ✅ **R-13 — Commerce constants parity.** `FREE_SHIPPING_THRESHOLD`
  10_000 → 5_000 ($50); `TAX_BPS` 825 → 0 (no tax line, matching reference).
  *TDD:* `src/lib/commerce.test.ts` updated pins + flat-shipping case.
- ✅ **R-14 — Chrome rewrite.** Header (orange pill active nav, search pill,
  user/cart icons with count badge), inline mobile dropdown menu (R-01),
  restyled CartDrawer, dark 4-column footer, Toaster, floating chat FAB,
  4-card feature bar.
- ✅ **R-15 — Page rewrites:** home (rounded hero carousel, 8 category cards,
  Featured/New grids, CTA banner), shop (URL-driven search/category/sort, PDP
  with quick-add, tags, stepper, "You May Also Like"), checkout flow
  (reference cart + COD notice, single-page COD checkout with card option as
  superset, reference order-success), account pages (auth card, profile,
  order history, 5-step vertical track-order stepper), content pages
  (About 2×2 values, Contact 3 info cards + form, legal).
- ✅ **R-16 — Router parity:** `/product/:id` (reference URL shape) aliased
  alongside `/products/:slug`.
- ✅ **R-17 — Admin console restyled** to the new token language
  (functionality preserved as superset).

### 4.4 Test suites (vitest + playwright)

- ✅ **R-18 — Unit layer:** `src/lib/commerce.test.ts` (money math, shipping,
  tax parity pins) + `tests/db-path.test.ts` (8 contract tests). 22 unit
  tests total, green.
- ✅ **R-19 — E2E layer:** 41 specs × 2 projects (chromium + mobile) = 82
  executions, green: smoke (5), mobile-navigation (8), catalog (6),
  cart-checkout (9, incl. COD flow, promo, guest-token gate, tamper
  rejection, track), auth-admin (7, incl. redirect validation + open-redirect
  fallthrough + role gate), visual-parity (6 computed-style build-breaker
  pins measured from the live reference).

### 4.5 Documentation & artifacts

- ✅ **R-20 — Doc suite:** `AGENTS.md`, `CLAUDE.md`, `README.md`,
  `Project_Architecture_Document.md` (7 ADRs, trap log, registered
  divergences) per the repo doc skills.
- ✅ **R-21 — Screenshots:** 15 dev-server captures in `docs/screenshots/`
  (desktop + mobile surfaces).
- ✅ **R-22 — `homenest-store-g_SKILL.md`** distilled per
  `skills/distill-codebase-skill` + `skills/to-distill-project-into-skill`
  (20 sections + appendices, every claim code-verified).
- ✅ **R-23 — `worklog.md`** maintained at repo root and included in the
  final commit.
- ✅ **R-24 — Remediation plan** (this document) saved under `docs/`.

---

## 5. Bugs Found *By* the Tests (root-cause fixes, not symptom patches)

| Bug | Caught by | Root cause | Fix |
|---|---|---|---|
| Hydration-race logout (F-09) | `auth-admin.spec.ts` hard-refresh case | Route guards redirected on stale store state before rehydration | Gate on `ready` (R-02) |
| "24 products found" stale catalog | Live sweep during remediation | Version-less localStorage key shadowed reseed | Key versioning (R-03) |
| Sort spec selector flake | `catalog.spec.ts` | Non-normalized path assumptions in test | Tests corrected to pin normalized contract |
| Strict-mode text matches | multiple specs | Playwright strict-mode + `getByRole` substring semantics | Spec-level precision fixes |

---

## 6. Verification Gate (post-remediation evidence)

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ clean |
| Unit | `npm run test` (vitest) | ✅ 22/22 |
| Build | `npm run build` | ✅ single-file bundle |
| E2E | `npm run e2e` (chromium + mobile) | ✅ 82/82 |
| Visual parity | computed-style pins + live agent-browser sweep | ✅ all surfaces |
| Mobile nav | 8 dedicated specs @ iPhone 14 profile | ✅ open/navigate/close/pins |

## 7. Residual Risks & Accepted Limitations

1. **npm advisories (`braces`, `micromatch`)** — build-time-only via
   `vite-plugin-singlefile` globbing of trusted repo inputs; no runtime
   exposure. Accepted, documented in PAD.
2. **WebKit not installed** in the sandbox; the `mobile` project pins the
   chromium engine while keeping the iPhone 14 device profile. Revisit when
   host libs are available.
3. **Client-only demo auth** — plaintext passwords in `localStorage`,
   non-crypto guest tokens (F-10/F-11). Acceptable for a demo storefront;
   the PAD threat model records the production path (server-side auth).
4. **A11y depth of mobile nav** — no focus trap / `aria-modal` yet (F-13);
   Escape + scroll-lock + labels are in place.

## 8. Follow-Up Recommendations (next session candidates)

1. Add focus trap + `aria-modal` to the mobile menu; keep E2E accessible-name
   compatibility.
2. Install WebKit host libs and un-pin the mobile project's browser engine.
3. Swap `Math.random` guest tokens for `crypto.getRandomValues` (one-liner,
   no schema change).
4. Consider a hash-pin CI job for `db/catalog.json` so catalog edits must bump
   the storage-key version.
5. Add axe-core smoke checks to the Playwright suite for the a11y targets in
   the SKILL/README.

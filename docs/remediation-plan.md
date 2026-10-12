# HomeNest Store G — Codebase Audit & Remediation Plan

> **Status:** EXECUTED & VALIDATED (100% of remediation items complete; session-5 addendum in §11)
> **Session:** 1 (see `docs/session_1.md`), 2 (see `docs/session_2.md`), 3 (§9 below), 4 (§10 below), 5 (§11 below)
> **Reference site:** https://nest-culinary-hub.base44.app/ (visual + functional parity target)
> **Tech-stack pattern source:** https://github.com/nordeim/ecommerce-store.git (AGENTS.md / CLAUDE.md / PAD / SKILL.md)
> **Verification gate at time of writing:** typecheck ✓ · 33/33 unit ✓ · build ✓ · 144/144 E2E ✓

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
- ✅ **R-05 (fixes F-12) — Card-expiry validation year floor.**
  ⚠️ **Session-3 correction:** session 1 recorded this item as done, but a
  session-3 code audit found `isExpiryValid` still contained the hardcoded
  `year >= 26` floor — the fix had never actually landed (the PAD's known-
  issues table was right, the ledger was wrong). Actually executed in
  session 3 as **R3-01** below. Lesson recorded: an executed item needs a
  test pin, not just a checkbox.

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

---

## 9. Session-3 Addendum (2026-10-12) — Follow-ups Executed + Live Parity Re-Measurement

Session 3 validated the session-1/2 ledgers against the code, executed the §8
follow-up recommendations (TDD), and re-measured the reference site live —
which surfaced five mobile parity gaps the earlier sweep had missed.

### 9.1 Ledger corrections

| Item | Correction |
|---|---|
| R-05 / F-12 | Was marked ✅ but the code still had the `year >= 26` floor. Actually fixed this session (R3-01). The checkbox outran the code; the test pin now outranks the checkbox. |

### 9.2 Follow-ups executed (TDD: red → green)

- ✅ **R3-01 (§8.3 + F-12) — `isExpiryValid` rolling window.** Two-digit year
  expands to `2000 + YY`; the card is valid through the last day of its expiry
  month; the clock is injectable (`isExpiryValid(value, now?)`) so the pin is
  deterministic. The old code accepted `01/26` in October 2026.
  *TDD:* `src/lib/commerce.test.ts` — 8 injected-clock pins including the
  distinguishing case `01/26 @ 2026-10-12 → false` (old code: true).
- ✅ **R3-02 (§8.3 / F-11) — crypto guest tokens.** New
  `generateGuestToken()` in `lib/commerce.ts`: 16 bytes from
  `crypto.getRandomValues`, hex-encoded (128-bit, URL-safe). `placeOrder`
  uses it; `Math.random` no longer touches any security-adjacent value.
  *TDD:* format/length/uniqueness pins in `commerce.test.ts`.
- ✅ **R3-03 (§8.1 / F-13) — Mobile menu is a real modal.** The portaled
  panel is wrapped in `role="dialog" aria-modal="true" aria-label="Site
  menu"`; focus moves into the panel on open (search input first), Tab /
  Shift+Tab cycle within it, Escape restores focus to the trigger. The inner
  `<nav aria-label="Mobile">` keeps its landmark role — all pre-existing E2E
  accessible-name contracts still pass. The overlay click-catcher is
  `tabIndex={-1}` (out of the tab order).
  *TDD:* 3 new specs in `tests/e2e/mobile-navigation.spec.ts` (11 total × 2
  projects).
- ✅ **R3-04 (§8.5) — axe-core smoke gate.** `tests/e2e/a11y-smoke.spec.ts`
  (4 specs × 2 projects) asserts **no critical/serious structural
  violations** on home / products / PDP / cart with `color-contrast`
  disabled, and logs the contrast findings so the count stays visible.
  *Exclusion rationale:* every failing contrast pair is a parity-pinned
  reference token (white on primary orange ≈3.2:1, white on badge amber
  ≈2.2:1, primary orange on white ≈3.2:1, muted grays ≈4.4:1) measured live
  from the reference — the reference itself fails the same checks. Visual
  parity is the higher-priority contract; registered in PAD §5.6.
- ✅ **R3-05 (§8.4, scoped to the real seed) — Catalog ↔ storage-key
  registry.** `src/lib/storage-key.ts` now owns `STORAGE_KEY` (dependency-free
  module); `tests/catalog-hash.test.ts` sha-256-hashes `src/data/catalog.ts`
  (LF-normalized) and requires `tests/catalog-registry.json` to map the
  current hash → the shipped `STORAGE_KEY`. Editing the seed without bumping
  the key fails the gate with repair instructions. Scope note: the original
  recommendation named `db/catalog.json`, but that file is brand/tooling
  config; the *client seed* is `src/data/catalog.ts`, so that is what is
  pinned. The contract proved itself immediately: the session-3 carousel
  reorder tripped it, forcing the deliberate `homenest.v2 → homenest.v3`
  bump (which also re-seeds stale clients).
- ✅ **R3-06 (§8.2) — WebKit attempt.** Browser binary downloads, but the
  sandbox cannot provide WebKit's host libraries (no root). The mobile
  project keeps the chromium engine + iPhone 14 profile; standing accepted
  risk unchanged.

### 9.3 Live parity re-measurement — five mobile gaps found and fixed

agent-browser sweep at 390×844 against the live reference (2026-10-12)
surfaced divergences the session-1/2 sweeps normalized away. All fixed and
pinned by the new `tests/e2e/mobile-header-parity.spec.ts` (4 specs × 2
projects):

| Gap | Reference (measured) | Clone before | Fix |
|---|---|---|---|
| Hamburger position | Trailing edge: logo → user → cart → **hamburger** | Hamburger left of the logo | Moved to the right group after the cart button |
| Mobile search button | None in the header (search lives in the menu) | Search icon shown below `lg` | `hidden md:inline-flex lg:hidden` |
| Feature bar on phones | 2×2 grid at 390px | 1-col stack | `grid-cols-2` base (was `sm:grid-cols-2`) |
| Carousel order | Slide 1 "Elevate Your Kitchen" (Shop Now) | Slide 1 "New Arrivals" | Reordered CAROUSEL; `STORAGE_KEY` → `homenest.v3` |
| Page dim under menu | None | `bg-white/70` + blur wash | Overlay click-catcher made transparent; scroll-lock/focus-trap kept |

"Sign in" remains in the mobile menu as registered divergence (demo-auth
entry point; the reference delegates auth to its platform screen).

### 9.4 Verification gate (post session-3)

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ clean |
| Unit | `npm run test` (vitest) | ✅ 25/25 |
| Build | `npm run build` | ✅ single-file bundle |
| E2E | `npm run e2e` (chromium + mobile) | ✅ 104/104 (52 specs × 2 projects) |
| a11y | axe structural gate on 4 surfaces | ✅ 0 critical/serious (contrast documented) |
| Mobile nav | 11 specs @ iPhone 14 profile | ✅ incl. modal dialog + focus trap |
| Mobile header parity | 4 bounding-box/layout pins | ✅ |

### 9.5 Residual risks (updated)

1. npm advisories (`braces`/`micromatch`) — unchanged, build-time only.
2. WebKit host libs unavailable in this sandbox — chromium-engine pin stays.
3. Client-only demo auth — plaintext passwords still in localStorage (server
   workstream required; unchanged). Guest tokens are now crypto-grade.
4. Color-contrast pairs on parity surfaces — documented exclusion (§9.2
   R3-04); changing them is a parity-breaking decision, not a lint fix.

### 9.6 Follow-up recommendations (next candidates)

1. Server-backed auth workstream (removes F-10 entirely).
2. Re-check the reference site's menu behavior on future sweeps — the page
   dim flipped between session-1 and session-3 measurements; the clone
   follows the latest measurement.
3. Add axe checks for authenticated surfaces (account, admin) once the demo
   auth flow is exercised in the a11y spec.

---

## 10. Session-4 Addendum (2026-10-12) — Doc-Drift Audit, Cart-Drawer Modal, Authenticated axe Gate, Menu Parity Re-Sweep

Session 4 validated the session-3 ledger and transcript against the code,
audited the codebase with the repo skills, and re-swept the live reference
(§9.6.2). The sweep surfaced five more menu-level parity gaps; the audit
found one real a11y gap (cart drawer) and six stale SKILL claims.

### 10.1 Ledger corrections (doc drift found by the audit)

| Location | Stale claim | Correction |
|---|---|---|
| SKILL §7 | `nextOrderNumber()` generates `ORD-XXXXXXX` (random) | Code generates sequential `ORD-YYYY-NNN` (per-year max + 1, injectable clock) — §7 now matches the code |
| SKILL §8 | Mobile menu "no focus trap / aria-modal yet — registered gap" | Session 3 (R3-03) shipped both; §8 updated |
| SKILL §13 | "Don't fix guest tokens ad hoc — registered follow-up" | Fixed in session 3 (R3-02); §13 now warns against regressing |
| SKILL §15 | URL-driven pattern reads the `q` param | The real contract is `search` |
| SKILL §19 | "white at 70% + blur for the mobile-menu dim" | The dim was removed in session 3; §19 documents `--color-panel` instead |
| SKILL App. D | Session-2 row missing | Added, plus the session-4 row |

### 10.2 Follow-ups executed (TDD: red → green)

- ✅ **R4-01 — Cart drawer is a real modal.** The drawer (the app's top
  modal surface, z-500) carried `role="dialog"` but no `aria-modal`, no
  focus trap, no focus management — keyboard users could Tab into the dimmed
  page behind it. Now: `aria-modal="true"`, focus moves into the drawer on
  open (close button first), Tab/Shift+Tab cycle within it, the backdrop
  click-catcher is `tabIndex={-1}`, Escape closes, and focus restores to the
  cart trigger on close — the same contract the mobile menu has had since
  R3-03.
  *TDD:* new `tests/e2e/cart-drawer.spec.ts` (3 specs × 2 projects): modal
  semantics + initial focus, full Tab cycle + Shift+Tab wrap, focus restore
  via Escape and via the X button.
- ✅ **R4-02 (§9.6.3) — axe gate extended to authenticated surfaces.**
  `tests/e2e/a11y-smoke.spec.ts` grew two tests: `/account` (demo customer)
  and `/admin` (demo admin) both log in through the real UI and must show
  zero critical/serious structural violations. Result: both surfaces are
  structurally clean; their color-contrast findings (3/1 and 2/1 nodes) are
  the same parity-pinned reference tokens, logged not gated.
- ✅ **R4-03 — SKILL doc-drift corrections.** All six stale claims in
  §10.1 fixed in the same change; SKILL bumped to v1.1.0.
- ✅ **R4-04 (§9.6.2) — Menu parity re-measurement: five gaps fixed.** The
  live sweep at 390×844 (same reference, re-measured 2026-10-12) found the
  menu panel had drifted further from the reference than session 3 knew:

  | Gap | Reference (measured) | Clone before | Fix |
  |---|---|---|---|
  | Panel surface | `rgba(255,255,255,0.8)` translucent, NO drop shadow, 1px bottom border | Solid white + `shadow-pop` | New `--color-panel` token (alpha baked in — see T-13); shadow removed |
  | Menu search control | Compact muted icon pill (`rgb(242,240,237)`, radius 9999px, 40px wide) — functionally inert | Full-width always-expanded input | Pill at rest (parity); tapping expands the working input and focuses it (superset — registered divergence #13) |
  | Row type scale | 14px / weight 500 | 16px | `text-sm` |
  | Inactive row color | `rgb(126,111,103)` (muted-foreground) | `rgb(29,24,22)` (foreground) | `text-muted-foreground` |
  | Active-row radius | 12px | full pill (`calc(infinity*1px)`) | `rounded-md` (12px token) |

  *TDD:* 4 new/updated pins in `tests/e2e/mobile-navigation.spec.ts`
  (resting-visuals pin, pill-expand behavior, collapse-on-close behavior,
  focus-entry updated to the pill; 14 specs × 2 projects).
- ✅ **New trap T-13** (both AGENTS.md and SKILL §9): Tailwind v4 serializes
  `/NN` opacity modifiers as oklab `color-mix` and `rounded-full` as
  `calc(infinity * 1px)` — both visually identical to the reference's
  v3-era `rgba(...)`/`9999px` but different as computed strings. Fix: bake
  alpha into the token (`--color-panel`), use `rounded-[9999px]` where an
  exact radius string is pinned.

### 10.3 Verification gate (post session-4)

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ clean |
| Unit | `npm run test` (vitest) | ✅ 25/25 |
| Build | `npm run build` | ✅ single-file bundle (497 KB) |
| E2E | `npm run e2e` (chromium + mobile) | ✅ 120/120 (60 specs × 2 projects) |
| a11y | axe structural gate on 6 surfaces (home, products, PDP, cart, account, admin) | ✅ 0 critical/serious (contrast documented) |
| Mobile nav | 14 specs @ iPhone 14 profile | ✅ incl. session-4 resting-visual pins |
| Cart drawer | 3 modal-semantics specs | ✅ |

### 10.4 Residual risks (updated)

1. npm advisories (`braces`/`micromatch`) — unchanged, build-time only.
2. WebKit host libs unavailable in this sandbox — chromium-engine pin stays.
3. Client-only demo auth — plaintext passwords still in localStorage (server
   workstream required; unchanged).
4. Color-contrast pairs on parity surfaces — documented exclusion (§9.2
   R3-04); now measured and logged on authenticated surfaces too.
5. Reference-side quirk, not actionable: the reference's own toast viewport
   (`fixed top-0 z-[100] w-full`) covers its menu search pill, so the pill
   cannot actually be clicked on the reference; the clone's expanded search
   is fully interactive.

### 10.5 Follow-up recommendations (next candidates)

1. Server-backed auth workstream (removes F-10 entirely) — unchanged from
   §9.6; remains the largest open item.
2. Re-check the reference menu on future sweeps — its resting visuals have
   now changed twice across three sweeps (dim flip in session 3, panel
   translucency + search pill in session 4); the clone follows the latest
   measurement each time.
3. Desktop search overlay: consider ArrowDown/ArrowUp navigation for the
   combobox listbox (nice-to-have; axe-clean today).

---

## 11. Session-5 Addendum (2026-10-12) — Password-At-Rest Hardening, Search Combobox Keyboard Plan, Reference Re-Sweep, Account Layout Fix

Session 5 executed the §10.5 candidates: the auth hardening downgrades F-10
(without the server workstream), the combobox keyboard plan promotes §10.5.3,
and the mandated re-sweep caught the reference's third resting-visual change.
The audit also surfaced a real mobile layout bug and stale user-facing copy.

### 11.1 Live parity re-sweep (§10.5.2 mandate)

agent-browser sweep at 390×844 + 1440×900 against the live reference
(2026-10-12). Findings:

1. **Carousel auto-rotation explained.** The reference's carousel
   auto-rotates and each slide's title becomes the page `h1` ("Elevate Your
   Kitchen" → "New Arrivals" → "Sale Up to 40% Off"). Earlier sweeps'
   transient readings were mid-rotation captures; slide 1 on load is still
   "Elevate Your Kitchen" — the existing pin holds.
2. **Re-confirmed all session-4 menu pins**: white/80 shadowless panel with
   `1px solid rgba(229,224,220,0.5)` bottom border; compact muted search pill
   `rgb(242,240,237)`; rows 14px/500 muted-foreground; active row 12px radius
   on the primary orange; no page dim. (A false-positive 9999px row reading
   came from the reference's hidden desktop nav — display:inline, zero-size —
   still present in the DOM at mobile widths.)
3. **DRIFT — the green close disc is gone.** The session-3/4 measurement
   (trigger swaps to a green circle `rgb(69,161,130)` with a white X) no
   longer holds: BOTH trigger states now render a bare dark icon
   (transparent 36×36 button, foreground-colored glyph, no inner span).
   Fixed as **R5-03** below.

### 11.2 Follow-ups executed (TDD: red → green)

- ✅ **R5-01 (§10.5.1, downgrades F-10) — Password-at-rest hardening.** New
  `src/lib/password.ts`: records store `passwordHash: "s1$<32-hex-salt>$<64-hex-sha256(salt:password)>"`
  (16-byte CSPRNG salt per record, WebCrypto — no dependency). `login`,
  `register`, `changePassword` are now async; `verifyPassword` accepts legacy
  plaintext records and **upgrade-on-login** migrates them in place. The demo
  seed ships pre-hashed (static salts, a documented consequence of a static
  seed); `User.password` → `User.passwordHash` (rehydrate normalizes the
  legacy shape); `STORAGE_KEY` bumped `homenest.v3 → homenest.v4` (registry
  gate forced and verified) so stale clients re-seed cleanly. Honest scope:
  SHA-256 is not a KDF — this is defense-in-depth; §10.5.1's server workstream
  stays open (PAD §6.2/§6.3 updated).
  *TDD:* `tests/password.test.ts` (8 unit pins: format, salted determinism,
  round-trip, legacy path) + `tests/e2e/password-hash.spec.ts` (4 specs × 2
  projects: hashed seed w/ plaintext dump rejection, register-then-dump,
  sign-back-in round-trip, legacy-record upgrade).
- ✅ **R5-02 (§10.5.3) — Search combobox keyboard plan.** The desktop overlay
  had the static ARIA skeleton but zero keyboard support. Now the WAI-ARIA
  1.2 combobox (listbox-popup) pattern: ArrowDown/ArrowUp wrap through
  suggestions, Home/End jump, Enter navigates to the active option (default
  submit preserved when nothing is active), Escape dismisses; the active
  option is exposed via `aria-activedescendant` + `aria-selected` with a
  `bg-muted` highlight; the no-results row moved OUT of the `role=listbox`.
  *TDD:* `tests/e2e/search-keyboard.spec.ts` (5 specs, fixed 1280 viewport).
- ✅ **R5-03 (sweep drift) — Menu trigger parity re-pin.** The green close
  disc (session-3 pin) is removed; both trigger states render the bare dark
  icon exactly as the reference now does. `bg-accent` remains used elsewhere.
  *TDD:* the "green close circle" spec rewritten as "menu trigger renders a
  bare dark icon in both states (no colored disc)" (transparent bg, no inner
  span, foreground color) — RED against the old build, GREEN after.
- ✅ **R5-04 — axe structural gate extended to `/checkout` and `/contact`.**
  Checkout (with items in cart) and contact join the smoke gate: 8 surfaces
  total, zero critical/serious structural violations, contrast findings
  logged per the documented exclusion.
- ✅ **R5-05 — Stale storage-key copy.** `/privacy` (×2) and the admin
  Settings surface hardcoded `homenest.v1` in user-visible text; all three
  now render the real `STORAGE_KEY` import. AGENTS.md/CLAUDE.md also still
  said `homenest.v2` — corrected to v4 in this session's docs pass.
- ✅ **R5-06 — Account header overflow on phones (real bug, caught by the
  R5-01 round-trip spec on the mobile project).** The header card's identity
  block had no min-width floor: long names/emails pushed the Log out control
  past the right viewport edge (un-tappable; the spec timed out mid-click).
  Fix: wrapping header row (`flex-wrap` + `gap-4`), `min-w-0` floors,
  `break-words` name, `break-all` email, `shrink-0` avatar/mail glyph.
  *TDD:* `tests/e2e/account-layout.spec.ts` — long-identity registration,
  bounding box inside the 390px viewport, click resolves, logged-out chrome
  appears.

### 11.3 Verification gate (post session-5)

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ clean |
| Unit | `npm run test` (vitest) | ✅ 33/33 (25 + 8 password) |
| Build | `npm run build` | ✅ single-file bundle (499 KB) |
| E2E | `npm run e2e` (chromium + mobile) | ✅ 144/144 (72 specs × 2 projects) |
| a11y | axe structural gate on 8 surfaces (home, products, PDP, cart, account, admin, checkout, contact) | ✅ 0 critical/serious (contrast documented) |
| Search keyboard | 5 combobox specs @ 1280px | ✅ |
| Password at rest | 4 specs × 2 projects | ✅ |

### 11.4 Residual risks (updated)

1. npm advisories (`braces`/`micromatch`) — unchanged, build-time only.
2. WebKit host libs unavailable in this sandbox — chromium-engine pin stays.
3. Client-only demo auth — passwords now hashed at rest (R5-01) but SHA-256
   is not a KDF and there is no rate-limiting/revocation: the server-backed
   workstream remains the real fix (PAD §6.3, "reduced but accepted").
4. Color-contrast pairs on parity surfaces — documented exclusion (§9.2
   R3-04); logged on all 8 gated surfaces.
5. Reference-side quirk, not actionable: its carousel auto-rotates and the
   active slide title becomes the page h1; sweeps must read slide 1 on load
   (or reload) before comparing.

### 11.5 Follow-up recommendations (next candidates)

1. Server-backed auth workstream — unchanged; R5-01 narrowed F-10 to
   "client-hashed, no KDF/rate-limit/revocation".
2. Reference re-sweep — the resting visuals have now changed in THREE
   consecutive sweeps; keep re-measuring before every menu-touching change.
3. `aria-live` result announcements for the search combobox (cosmetic; the
   APG keyboard plan is shipped).
4. ESLint flat config wired into `npm run verify` (PAD §10 known issue).

---

## 12. Session-8 Addendum (2026-10-12) — Sitemap & SEO Workstream, Reference Re-Sweep (No Drift), Head Contract

Session 8 executed the user-mandated SEO/sitemap workstream (the one major
gap no prior session covered), adapting the `ecommerce-store` template's
SEO pattern (`src/app/sitemap.ts`, `robots.ts`, root metadata, per-page
`generateMetadata`, JSON-LD) to this single-file Vite SPA. The mandated
reference re-sweep found NO visual drift for the first time in four sweeps —
so the session's entire code budget went to the SEO superset.

### 12.1 Live parity re-sweep (§11.5.2 mandate)

agent-browser sweep @390×844 (2026-10-12) against the live reference:

- **All session-4/5 menu pins re-confirmed** — white/80 shadowless panel
  with the 1px bottom border, bare dark trigger in both states, 14px/500
  rows in muted-foreground, 44px row height, 12px active-row radius on the
  primary orange `rgb(217,110,38)` with white text. First sweep with zero
  visual drift (the "visuals changed N sweeps running" watch is closed for
  now — the doctrine stays: re-measure before any menu-touching change).
- Reference SEO shape decoded for the workstream (see §12.2).

### 12.2 The reference's SEO posture (decoded live, superset targets)

| Layer | Reference (measured) | Clone (this session) |
|---|---|---|
| robots.txt | present but disallows NOTHING | disallows /admin, /account, /cart, /checkout, /order-success + sitemap pointer |
| sitemap.xml | 22 static URLs; wrongly lists /admin/* and /account; ZERO product URLs | 36 URLs: 12 public statics + all 24 visible products as /products/{slug}; private surfaces excluded |
| manifest.json | 302 (broken) | not shipped (PWA out of scope; registered) |
| Per-route titles | inline map for 23 static paths; PDPs keep the static title | same map pinned (incl. "Order Tracking" / "Terms Of Service" quirks) + dynamic superset: PDP → "{Product} \| HomeNest Kitchen", humanized unknown slugs, auth/not-found titled |
| Admin titles | "admin/Admin Dashboard \| …" (namespace artifact) | cleaned to "Admin Dashboard \| …" — registered divergence |
| OG/Twitter | full static set, og:image = media-CDN logo 1200×630 | same shape in index.html + per-route og:title/description/url rewrites |
| Canonical | none | per-route canonical (query dropped; og:url keeps it — template METADATA-OG-1 shape) |
| JSON-LD | none | Organization + WebSite (static, index.html) + per-PDP Product node (offers/brand/aggregateRating) — template JSON-LD-1 shape |

### 12.3 Follow-ups executed (TDD: red → green)

- ✅ **R8-01 — `public/robots.txt`.** Allow-all with private surfaces
  disallowed (the reference disallows nothing) + sitemap pointer.
  Generated by `scripts/generate-sitemap.mjs` (single source of truth with
  the sitemap), committed to the repo, copied verbatim into `dist/` by Vite.
- ✅ **R8-02/03 — sitemap generator + catalog↔sitemap gate.**
  `scripts/generate-sitemap.mjs` extracts visible slugs from
  `src/data/catalog.ts` and writes both artifacts; `npm run build` runs it
  via the `prebuild` hook. `tests/sitemap.test.ts` parses the COMMITTED
  sitemap against the real catalog import — every visible product present
  at 0.8/weekly, static routes at template priorities (1.0 daily home,
  0.9 daily products, 0.5/0.3 monthly content, 0.2 yearly auth), private
  routes absent, one consistent origin.
- ✅ **R8-04 — static head set in `index.html`.** The reference's
  description verbatim (brand-copy parity), robots meta, theme-color,
  canonical, media-CDN logo favicon (the ecommerce-store template's
  FAVICON-1 precedent — no shipped binary), full OG + Twitter
  (summary_large_image) set, and the Organization/WebSite JSON-LD nodes
  (one node per script).
- ✅ **R8-05 — per-route head contract.** New pure seam
  `src/lib/seo.ts` (`buildRouteMeta` — title/description/canonicalUrl/
  ogUrl/jsonLd) + `src/components/head-manager.tsx` applying it inside
  `RouterProvider` on every path/search change: document.title, meta
  description, canonical, og/twitter title+description+url, and a scoped
  `#route-jsonld` script (Product node on resolved PDPs — by slug OR id;
  removed everywhere else). `/admin` redirect semantics mean the admin
  titles are observable only pre-redirect — they stay pinned at the unit
  layer.
- ✅ **R8-06 — served-artifact E2E gate.** `tests/e2e/seo-head.spec.ts`
  (19 specs × 2 projects): robots.txt/sitemap.xml served by the production
  bundle, 13 per-route titles, PDP title = h1 + canonical/og/url + Product
  JSON-LD (USD, InStock), humanized unknown-slug title with no Product
  node, static OG/Twitter/JSON-LD set, and client-side title updates
  across pushState/popstate (desktop viewport — the mobile project carries
  nav inside the menu panel).

### 12.4 Verification gate (post session-8)

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | ✅ clean |
| Unit | `npm run test` (vitest) | ✅ 95/95 (33 → 95: +29 seo, +33 sitemap) |
| Build | `npm run build` | ✅ single-file bundle (506 KB, prebuild regenerates SEO artifacts) |
| E2E | `npm run e2e` (chromium + mobile) | ✅ 182/182 (91 specs × 2 projects) |
| a11y | axe structural gate on 8 surfaces | ✅ unchanged, clean |
| SEO served | robots.txt + sitemap.xml via `vite preview` | ✅ |

### 12.5 Residual risks (updated)

1. npm advisories (`braces`/`micromatch`) — unchanged, build-time only.
2. WebKit host libs unavailable in this sandbox — chromium-engine pin stays.
3. Client-only demo auth — unchanged (R5-01 posture; server workstream open).
4. Color-contrast pairs on parity surfaces — documented exclusion (§9.2).
5. The static head fallbacks in `index.html` and the generated artifacts
   hardcode the documented default origin (`http://localhost:4173`);
   deploying elsewhere requires `VITE_SITE_URL` (documented in
   `.env.example`) + re-running the generator — the sync is test-gated.
6. Reference-side quirk: its per-route title map leaves PDPs on the static
   title; our PDP titles are a deliberate superset (PAD §5.6).

### 12.6 Follow-up recommendations (next candidates)

1. Server-backed auth workstream — unchanged, still the largest open item.
2. Reference re-sweep doctrine stays (no drift this sweep — first time in
   four; keep re-measuring before menu-touching changes).
3. `aria-live` result announcements for the search combobox (cosmetic).
4. ESLint flat config wired into `npm run verify` (PAD §10 known issue).
5. Optional PWA layer (the reference's manifest 302s; a valid
   `manifest.webmanifest` would extend the superset if ever wanted).

---

## 13. Session-10 Addendum (2026-10-13) — DEPLOYMENT.md Alignment, Full Re-Validation, Re-Sweep (No Drift)

Session 10's mandate re-ran the standing validation doctrine and carried
one explicit new workstream: **customize `docs/DEPLOYMENT.md`** (the file
the template hand-off left as a verbatim copy of the `ecommerce-store`
ORBITAL guide — a Next.js/Bun/Prisma app this repo shares nothing with)
"as appropriate to suit/align with the current codebase". No code defects
surfaced; the session's entire budget went to the deployment doc, doc
cross-links, and re-validation.

### 13.1 Validation & audit (all green, nothing new)

- Doc suite re-read and validated against the code: AGENTS.md, CLAUDE.md,
  README.md, PAD, SKILL.md (v1.3.0), remediation plan §11–12, worklog
  (Tasks 1–11), session_8/9 (session_9 is session 8's raw transcript).
- Baseline gate reproduced the session-8 ledger exactly: typecheck ✓ ·
  95/95 unit ✓ · build 506 KB ✓ · **182/182 E2E** ✓.
- SEO/sitemap posture re-verified in place: generated robots.txt
  (private surfaces disallowed) + sitemap.xml (36 URLs = 12 statics +
  24 products), served by `vite preview`; served PDP head contract
  (title = h1, canonical, og:title, Product JSON-LD USD) re-probed live.
- Live reference re-sweep (agent-browser @390×844, 2026-10-13): **no
  visual drift — second consecutive sweep with zero changes.** All
  session-4/5/8 menu pins re-confirmed (white/80 shadowless panel with
  the 1px bottom border, 14px/500 rows, 44px height, 12px active radius,
  white active text, muted `rgb(126,111,103)` inactive rows). Reference
  SEO posture unchanged (robots disallows nothing; sitemap = 22 statics,
  0 product URLs).
- Clone-side sweep (agent-browser @390×844 + 1440×900): menu dialog
  contract verified live (`role="dialog"`, `aria-modal`, focus enters at
  the search pill, 7× Tab cycles inside the panel, Escape restores the
  trigger), inactive-row color matches the reference exactly, and the
  humanized unknown-slug PDP behavior (title from slug, h1 "Product not
  found", no Product JSON-LD) re-confirmed against a deliberately wrong
  slug before re-testing a real one.

### 13.2 Follow-ups executed

- ✅ **R10-01 — `docs/DEPLOYMENT.md` rewritten for this codebase.** The
  template copy described ORBITAL's Next.js standalone build, bun
  runtime, Prisma migrations, AUTH_SECRET, and rate-limited logins —
  none of which exist here. The customized guide documents the real
  contract: the single-file build (prebuild regenerates the SEO
  artifacts), the static-host serving matrix (`vite preview`, Netlify/
  Vercel rewrites, gh-pages, `try_files`), the environment table
  (`DATABASE_URL` tooling contract, `VITE_SITE_URL` as the production
  origin knob, E2E/CI vars), the schema-relative DB location rules, the
  §5 origin-sync procedure for real domains, the update flow, a browser
  + curl verification checklist, and an issue table mapping the known
  traps (SPA-fallback 404s, SEO origin mismatch, stale localStorage,
  port 4173, npm advisories, WebKit libs, hydration race).
- ✅ **R10-02 — cross-links:** README Documentation section gains the
  DEPLOYMENT.md row (plus the missing session_7/9 transcript rows);
  PAD §8.1 now points at the deployment guide.

### 13.3 Verification gate (post session-10)

Docs-only change (4 screenshots + 4 docs); no source, test, or config
files touched, so the session's observed gate remains the ledger:
typecheck ✓ · 95/95 unit ✓ · build 506 KB ✓ · 182/182 E2E ✓ (all
observed this session, before the doc edits; re-confirmed after edits —
docs are outside every gate's file set).

### 13.4 Residual risks & follow-up candidates (updated)

Unchanged from §12.5/§12.6: server-backed auth remains the largest open
item; re-sweep doctrine stays; `aria-live` combobox announcements,
ESLint flat config, and the optional PWA manifest are the remaining
optional candidates. New deployment-specific notes (SPA fallback on the
host, `VITE_SITE_URL` in production) are documented in
`docs/DEPLOYMENT.md` §8 and PAD §10 rather than tracked as risks.

---

## 14. Session-12 Addendum (2026-10-13) — Fresh-Clone Rebuild, Full Re-Validation, Re-Sweep (No Drift, Third Consecutive)

Session 12 started from a **reset workspace**: the local checkout was
gone, so the mandate's clone branch ran instead of `git pull`. The
remote had advanced by exactly one commit (`6a7fc4f` — the raw
session-10 execution transcript saved as `docs/session_11.md`; no code
or doc-suite changes). The session re-proved the whole ledger from a
pristine clone and re-ran the mandated sweeps; **no defects surfaced
and no code changes were needed** — the budget went to validation
evidence, captures, and this record.

### 14.1 Fresh-clone validation (all green, from zero)

- Clone → `6a7fc4f` on `main`. `git diff 7a67fc1..HEAD` confirmed the
  doc suite (AGENTS/CLAUDE/README/PAD/SKILL/remediation plan/worklog)
  is byte-identical to the session-10 push — the session-10 review
  carries over verbatim.
- `.env` recreated with the pinned contract
  (`DATABASE_URL="file:../db/custom.db"`); `git check-ignore` confirms
  `.env` and `db/custom.db` stay out of version control.
- Baseline gate reproduced the session-10 ledger exactly from a bare
  `npm install`: typecheck ✓ · **95/95 unit** ✓ · build 506.37 KB ✓ ·
  **182/182 E2E** ✓.
- **SEO determinism re-proven:** the `prebuild`-hook regeneration of
  `public/robots.txt` + `public/sitemap.xml` in the fresh clone
  produced artifacts **byte-identical to the committed ones**
  (`git status` clean after build) — the catalog-gated generator is
  stable, and the sitemap still carries 36 URLs (12 statics + 24
  products) with private surfaces disallowed.

### 14.2 Live sweeps (both sides, no drift)

- Reference (agent-browser @390×844, 2026-10-13): **no visual drift —
  third consecutive sweep.** Panel `rgba(255,255,255,0.8)` shadowless
  with the 1px bottom border, active row 14px/500 white on 12px radius
  at 44px height, inactive rows muted `rgb(126,111,103)`. Reference SEO
  posture unchanged: sitemap = 22 statics, 0 product URLs.
- Clone (mobile + desktop): menu dialog contract verified live
  (`role="dialog"` + `aria-modal`, focus enters at the search pill, 7 ×
  Tab cycles inside the panel, Escape restores the "Open menu"
  trigger); row pins match the reference exactly; served PDP head
  contract re-probed (title = h1, canonical, Product JSON-LD USD);
  robots.txt + sitemap.xml served by `vite preview`.
- **Conclusion: no functional or visual gaps found on either side.**

### 14.3 Follow-ups executed

- ✅ **R12-01 — fresh-clone reproducibility evidence** (§14.1): a
  stranger's `git clone && npm install` path re-produces the exact
  gate and byte-identical SEO artifacts — the CLAUDE.md "fresh clone
  in under two minutes" success metric held.
- ✅ **R12-02 — session captures** (3, visually verified post-capture):
  `session12-home-desktop`, `session12-mobile-home`,
  `session12-mobile-menu-open` → `docs/screenshots/`; README
  Documentation list extended with the session_10/11/12 rows.

### 14.4 Verification gate (post session-12)

Docs-only change set (3 screenshots + 4 markdown files) after the
observed gate: typecheck ✓ · 95/95 unit ✓ · build 506.37 KB ✓ ·
182/182 E2E ✓ — all observed this session from the fresh clone; docs
sit outside every gate's file set.

### 14.5 Residual risks & follow-up candidates (unchanged)

Same list as §13.4: server-backed auth workstream, `aria-live`
combobox announcements, ESLint flat config, optional PWA manifest.

## 15. Session-14 Addendum (2026-10-13) — Fourth No-Drift Sweep, R14-01 Screen-Reader Search Announcements (TDD)

Session 14 ran on the persisted checkout (no reset this time): `git
pull` fast-forwarded `3d40509..01259a1` — the remote had advanced by
exactly one commit adding `docs/session_13.md`, the raw session-12
transcript. A sandbox quirk (1659 pure file-mode flips) was neutralized
with `git config core.fileMode false`; content was byte-clean. With no
defects to fix, the session spent its change budget on the smallest
standing candidate — **aria-live combobox announcements** — executed
strictly RED→GREEN.

### 15.1 Validation (baseline ledger reproduced, then re-run post-change)

- Baseline gate before any change: typecheck ✓ · **95/95 unit** ✓ ·
  build 506.37 KB ✓ · **182/182 E2E** ✓ — session-12 ledger reproduced
  on the pulled tree; SEO determinism held again (prebuild
  regeneration byte-identical, sitemap 36 URLs, private surfaces
  disallowed).
- agent-browser 0.39.0's Chromium began failing DNS for the reference
  host while OS DNS worked; sweeps moved to repo-installed Playwright
  Chromium with `--host-resolver-rules=MAP …` (scripts persisted under
  `/home/z/my-project/scripts/`).

### 15.2 Live sweeps (both sides, no drift — fourth consecutive)

- Reference (@390×844): trigger bare (transparent bg, no border/shadow,
  36×36); sticky `NAV.bg-card/80` panel `rgba(255,255,255,0.8)`,
  shadowless, `1px solid rgba(229,224,220,0.5)` bottom border; active
  row 14px/500 white on `rgb(217,110,38)` at 12px radius / 44px;
  inactive rows muted `rgb(126,111,103)`. Reference still ships **no**
  dialog semantics, no focus management, no Escape handling; SEO
  posture unchanged (robots disallows nothing; sitemap 22 statics,
  0 product URLs — the 7 `/admin/*` and 4 private surfaces are all
  still listed).
- Clone: dialog contract verified live (role/aria-modal/label,
  portal-to-body, initial focus at the search pill, 7 × Tab trap with
  wrap, Escape restores the trigger); row pins exact + superset
  `Sign in` row; served PDP head (title = h1, canonical, og:title,
  Product JSON-LD USD); robots 5 disallows; sitemap 36 URLs.
- **Conclusion: no functional or visual gaps on either side.**

### 15.3 R14-01 — combobox result announcements (closed a standing candidate)

- **RED**: three specs appended to `tests/e2e/search-keyboard.spec.ts`
  (status region scoped via `getByRole("search").getByRole("status")`):
  count announcement matching the option count, "no results"
  announcement, empty-until-queried + `aria-live="polite"`. Observed 6
  failures across both projects; 10 pre-existing combobox specs green.
- **GREEN**: `src/components/chrome.tsx` gains a visually-hidden
  `role="status" aria-live="polite"` region inside the search form —
  "N products match your search." / "1 product matches your search." /
  "No products match that search." only while a query is non-empty.
  Served-page probe: 1×1 px clipped box (`sr-only`), zero visual
  footprint; visual-parity suite green.
- Post-change gate: typecheck ✓ · 95/95 unit ✓ · build 506.59 KB
  (+0.22 KB) ✓ · **188/188 E2E** (94 specs × 2 projects) ✓ · SEO
  artifacts byte-identical ✓ · post-change clone re-sweep green
  (announcement observed live: "3 products match your search.").

### 15.4 Follow-ups executed

- ✅ **R14-01** — combobox result announcements (§15.3).
- ✅ **R14-02** — 4 session captures, visually verified post-capture
  (`session14-home-desktop`, `session14-pdp-desktop`,
  `session14-mobile-home`, `session14-mobile-menu-open`) →
  `docs/screenshots/`; README Documentation rows extended.

### 15.5 Verification gate (post session-14)

typecheck ✓ · 95/95 unit ✓ · build 506.59 KB ✓ · 188/188 E2E ✓ —
observed after the R14-01 change; docs-only remainder sits outside
every gate's file set.

### 15.6 Residual risks & follow-up candidates (shrunk by one)

Remaining from the §13.4/§14.5 list: server-backed auth workstream,
ESLint flat config into `npm run verify`, optional PWA manifest.
(Closed this session: aria-live combobox announcements.)

## 16. Session-16 Addendum (2026-10-13) — Fifth No-Drift Sweep, R16-01 ESLint Flat Config Wired into `verify`

Session 16 ran on the persisted checkout: `git pull` fast-forwarded
`02db6a5..506b77e` — the remote had advanced by exactly one commit
adding `docs/session_15.md`, the raw session-14 transcript. With no
defects found and the candidate list down to three, the session closed
the next-smallest standing item: the PAD §10 "No ESLint/Prettier config"
gap — executed as pure tooling (devDeps + config + gate wiring), zero
runtime surface.

### 16.1 Validation (baseline ledger reproduced, then re-run post-change)

- Baseline gate before any change: typecheck ✓ · **95/95 unit** ✓ ·
  build 506.59 KB ✓ · **188/188 E2E** ✓ — session-14 ledger reproduced;
  SEO determinism held (prebuild regeneration byte-identical, sitemap
  36 URLs, 5 private surfaces disallowed).
- Post-change gate: typecheck ✓ · **lint ✓ (new stage)** · 95/95 ✓ ·
  build 506.59 KB ✓ (size-identical bundle — nothing shipped changed) ·
  **188/188 E2E** re-observed on the post-tooling build.

### 16.2 R16-01 — ESLint 9 flat config (closes a PAD §10 MEDIUM row)

- Toolchain (devDeps only): eslint 9.39.5, typescript-eslint 8.71.2,
  eslint-plugin-react-hooks 5.2.0, eslint-plugin-react-refresh 0.4.26,
  globals 16.5.0 (Node v24.21.0).
- `eslint.config.js`: global ignores (incl. **`skills/`** per the
  standing mandate, plus dist/docs/public/db/Playwright artifacts);
  browser block (js + tseslint recommended, react-hooks
  recommended-latest, react-refresh vite preset); node block for build
  tooling and `scripts/*.mjs`; deliberately **non-type-aware** (tsc
  stays the type floor; gate stays fast/deterministic).
- First run: **5 findings, all `react-refresh/only-export-components`**
  on the established provider+hook co-location modules (`store.tsx`,
  `router.tsx`, `chrome.tsx`). Resolved by a scoped, documented rule-off
  for exactly those three files — the rule protects dev-HMR fast
  refresh, irrelevant in a singlefile build — keeping it ON for all
  future files. Zero findings from every other rule.
- Wiring: `"lint": "eslint ."`; `verify` = `typecheck && lint && test &&
  build`. First full verify with the stage exits 0.

### 16.3 Live sweeps (both sides, no drift — fifth consecutive)

- Reference (@390×844, Playwright + host-resolver-rules — the
  agent-browser DNS quirk persists): bare 36×36 trigger;
  `NAV.bg-card/80` panel white/80, shadowless, 1px
  `rgba(229,224,220,0.5)` bottom border; rows 14px/500 — active white
  on `rgb(217,110,38)`, inactive muted `rgb(126,111,103)`, 12px radius;
  no dialog semantics; robots allows everything; sitemap 22 statics,
  0 product URLs.
- Clone: dialog contract live-verified (role/aria-modal/label,
  portal-to-body, initial focus search pill, 7×Tab trap + wrap, Escape
  restores trigger); row pins exact + superset Sign in row; served PDP
  head (title = h1, canonical, Product JSON-LD USD); robots 5
  disallows; sitemap 36 URLs; R14-01 live region announcing.
- **Conclusion: no functional or visual gaps on either side.**

### 16.4 Follow-ups executed

- ✅ **R16-01** — ESLint flat config into `verify` (§16.2).
- ✅ **R16-02** — 4 session captures, visually verified post-capture,
  byte-sizes identical to the session-14 set (pixel-parity evidence) →
  `docs/screenshots/`; README Documentation rows extended.

### 16.5 Verification gate (post session-16)

typecheck ✓ · lint ✓ · 95/95 unit ✓ · build 506.59 KB ✓ · 188/188 E2E ✓
— observed after the R16-01 change; docs-only remainder outside every
gate's file set.

### 16.6 Residual risks & follow-up candidates (shrunk by one)

Remaining from the §15.6 list: server-backed auth workstream, optional
PWA manifest. (Closed this session: ESLint flat config.)

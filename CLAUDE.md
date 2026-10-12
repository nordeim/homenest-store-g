# CLAUDE.md — HomeNest Kitchen

This file is read fresh for every conversation. Be brief and practical. The exhaustive rulebook (trap log, parity pins, testing quirks) lives in `AGENTS.md`; the full engineering reference is `Project_Architecture_Document.md`.

## 1. Core Identity

HomeNest Kitchen is a production-grade e-commerce storefront + admin console — a visual and functional clone of `nest-culinary-hub.base44.app` (reference measured live 2026-10-12) implemented as a **client-only SPA**: Vite 7, React 19, TypeScript strict, Tailwind CSS v4 (CSS-first `@theme`), shipped as a single HTML file via `vite-plugin-singlefile`. There is no server: commerce state (cart, wishlist, orders, sessions) persists in browser `localStorage` (`homenest.v2`), with `DATABASE_URL="file:../db/custom.db"` pinned for the repo-root `db/` tooling contract.

## 2. Foundational Principles — The Meticulous Six-Phase Workflow

1. **ANALYZE** — Read the relevant files completely before proposing anything. Check `AGENTS.md` (trap log) and this file first.
2. **PLAN** — Break work into vertical slices: one seam, one test, one implementation. State assumptions explicitly.
3. **VALIDATE** — Confirm the slice is testable: which spec pins it? If none exists, write it first (red → green).
4. **IMPLEMENT** — Smallest change that satisfies the slice without weakening guards.
5. **VERIFY** — Run the full gate: `npm run verify && npm run e2e`. All four stages (typecheck, unit, build, E2E) must exit 0.
6. **DELIVER** — Conventional Commit; update `AGENTS.md`/`README.md`/`Project_Architecture_Document.md` in the same commit when behavior, contracts, or visuals changed.

Non-negotiables:
- Never weaken a trap-log pin to make something pass.
- Never delete or skip a test to ship; fix the underlying issue or flag the debt explicitly.
- Never claim "works" without having run the gate and observed the result.

## 3. Implementation Standards

### TypeScript
- Strict mode; `noUnusedLocals`/`noUnusedParameters` are compile errors — prune imports.
- No `any` (use `unknown` at boundaries), no `ts-ignore`, no commented-out code.
- Named exports for components and helpers; `interface` for object shapes, `type` for unions.

### React 19
- Function components only. State lives in `StoreProvider` (one context) — do not add parallel contexts or external state libs without an ADR.
- Effects: keep them for true I/O (storage persistence, timers, listeners). Derive during render (`useMemo`) instead of syncing state in effects.
- Overlay/menu primitives that need `position: fixed` while the header is `backdrop-blur`-ed MUST be portaled to `document.body` (see AGENTS.md trap #5).

### Tailwind CSS v4
- CSS-first: `@theme` in `src/index.css` is the only token source. No `tailwind.config.js`, ever.
- Colors are full `hsl(...)` literals. Parity-critical computed values are pinned in `tests/e2e/visual-parity.spec.ts` — re-measure after token changes.
- Gradients that need sRGB parity use explicit `linear-gradient(...)` inline styles.

### Data contracts
- Money = integer cents; format only at render (`formatMoney`).
- Validate inputs at the boundary with the helpers in `lib/commerce.ts` (`isEmail`, `isZip`, `isCardNumberValid`, `validateRedirectPath`). Same-origin redirects only.
- Order success views are token-gated: `?order=<number>&token=<guestToken>`; owners see their orders via `userId`.

## 4. Development Workflow

### Environment
```bash
npm install
cp .env.example .env   # already committed as .env in this repo; keep values in sync
npm run dev            # http://localhost:5173
```

### Commands
| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build (single file) | `npm run build` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm run test` / `npm run test:watch` |
| E2E (needs build) | `npm run build && npm run e2e` |
| Everything (pre-push) | `npm run verify && npm run e2e` |

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Customer | `john@example.com` | `Demo1234!` |
| Admin | `admin@homenest.kitchen` | `Admin1234!` |

Demo passwords are stored in plain text inside localStorage by design (client-only demo). Never copy this pattern into a server-backed deployment — see PAD §6.4.

## 5. Testing Strategy

- **Unit (Vitest, node env)**: pure seams only — commerce math, db-path contract, validation. Co-located `*.test.ts` next to the seam, plus `tests/*.test.ts` for repo contracts. 22 tests.
- **E2E (Playwright, production build)**: user-visible behavior through real UI interactions — smoke, mobile navigation, catalog, cart/checkout, auth/admin, visual parity. 82 tests across chromium + mobile (iPhone 14 profile on chromium engine) projects, `workers: 1`.
- **Visual parity gate**: `tests/e2e/visual-parity.spec.ts` asserts computed colors/fonts from the reference measurement. Treat it as a build-breaker.
- Bugs get a failing regression test at the same seam before the fix.

## 6. Code Quality

- The gate is green before every push: `npm run verify && npm run e2e`.
- No `console.log` in committed code; `console.error("[tag]", err)` for caught failures.
- Commit style: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), atomic units, why in the body when non-obvious.
- Docs updated in the same commit as the change they describe.

## 7. Error Handling & Debug

Debug order: reproduce in the browser → read the console → `npm run typecheck` → single unit test → single E2E spec with `npx playwright test <spec> --headed`. For flaky E2E: `trace: "retain-on-failure"` artifacts in `test-results/` (`npx playwright show-trace <zip>`).

Known traps to check first: hydration race (gate on `ready`), stale localStorage (bump `STORAGE_KEY`), strict-mode locator collisions (use `exact: true`), disabled-button clicks, backdrop-filter containing block.

## 8. Communication & Docs

- Explain why, not just what. Tag claims as Verified / Reasoned / Assumed when it matters.
- ADRs live in `Project_Architecture_Document.md` §1.3. New consequential decisions get a new ADR number — append, never renumber.
- Registered divergences from the reference site are listed in PAD §5.6. Superset features must not change the resting visuals of parity surfaces.

## 9. Project-Specific Standards

- **Route structure is a parity surface**: `/product/:id` mirrors the reference; `/products/:slug` remains supported for deep links.
- **Catalog**: the 8 reference products (names, cents prices, ratings, review counts) are pinned exactly; the extra 16 products are the registered superset.
- **Success metrics**: the gate is green; new features ship with tests at the same seam; the trap log grows instead of being worked around; a fresh clone reaches `npm run dev` in under two minutes with zero manual steps.

# Decor Track (ديكور تراك): Angular POC

Front-end-only demo of a project finance tracker for a freelance interior/decor engineer in Egypt
(per-client budget, payments, expenses by category, profit) + a read-only client portal. Arabic, RTL, mobile-first.
No backend: seeded signals store persisted to localStorage; fake auth.

**Read `docs/HANDOVER.md` first** (then PROGRESS, DECISIONS, ASSUMPTIONS in `docs/`).

## Run
- `npm install`, then `npm start` (http://localhost:4200). Build: `npm run build`. Lint: `npx ng lint`.
- Demo logins: `admin@demo.com` / `demo123` (→ /admin), `client@demo.com` / `demo123` (→ /portal).

## Rules of the road
- Angular 22, standalone + signals + zoneless, `@if/@for`, lazy routes, Tailwind v4 (use logical utilities: `ms-/me-/ps-/pe-/start/end`).
- ALL UI strings go in `src/app/core/i18n/strings.ts` (read via `T`). Money: "1,234 ج.م", Western digits; dates dd/MM/yyyy.
- Components talk only to the abstract services in `src/app/core/services/contracts.ts`; mocks live in `core/mock/`, bound in `core/providers.ts`. Never import `DemoStore` in components.
- All totals/definitions (profit = received − spent, etc.) come from `ReportsService`.
- The client portal must NEVER show profit, margins, expense lines or sub-categories.
- Before finishing: `npx ng lint` and `npx ng build` must pass; update `docs/PROGRESS.md`.

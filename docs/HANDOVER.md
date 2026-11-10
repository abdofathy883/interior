# HANDOVER

Read this first. It is written for someone (or a new Claude Code session) with zero context.

## What this is
**Decor Track ("ديكور تراك")**: a front-end-only **proof of concept** for a freelance interior/decor engineer in Egypt. He tracks, per client, the budget, money received (payments), money spent (expenses by category and sub-category) and profit. Clients get a read-only portal showing their own project.
**There is no backend.** Everything is seeded and stored in the browser. UI is Arabic, RTL, mobile-first. Built to be shown to the client, then evolved.

## Install and run
Requirements: Node 20+ (built with Node 24) and npm.
```bash
npm install
npm start          # = ng serve, http://localhost:4200
npm run build      # = ng build, output in dist/interior
npx ng lint        # ESLint (TS + templates)
```
Use a phone-width browser window (or devtools device mode) to see the mobile layout.

## Public deployment (GitHub Pages)
- URL: https://abdofathy883.github.io/interior/ (repo `abdofathy883/interior`, one-time setting: Settings → Pages → Source = **GitHub Actions**).
- `.github/workflows/deploy.yml` builds on every push to `main` with `--base-href /<repo>/`, copies `index.html` to `404.html` (so deep links/refresh work) and publishes `dist/interior/browser`.
- Demo data lives in each visitor's own browser localStorage, so visitors never see each other's entries.

## Demo credentials
| Role | Email | Password | Lands on |
|---|---|---|---|
| Admin | `admin@demo.com` | `demo123` | `/admin` |
| Client | `client@demo.com` | `demo123` | `/portal` (client "أحمد سمير الشناوي", id `c-1`) |

The login page also has one-click "دخول كمدير" / "دخول كعميل" buttons.

## Project structure (`src/app`)
```
app.config.ts / app.routes.ts / app.ts   bootstrap, lazy routes with role guards
core/
  config.ts            feature flags + thresholds (portalShowSpendAmounts, delays, 85/100 %)
  i18n/strings.ts      ALL UI strings (Arabic); `T` is the single language switch
  models/models.ts     domain types (Client, Payment, Expense, Category, SubCategory, ProjectStage, AppUser, report shapes)
  util/                dates.ts (ISO helpers, dd/MM/yyyy), money.ts (1,234,567 ج.م)
  data/seed.ts         deterministic seed generator (dates relative to today)
  data/store.ts        DemoStore: signals + localStorage persistence + reset
  services/contracts.ts  abstract classes = the service "interfaces" (DI tokens)
  mock/                mock implementations of every contract + simulate() delay helper + DemoService
  providers.ts         provideDataServices(): THE place that binds contracts to implementations
  guards.ts            roleGuard / guestGuard / homeGuard
shared/
  ui/                  icon, kpi-card, progress-bar, chart (Chart.js wrapper), toasts, page-header, empty-state, field-error, export-buttons, fake-loading, chart-colors
  pipes/format.pipes.ts  money | num | dmy | pct
  clients-table/       sortable + searchable clients table / mobile cards (used by dashboard & reports)
layout/                admin-shell (sidebar / top bar / bottom nav / FAB / quick-add sheet), portal-shell
features/
  auth/login.page.ts
  admin/dashboard | clients (list + form) | client-report | reports | categories | quick-add
  portal/portal-home | portal-payments | portal-spending
```
Routes: `/login`, `/admin`, `/admin/clients`, `/admin/clients/new`, `/admin/clients/:id`, `/admin/clients/:id/edit`, `/admin/reports`, `/admin/categories`, `/portal`, `/portal/payments`, `/portal/spending`.

## How the mock data layer works
1. `DemoStore` (`core/data/store.ts`) holds seven signals (clients, payments, expenses, categories, subCategories, stages, users).
2. On startup it loads `localStorage["decor-track-demo-v1"]`; if missing/invalid it builds the seed (`buildSeed()` in `core/data/seed.ts`). One `effect()` writes every change back to localStorage.
3. `Mock*Service` classes (`core/mock/`) implement the abstract classes in `core/services/contracts.ts` on top of the store. Writes go through `simulate()` (400 ms delay), then update the store.
4. `MockReportsService` computes all totals (received, spent, profit, remaining, budget used %, monthly series, category/sub-category breakdowns). Components never do their own sums.
5. Session: `localStorage["decor-track-session-v1"]` holds the logged-in user id.

**Reset the demo data:** admin menu → "إعادة ضبط البيانات التجريبية" (sidebar bottom on desktop, "⋮" menu on phones). Manual reset from the console:
```js
localStorage.removeItem('decor-track-demo-v1'); localStorage.removeItem('decor-track-session-v1'); location.reload();
```

## 5-minute demo script
1. **Login (30 s).** Open the app on a phone-sized window. Tap **دخول كمدير**.
2. **Dashboard (60 s).** Point out the KPI cards (budget, received, spent, remaining, profit), the monthly bar chart and the spending doughnut. In the table, sort by "المستهلك" and find **هبة محمود** (95 %, amber bar, negative profit) and **طارق يوسف** (huge "remaining to collect"). Scroll to the ranked sub-category list.
3. **Client report (60 s).** Tap **منى عادل حسين** → KPIs, expand "مصنعية"/"مواد خام" to see sub-categories with %, scroll to payments and the expenses ledger; filter by category + sub-category and show the filtered total. Tap *Export PDF* (fake toast).
4. **Add a client (30 s).** Clients → **إضافة عميل** → submit empty to show Arabic validation → fill (name, phone `01011112222`, location, budget) → save → lands on the new client's report with zeros.
5. **The key moment: quick-add on site (60 s).** Tap the green **+** button (any screen). Pick the new client, type an amount, tap تصنيف "مصنعية" and a sub-category chip ("كهربا"), Save. Toast appears and the form stays ready for the next entry. Switch to the **دفعة مستلمة** tab, add a payment of 150,000 for the same client.
6. **Numbers update (30 s).** Open the new client's report (KPIs changed) and go back to the Dashboard (totals changed).
7. **Client portal (60 s).** Menu → logout → **دخول كعميل**. Show the progress ring, stage timeline, Payments page and the "أوجه الصرف" page (top-level split only). Say out loud: *no profit, no expense lines, read-only.* Try opening `/admin` in the URL: it bounces back to the portal.
8. **(Optional)** Admin menu → reset demo data before the next audience.

## What is fake vs real
| Fake (mock) | Real (behaves for real) |
|---|---|
| Login / sessions / roles (client-side only; passwords are plain constants) | Route guards + role separation in the UI |
| All data: seed, "save" latency, success toasts | Form validation, calculations, filters, sorting, charts |
| Persistence = browser localStorage (per browser/profile) | Reactive updates across screens (single store) |
| PDF / Excel export (toast only) | RTL layout, formatting (digits, currency, dates), responsive design |
| Client portal data isolation (hidden in the UI only) | |

## How to swap the mock services for a real backend
1. For each abstract class in `core/services/contracts.ts` (`AuthService`, `ClientsService`, `PaymentsService`, `ExpensesService`, `CategoriesService`, `ReportsService`) write an HTTP implementation, e.g. `core/http/http-clients.service.ts`.
   - Keep the **read members as signals**: back them with an in-memory cache signal that is filled by `HttpClient` (or `httpResource`) and updated after each write. `getById`, `forClient`, `subsOf` etc. are synchronous lookups on that cache.
   - Writes already return Promises: `firstValueFrom(http.post(...))`, then update the cache.
2. `ReportsService`: either keep computing in the client from the cached lists (simplest; reuse `mock-reports.service.ts` logic) or call report endpoints (`/reports/summary?from=&to=` etc.). Keep the definitions in ASSUMPTIONS.md.
3. In `core/providers.ts` change each `useClass: Mock…` to the new class. Provide `provideHttpClient()` in `app.config.ts`, add an auth interceptor, add error handling (the POC has none).
4. Replace `MockAuthService` with real login (JWT/cookie session); keep `SessionUser { id, email, name, role, clientId? }` as the contract.
5. Delete `DemoStore`, `seed.ts`, `DemoService` and the "reset demo data" menu item (or hide it behind an environment flag).
6. **Security:** the client portal must call **separate, server-filtered endpoints** that only return that client's data and only top-level category totals. Never rely on the UI hiding fields. Enforce role checks on every endpoint.
7. Money: store amounts as integer piasters or decimals on the server; keep EGP as the only currency.

## Suggested next steps
1. Show the demo; get answers to the ⚠ items in ASSUMPTIONS.md (especially: portal amounts vs %, profit definition, stages, receipts/suppliers).
2. Edit/delete for expenses and payments (+ audit trail), duplicate-entry protection.
3. Real backend + auth (see above); decide hosting (Firebase/Supabase/.NET/Node are all fine).
4. Receipt photos on expenses (camera upload from the phone), supplier/worker field.
5. Offline-first quick-add (PWA + queue + sync) for poor site connectivity.
6. Real PDF/Excel export (client statement per project; accountant-friendly Excel).
7. Stage management UI for the owner (update stage status → notify client by WhatsApp/SMS).
8. Payment schedule + reminders for installments; budget-overrun alerts (the 85 %/100 % thresholds already exist).
9. Multiple portal users per client; English UI toggle (strings file is ready); tests (unit for `ReportsService`, e2e for the two demo flows).

## Ready-to-paste context prompt for a new Claude Code session
```
You are continuing work on "Decor Track" (ديكور تراك), an Angular 22 front-end-only proof of concept in this repo:
a project-finance tracker for a freelance interior/decor engineer in Egypt (per-client budget, payments received,
expenses by category/sub-category, profit) plus a read-only client portal. UI is Arabic RTL, Tailwind v4, Chart.js,
standalone components + signals + zoneless, lazy routes. There is NO backend: data is a seeded signals store persisted
to localStorage, accessed only through abstract service classes (src/app/core/services/contracts.ts) implemented by
mocks in src/app/core/mock/ and bound in src/app/core/providers.ts.

First read, in order: CLAUDE.md, docs/HANDOVER.md, docs/PROGRESS.md, docs/DECISIONS.md, docs/ASSUMPTIONS.md.
Rules: keep all UI strings in src/app/core/i18n/strings.ts; use Tailwind logical utilities (ms-/me-/ps-/pe-/start/end);
all money maths go through ReportsService; components never touch DemoStore directly; the client portal must never show
profit, margins, expense lines or sub-categories; after changes run `npx ng lint` and `npx ng build` and update docs/PROGRESS.md.
Demo logins: admin@demo.com / demo123, client@demo.com / demo123.

My task for this session is: <DESCRIBE THE TASK HERE>
```

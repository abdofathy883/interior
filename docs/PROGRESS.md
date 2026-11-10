# PROGRESS

Status as of the end of the initial build (all four phases). `ng build` and `ng lint` pass with no errors.
Paths are relative to the repo root; everything lives under `src/app/`.

## Legend
DONE = works and was exercised in the browser · PARTIAL = works with a caveat · NOT STARTED

## Phase (a) Foundations: DONE
| Item | Status | Where |
|---|---|---|
| Angular 22 scaffold (standalone, signals, zoneless, `@if/@for`, lazy routes) | DONE | `app.config.ts`, `app.routes.ts` |
| Tailwind v4 + Cairo font (self-hosted via `@fontsource-variable/cairo`) + design tokens + component classes (`.btn`, `.input`, `.card`, `.badge`, `.chip`, `.skeleton`...) | DONE | `src/styles.css`, `.postcssrc.json` |
| RTL (`<html lang="ar" dir="rtl">`), logical utilities (`ms-/me-/ps-/pe-/start/end`) | DONE | `src/index.html` |
| Central Arabic strings + single language switch point (`T`) | DONE | `core/i18n/strings.ts` |
| Domain models | DONE | `core/models/models.ts` |
| Deterministic seed (6 clients, 70 expenses, 17 payments, stages, users) | DONE | `core/data/seed.ts` |
| Signals store + localStorage persistence + reset | DONE | `core/data/store.ts` |
| Service contracts (abstract classes as DI tokens) + mock implementations + single swap point | DONE | `core/services/contracts.ts`, `core/mock/*`, `core/providers.ts` |
| Fake auth (admin/client), session in memory + localStorage, role guards, logout | DONE | `core/mock/mock-auth.service.ts`, `core/guards.ts`, `features/auth/login.page.ts` |
| Design-system components: icon, KPI card, progress bar (auto colours at 85/100%), chart wrapper, toasts, empty state, field error, skeleton helper, export buttons, page header, format pipes | DONE | `shared/ui/*`, `shared/pipes/format.pipes.ts` |
| Admin shell (sidebar on desktop, top bar + bottom nav + FAB on mobile) | DONE | `layout/admin-shell.component.ts` |

## Phase (b) Admin screens: DONE
| Screen | Status | File |
|---|---|---|
| Dashboard: 5 KPIs, monthly bar chart, category doughnut, sortable/searchable client table, ranked sub-category totals | DONE | `features/admin/dashboard/dashboard.page.ts` |
| Clients list: search + status filter, cards, edit/report links | DONE | `features/admin/clients/clients.page.ts` |
| Add / edit client form (validation, fake-success save) | DONE | `features/admin/clients/client-form.page.ts` |
| Client report: header, 6 KPIs (+ expected profit), expandable category/sub-category rows + doughnut, payments list + add, expenses ledger with category/sub/date filters + filtered total, fake PDF/Excel export | DONE | `features/admin/client-report/client-report.page.ts` |
| Quick-add expense (FAB, bottom sheet, chips, keeps form ready) | DONE | `features/admin/quick-add/*` |
| Quick-add payment received (same sheet, second tab) | DONE | `features/admin/quick-add/quick-add-forms.component.ts` |
| Categories: view, add category, add sub-category, rename (inline), delete disabled with tooltip when used | DONE | `features/admin/categories/categories.page.ts` |
| All-clients report: date range + presets, KPIs, charts, detailed table, sub-category table, fake exports | DONE | `features/admin/reports/reports.page.ts` |
| Reset demo data | DONE | menu in `layout/admin-shell.component.ts`, `core/mock/demo.service.ts` |

## Phase (c) Client portal: DONE
| Screen | Status | File |
|---|---|---|
| Home: progress ring (% paid), project summary, stage timeline + progress bar | DONE | `features/portal/portal-home.page.ts` |
| Payments list + total paid | DONE | `features/portal/portal-payments.page.ts` |
| Spending overview: top-level category split only (chart + rows) | DONE | `features/portal/portal-spending.page.ts` |
| Portal shell (friendlier header + tabs) | DONE | `layout/portal-shell.component.ts` |

## Phase (d) Polish: DONE (see caveats)
- Responsive pass done at 375px (phone) and 1280px (desktop) in the in-app browser; tables become cards on phones.
- Skeletons on first load of data screens (`shared/ui/fake-loading.ts`), 400 ms simulated save delay.
- Verified by browser run-through: admin login → add client → add payment (from client report, client pre-selected) → quick-add expense → numbers update on client report and dashboard; client login sees only own data; wrong-role URLs redirect.

## Not started / out of scope (by design for the POC)
- Edit or delete an existing expense / payment (only add). Real app needs this.
- Client-user management (creating portal logins); `Client.portalUserId` exists but there is no UI.
- Real PDF/Excel export (buttons only show a toast).
- English UI (strings file is ready for it).
- Unit / e2e tests (`--skip-tests` was used for the POC).
- Dark mode.

## Known bugs and rough edges
- Native `<input type="date">` renders in the browser's own locale (e.g. `mm/dd/yyyy` on an English OS). All app-rendered dates are dd/MM/yyyy.
- `confirm()` (native dialog) is used for reset-demo and category delete confirmations.
- The sidebar "reset demo data" also deletes clients you created; an open report of a deleted client shows a "not found" state.
- Chart.js canvases are not re-created on theme/size changes other than the built-in responsive resize (fine for the POC).
- The `ng serve` first build takes ~15–40 s on a cold start.
- A refresh while the quick-add sheet is open closes it (sheet state is not persisted).

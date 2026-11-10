# DECISIONS

One line of "why" per decision. Revisit any of them freely; most are cheap to change.

## Stack
- **Angular 22 (latest stable at build time), standalone + signals + zoneless, new control flow.** Required by the brief; zoneless is the CLI default, so no `zone.js`.
- **Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`)** with a few component classes in `src/styles.css`. Fast to build a consistent system; logical utilities make RTL trivial.
- **Cairo font self-hosted with `@fontsource-variable/cairo`.** Works offline during a client demo (no Google Fonts dependency); only the Arabic/Latin subsets actually used are downloaded.
- **Chart.js used directly through a ~150-line wrapper (`shared/ui/chart.component.ts`), not `ng2-charts`.** ng2-charts v11 also requires `@angular/cdk`; the wrapper keeps dependencies minimal and tree-shakes to bar + doughnut only.
- **Dependencies total:** `chart.js`, `tailwindcss` (+ postcss plugin), `@fontsource-variable/cairo`, `angular-eslint` (dev). Nothing else.
- **Reactive Forms (not signal forms).** Stable, well understood, good validator support. A tiny `FieldErrorComponent` listens to `control.events` so it stays correct under `OnPush`.
- **ESLint via `angular-eslint`** (CLI no longer ships a linter by default); templates are linted too (a11y rules on).
- **`strict` + `strictTemplates` enabled.** Catches template bugs at build time.
- **Tests skipped (`--skip-tests`).** It is a throw-away-able POC; add tests when it becomes the real product.

## Architecture
- **Service contracts are abstract classes used as DI tokens** (`core/services/contracts.ts`). Components inject `ClientsService`, `ExpensesService`, etc., never the store. Swapping to HTTP = new classes + edit `core/providers.ts` (see HANDOVER).
- **Reads are signals, writes return Promises.** Reads stay synchronous/reactive (works in `computed()`), writes model a network round-trip. A real API implementation can keep a signal cache refreshed by HTTP.
- **One `DemoStore` (signals) seeded on startup and persisted to `localStorage`** under `decor-track-demo-v1` through a single `effect()`. Refresh during a demo never loses entries.
- **`ReportsService` is the only place that computes money figures.** Guarantees the same definitions everywhere (see ASSUMPTIONS). Components never re-implement the sums.
- **Seed is deterministic** (`mulberry32` PRNG with per-client seeds, hand-written payments/extras) and dated relative to *today*, so the demo always looks fresh but is identical each load. Generated expenses are scaled so each client's total spent hits an exact target (that is how the "story" in the numbers is controlled).
- **Lazy-loaded routes everywhere** (`loadComponent`); Chart.js only loads with the first page that has a chart.
- **Quick-add is a global bottom sheet (no route)** opened from a FAB in the admin shell. It is reachable from every admin screen, can be opened pre-filled for a client (client report buttons), and stays out of browser history.
- **Components use inline templates.** Files stay self-contained for a POC; split to `.html` if a template gets unwieldy.
- **Every UI string lives in `core/i18n/strings.ts`** and is read through `T`. English later = add an `EN: Strings` object and change one line.

## Auth and roles
- **Fake auth only:** two seeded users in the store; session = user id in memory + `localStorage`. The password is checked against the seed purely so the form behaves like a real login.
- **Functional route guards by role** (`roleGuard('admin' | 'client')`); wrong role is redirected to its own home, anonymous to `/login`; `/login` redirects away if already signed in; unknown URLs go to the right home.
- **The portal derives "which client" from the session (`user.clientId`)**, never from a URL parameter, so a client cannot even ask for another client's data in this UI.
- **Session user type has no password** (`SessionUser`), so it cannot leak into components.

## Product / UX
- **Money format:** `1,234,567 ج.م` (Western digits via `Intl en-US`, currency after the number). The number is wrapped in a Unicode LTR isolate so minus signs and digits order correctly in an RTL paragraph.
- **Dates stored as `YYYY-MM-DD` strings (local, no timezone), displayed `dd/MM/yyyy`.** Avoids UTC off-by-one bugs and makes the date-range filter a plain string comparison.
- **Quick-add uses chips/segmented buttons instead of dropdowns** for category and sub-category (fewer taps, big touch targets). Client stays a native `<select>` (best mobile picker). Amount input is `type=number inputmode=decimal`, 56 px high, 24 px text.
- **After saving, the form keeps client, category, sub-category and date** and clears amount + note, then refocuses the amount. Repeated entries (same worker, same day) take one number and one tap. The last client used is remembered across openings.
- **Client dropdown lists active clients first.**
- **Saves: 400 ms delay then a toast.** Toasts are top-centre so they never collide with the FAB / bottom nav on a phone.
- **Progress bars auto-colour:** brand green below 85 %, amber 85–100 %, red above 100 % (thresholds in `core/config.ts`).
- **Responsive tables:** desktop `<table>` with sortable headers; below `md` the same data renders as cards with a sort `<select>`. Ledgers/lists are flex rows that work at all sizes.
- **Charts:** monthly received vs spent = grouped bars (x-axis reversed + y-axis on the right so time runs right-to-left in RTL); spending split = doughnut. Palette: brand green, sand/gold, then supporting hues for user-added categories.
- **Delete is disabled with a tooltip for used categories/sub-categories**; unused ones can be deleted (native `confirm()`).
- **Brand name "ديكور تراك" (Decor Track) and the green + sand palette are placeholders** invented for the demo; easy to swap (`strings.ts`, `@theme` in `styles.css`, `public/favicon.svg`).
- **Skeleton loaders on first paint of data screens** (`fakeLoading()`), purely cosmetic, to make the demo feel like it talks to a server.
- **Client portal is deliberately simpler:** warm sand background, large type, ring progress, vertical stage timeline, no tables.

## Client portal privacy
- **Portal pages never render profit, margins, expected profit, individual expense lines or sub-categories.** The spending page only reads the top-level `categoryBreakdown` values (name, amount, %).
- **Amount display on the spending page is a switch:** `APP_CONFIG.portalShowSpendAmounts` in `core/config.ts`. See ASSUMPTIONS (needs the owner's decision).
- **Important:** UI hiding is not security. With a real backend the API must expose a separate, filtered client-portal endpoint (see HANDOVER).

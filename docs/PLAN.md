# Build plan (written before coding)

Front-end-only Angular POC for an interior/decor project finance tracker. Arabic, RTL, mock data only.

## Folder structure (`src/app`)

```
core/
  config.ts                 feature flags (e.g. portalShowSpendAmounts)
  i18n/strings.ts           ALL UI strings (Arabic) + `T` switch point
  models/models.ts          domain types
  util/                     dates.ts, money.ts
  data/seed.ts              deterministic seed (relative to today)
  data/store.ts             DemoStore: signals + localStorage persistence + reset
  services/contracts.ts     abstract classes used as DI tokens (the "interfaces")
  mock/*.ts                 mock implementations (400ms simulated delay on writes)
  providers.ts              provideMockServices() - the ONE place to swap for a real API
  guards.ts                 role guards
shared/
  ui/                       icon, kpi-card, progress, chart, toasts, empty-state, skeleton, field-error, export-buttons, page-header
  pipes/                    money, dmy
  clients-table/            sortable/searchable table (+ mobile cards)
layout/                     admin-shell, portal-shell
features/
  auth/login
  admin/dashboard | clients | client-form | client-report | reports | categories | quick-add (sheet + expense form + payment form)
  portal/home | payments | spending
```

## Routes

| Path | Role | Component |
|---|---|---|
| `/login` | guest | LoginPage |
| `/admin` | admin | Dashboard |
| `/admin/clients` | admin | Clients list |
| `/admin/clients/new`, `/admin/clients/:id/edit` | admin | Client form |
| `/admin/clients/:id` | admin | Client report |
| `/admin/reports` | admin | All-clients report |
| `/admin/categories` | admin | Categories |
| `/portal`, `/portal/payments`, `/portal/spending` | client | Portal pages |

Quick-add (expense / payment) is a bottom-sheet opened from a FAB in the admin shell (no route).

## Phases

1. Scaffold + design system + fake auth + store + seed
2. Admin screens
3. Client portal
4. Polish + responsive pass, build/lint, walk through both demo flows
5. Docs updated at the end of EACH phase (PROGRESS, DECISIONS, ASSUMPTIONS, HANDOVER, /CLAUDE.md)

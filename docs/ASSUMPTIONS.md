# ASSUMPTIONS

Business and client assumptions made while building the POC. **⚠ = confirm with the real client before building the real product.**

## Money definitions (used consistently everywhere via `ReportsService`)
- **Received** = sum of payments for the client.
- **Spent** = sum of expenses for the client.
- **Profit = Received − Spent**, **cash basis**. ⚠ Early in a project profit is naturally small or negative (spending before collecting). The owner may prefer "expected profit" as the headline figure; both are shown (expected profit is the secondary figure on the client report).
- **Remaining to collect = Budget − Received.**
- **Budget used % = Spent / Budget.** ⚠ Above 100 % the bar turns red; 85–100 % amber.
- **Expected profit = Budget − Spent.**
- With a date range (all-clients report) `received / spent / profit` are for the range; `remaining`, `budget used %` and `expected profit` always use all-time figures. ⚠ Confirm this is what the owner expects.
- The money amounts are plain numbers in EGP; decimals are allowed (up to 2 shown). No VAT, no discounts, no multi-currency.
- Budgets are fixed per client; ⚠ no change-orders / budget revisions or "extra work" billing are modelled.

## Client and project model
- One client = one project (a client with two apartments would be two clients). ⚠ Confirm.
- Project type is only `apartment` or `villa`; status is only `active` or `completed`.
- Phone validation: Egyptian mobile, 11 digits starting `010 / 011 / 012 / 015`.
- Project stages are seeded per client with six generic names (تصميم، كهرباء وسباكة، جبس بورد، بلاط وسيراميك، نقاشة، تركيبات وتسليم). ⚠ Real stage list and who updates stage status (owner only, presumably) is to be confirmed. There is no stage-editing UI yet.
- Payments are "installments" received from the client; there is no payment schedule/due-date tracking and no overdue alerts. ⚠ Possible next feature.
- Expenses are not tied to suppliers/workers/invoices/receipt photos. ⚠ Confirm if the owner needs supplier tracking or photo receipts (very likely useful on site).

## Categories
- Two top-level categories seeded: **مصنعية** (labor) and **مواد خام** (raw materials), with the 7 + 7 sub-categories from the brief. ⚠ The owner may want additional top-level categories (transport, permits, design fees…) — the UI already supports adding them.
- A category/sub-category that has any expense cannot be deleted (rename is always allowed).
- Expense categories are shared by all clients.

## Client portal
- The portal user sees **only their own client's** data, read-only.
- Shows project summary, % paid, remaining, stage timeline, payments list, and spending split by **top-level category only**.
- Never shows profit, margin, expected profit, individual expenses or sub-categories.
- ⚠ **Decision needed: show EGP amounts on the spending split, or percentages only?** Amounts let a client subtract them from what they paid and infer the owner's margin. Currently amounts ARE shown (`APP_CONFIG.portalShowSpendAmounts = true` in `core/config.ts`; set `false` for percentages only).
- ⚠ Whether clients should see the **budget** and the **remaining balance** at all (they currently do) is a business choice.
- One portal user per client in the demo; ⚠ a real client may want several logins (spouses) — to confirm.

## Users and access
- Two roles only: admin (the owner) and client. ⚠ Confirm whether staff (site engineer, accountant) need their own limited role later.
- Demo credentials are plain-text constants for demonstration only. Real auth (hashed passwords, sessions/JWT, password reset, invites) is out of scope.

## Locale and formatting
- Arabic UI, RTL; **Western digits (1,234,567)**, currency "ج.م" after the number, **dates dd/MM/yyyy**. ⚠ Confirm the owner is happy with Western (not Arabic-Indic) digits.
- Month names in charts are Arabic Gregorian months.
- The app name "ديكور تراك" and the colours are invented placeholders. ⚠ Use the client's real brand/logo if he has one.

## Demo data
- All names, phone numbers, amounts and notes are fictional. Seed dates are relative to "today" so the demo always has ~6 months of history.
- The story in the numbers: `c-1` أحمد (portal demo client, healthy profit), `c-2` منى (largest villa, strongest profit), `c-3` خالد (completed, fully paid), `c-4` هبة (**95 % of budget used**, under-collected → negative cash profit), `c-5` طارق (**2.5M villa, only 600k collected → 1.9M still to collect**), `c-6` نادين (steady). The completed client's figures are deliberately plain.

## Platform assumptions
- The owner mainly enters expenses on a **phone on site** (hence the FAB + bottom sheet + big controls); desktop is used for review.
- ⚠ Online/offline: the real app probably needs to work with weak site connectivity (queue entries offline, sync later). The POC is fully local, so this was not exercised.
- ⚠ Data volume: a freelancer with ~10–50 clients/year; no pagination/virtualisation was needed.

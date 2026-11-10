import { inject, Injectable } from '@angular/core';
import { DemoStore } from '../data/store';
import {
  CategoryBreakdown,
  ClientSummary,
  DateRange,
  MonthlyPoint,
  SubCategoryTotal,
  Totals,
} from '../models/models';
import { ReportsService } from '../services/contracts';
import { addMonthsToKey, monthKey, monthKeysBetween, todayIso } from '../util/dates';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function inRange(date: string, range?: DateRange): boolean {
  if (!range) return true;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + x.amount, 0);

@Injectable()
export class MockReportsService extends ReportsService {
  private readonly store = inject(DemoStore);

  override summary(clientId: string, range?: DateRange): ClientSummary | undefined {
    const client = this.store.clients().find((c) => c.id === clientId);
    if (!client) return undefined;
    return this.build(client, range);
  }

  override summaries(range?: DateRange): ClientSummary[] {
    return this.store.clients().map((c) => this.build(c, range));
  }

  override totals(range?: DateRange): Totals {
    return this.summaries(range).reduce<Totals>(
      (t, s) => ({
        budget: t.budget + s.budget,
        received: t.received + s.received,
        spent: t.spent + s.spent,
        profit: t.profit + s.profit,
        remaining: t.remaining + s.remaining,
      }),
      { budget: 0, received: 0, spent: 0, profit: 0, remaining: 0 },
    );
  }

  override monthly(range?: DateRange, clientId?: string): MonthlyPoint[] {
    const endKey = monthKey(range?.to ?? todayIso());
    const startKey = range?.from ? monthKey(range.from) : addMonthsToKey(endKey, -5);
    // at most the last 12 months so the chart stays readable
    const finalKeys = monthKeysBetween(startKey, endKey).slice(-12);

    const pays = this.store.payments().filter((p) => (!clientId || p.clientId === clientId) && inRange(p.date, range));
    const exps = this.store.expenses().filter((e) => (!clientId || e.clientId === clientId) && inRange(e.date, range));

    return finalKeys.map((key) => {
      const monthIdx = Number(key.slice(5, 7)) - 1;
      return {
        key,
        label: `${MONTHS_AR[monthIdx]} ${key.slice(2, 4)}`,
        received: sum(pays.filter((p) => monthKey(p.date) === key)),
        spent: sum(exps.filter((e) => monthKey(e.date) === key)),
      };
    });
  }

  override categoryBreakdown(clientId?: string, range?: DateRange): CategoryBreakdown[] {
    const subTotals = this.subCategoryTotals(clientId, range);
    const total = subTotals.reduce((a, s) => a + s.amount, 0);
    return this.store.categories().map((category) => {
      const subs = subTotals.filter((s) => s.category.id === category.id);
      const amount = subs.reduce((a, s) => a + s.amount, 0);
      return { category, amount, pct: total ? (amount / total) * 100 : 0, subs };
    });
  }

  override subCategoryTotals(clientId?: string, range?: DateRange): SubCategoryTotal[] {
    const exps = this.store.expenses().filter((e) => (!clientId || e.clientId === clientId) && inRange(e.date, range));
    const total = sum(exps);
    const cats = this.store.categories();
    const out: SubCategoryTotal[] = [];
    for (const subCategory of this.store.subCategories()) {
      const category = cats.find((c) => c.id === subCategory.categoryId);
      if (!category) continue;
      const amount = sum(exps.filter((e) => e.subCategoryId === subCategory.id));
      out.push({ subCategory, category, amount, pct: total ? (amount / total) * 100 : 0 });
    }
    return out.sort((a, b) => b.amount - a.amount);
  }

  private build(client: ClientSummary['client'], range?: DateRange): ClientSummary {
    const pays = this.store.payments().filter((p) => p.clientId === client.id);
    const exps = this.store.expenses().filter((e) => e.clientId === client.id);
    const received = sum(pays.filter((p) => inRange(p.date, range)));
    const spent = sum(exps.filter((e) => inRange(e.date, range)));
    const allReceived = sum(pays);
    const allSpent = sum(exps);
    return {
      client,
      budget: client.budget,
      received,
      spent,
      profit: received - spent,
      remaining: client.budget - allReceived,
      budgetUsedPct: client.budget ? (allSpent / client.budget) * 100 : 0,
      expectedProfit: client.budget - allSpent,
    };
  }
}

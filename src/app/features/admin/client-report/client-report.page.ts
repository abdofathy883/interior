import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { T } from '../../../core/i18n/strings';
import { CategoriesService, ExpensesService, PaymentsService, ReportsService } from '../../../core/services/contracts';
import { DmyPipe, MoneyPipe, PctPipe } from '../../../shared/pipes/format.pipes';
import { ChartComponent, ChartSeries } from '../../../shared/ui/chart.component';
import { CHART_COLORS } from '../../../shared/ui/chart-colors';
import { fakeLoading } from '../../../shared/ui/fake-loading';
import { IconComponent } from '../../../shared/ui/icon.component';
import { KpiCardComponent } from '../../../shared/ui/kpi-card.component';
import { EmptyStateComponent, ExportButtonsComponent } from '../../../shared/ui/misc.components';
import { ProgressComponent } from '../../../shared/ui/progress-bar.component';
import { QuickAddService } from '../quick-add/quick-add.service';

@Component({
  selector: 'app-client-report',
  imports: [
    RouterLink,
    KpiCardComponent,
    ChartComponent,
    ProgressComponent,
    IconComponent,
    EmptyStateComponent,
    ExportButtonsComponent,
    MoneyPipe,
    PctPipe,
    DmyPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/admin/clients" class="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800">
      <app-icon name="chevron-right" [size]="16" /> {{ t.nav.clients }}
    </a>

    @if (!summary()) {
      <div class="card">
        <app-empty-state [title]="t.clientForm.notFound" icon="users">
          <a routerLink="/admin/clients" class="btn btn-secondary mt-3">{{ t.common.back }}</a>
        </app-empty-state>
      </div>
    } @else if (loading()) {
      <div class="skeleton h-40" aria-busy="true"></div>
      <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="skeleton h-28"></div>
        }
      </div>
      <div class="skeleton mt-4 h-72"></div>
    } @else {
      @let s = summary()!;
      @let c = s.client;

      <!-- header -->
      <section class="card p-4 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-extrabold text-stone-900 sm:text-2xl">{{ c.name }}</h1>
              <span class="badge" [class.badge-green]="c.status === 'active'" [class.badge-stone]="c.status === 'completed'">{{ t.enums.clientStatus[c.status] }}</span>
            </div>
            <ul class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
              <li class="flex items-center gap-1.5"><app-icon name="building" [size]="15" /> {{ t.enums.projectType[c.projectType] }}</li>
              <li class="flex items-center gap-1.5"><app-icon name="pin" [size]="15" /> {{ c.location }}</li>
              <li class="flex items-center gap-1.5" dir="ltr"><app-icon name="phone" [size]="15" /> {{ c.phone }}</li>
              <li class="flex items-center gap-1.5"><app-icon name="calendar" [size]="15" /> {{ c.startDate | dmy }}</li>
            </ul>
          </div>
          <div class="flex flex-wrap gap-2">
            <a [routerLink]="['/admin/clients', c.id, 'edit']" class="btn btn-secondary btn-sm sm:h-10 sm:text-sm"><app-icon name="pencil" [size]="16" /> {{ t.common.edit }}</a>
            <app-export-buttons />
          </div>
        </div>
      </section>

      <!-- KPIs -->
      <section class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="KPIs">
        <app-kpi-card [label]="t.kpi.budget" [value]="s.budget | money" icon="building" />
        <app-kpi-card [label]="t.kpi.received" [value]="s.received | money" icon="arrow-down" tone="good" />
        <app-kpi-card [label]="t.kpi.spent" [value]="s.spent | money" icon="arrow-up" tone="warn" />
        <app-kpi-card
          [label]="t.kpi.profit"
          [value]="s.profit | money"
          icon="trending-up"
          [tone]="s.profit >= 0 ? 'good' : 'bad'"
          [hint]="t.kpi.expectedProfit + ': ' + (s.expectedProfit | money)"
        />
        <app-kpi-card [label]="t.kpi.remaining" [value]="s.remaining | money" icon="wallet" />
        <app-kpi-card
          [label]="t.kpi.budgetUsed"
          [value]="s.budgetUsedPct | pct"
          icon="chart"
          [tone]="s.budgetUsedPct > 100 ? 'bad' : s.budgetUsedPct >= 85 ? 'warn' : 'default'"
          [hint]="s.budgetUsedPct > 100 ? t.kpi.overBudget : s.budgetUsedPct >= 85 ? t.kpi.nearLimit : ''"
        >
          <app-progress class="mt-1" [value]="s.budgetUsedPct" tone="auto" size="md" [label]="t.kpi.budgetUsed" />
        </app-kpi-card>
      </section>

      <!-- category breakdown -->
      <section class="mt-6 grid gap-4 lg:grid-cols-5">
        <div class="card p-4 sm:p-5 lg:col-span-3">
          <h2 class="mb-3 font-extrabold text-stone-900">{{ t.report.byCategory }}</h2>
          @if (s.spent === 0) {
            <app-empty-state [title]="t.report.noSpend" />
          } @else {
            <ul class="space-y-2">
              @for (b of breakdown(); track b.category.id; let i = $index) {
                <li class="overflow-hidden rounded-xl border border-stone-200">
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 p-3.5 text-start hover:bg-stone-50"
                    [attr.aria-expanded]="isOpen(b.category.id)"
                    (click)="toggle(b.category.id)"
                  >
                    <span class="inline-block size-3 shrink-0 rounded-full" [style.background-color]="color(i)"></span>
                    <span class="min-w-0 flex-1">
                      <span class="flex items-baseline justify-between gap-2">
                        <span class="font-bold text-stone-900">{{ b.category.name }}</span>
                        <span class="tabular font-bold">{{ b.amount | money }}</span>
                      </span>
                      <span class="mt-1.5 flex items-center gap-2">
                        <app-progress class="flex-1" [value]="b.pct" size="sm" [label]="b.category.name" />
                        <span class="tabular w-10 text-xs font-semibold text-stone-500">{{ b.pct | pct }}</span>
                      </span>
                    </span>
                    <app-icon name="chevron-down" [size]="18" class="text-stone-400 transition" [class.rotate-180]="isOpen(b.category.id)" />
                  </button>
                  @if (isOpen(b.category.id)) {
                    <div class="anim-fade border-t border-stone-100 bg-stone-50/60 px-3.5 py-2">
                      <p class="py-1 text-xs font-semibold text-stone-500">{{ t.report.subcategories }}</p>
                      @for (sub of b.subs; track sub.subCategory.id) {
                        <div class="flex items-center justify-between gap-3 border-b border-stone-100 py-2.5 text-sm last:border-0">
                          <span class="text-stone-700" [class.text-stone-400]="sub.amount === 0">{{ sub.subCategory.name }}</span>
                          <span class="flex items-center gap-3">
                            <span class="tabular text-xs text-stone-500">{{ sub.pct | pct: 1 }}</span>
                            <span class="tabular w-28 text-end font-bold" [class.text-stone-400]="sub.amount === 0">{{ sub.amount | money }}</span>
                          </span>
                        </div>
                      }
                    </div>
                  }
                </li>
              }
            </ul>
            <p class="mt-3 text-xs text-stone-500">{{ t.report.ofSpent }}: <span class="tabular font-bold">{{ s.spent | money }}</span></p>
          }
        </div>
        <div class="card p-4 sm:p-5 lg:col-span-2">
          @if (s.spent > 0) {
            <app-chart type="doughnut" [labels]="categoryLabels()" [series]="categorySeries()" [height]="260" [ariaLabel]="t.report.chartAria" />
          } @else {
            <app-empty-state [title]="t.report.noSpend" icon="chart" />
          }
        </div>
      </section>

      <!-- payments -->
      <section class="mt-6">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="font-extrabold text-stone-900">{{ t.report.payments }}</h2>
          <button type="button" class="btn btn-primary btn-sm sm:h-10 sm:text-sm" (click)="quick.open('payment', c.id)">
            <app-icon name="plus" [size]="16" /> {{ t.report.addPayment }}
          </button>
        </div>
        <div class="card">
          @if (payments().length === 0) {
            <app-empty-state [title]="t.report.noPayments" [hint]="t.report.noPaymentsHint" icon="wallet" />
          } @else {
            <ul class="divide-y divide-stone-100">
              @for (p of payments(); track p.id) {
                <li class="flex items-center gap-3 p-3.5 sm:p-4">
                  <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><app-icon name="arrow-down" [size]="18" /></span>
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-stone-900">{{ p.note || t.report.payments }}</div>
                    <div class="text-xs text-stone-500">{{ p.date | dmy }}</div>
                  </div>
                  <div class="tabular font-extrabold text-emerald-700">{{ p.amount | money }}</div>
                </li>
              }
            </ul>
            <div class="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-3 text-sm">
              <span class="font-semibold text-stone-600">{{ t.report.paymentsTotal }}</span>
              <span class="tabular font-extrabold text-stone-900">{{ s.received | money }}</span>
            </div>
          }
        </div>
      </section>

      <!-- expenses ledger -->
      <section class="mt-6">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="font-extrabold text-stone-900">{{ t.report.ledger }}</h2>
          <button type="button" class="btn btn-primary btn-sm sm:h-10 sm:text-sm" (click)="quick.open('expense', c.id)">
            <app-icon name="plus" [size]="16" /> {{ t.report.addExpense }}
          </button>
        </div>

        <div class="card">
          <div class="grid grid-cols-2 gap-3 border-b border-stone-200 p-4 lg:grid-cols-5">
            <div>
              <label class="label" for="f-cat">{{ t.report.category }}</label>
              <select id="f-cat" class="input h-11" [value]="fCat()" (change)="setCat($any($event.target).value)">
                <option value="" [selected]="fCat() === ''">{{ t.report.allCategories }}</option>
                @for (cat of cats.categories(); track cat.id) {
                  <option [value]="cat.id" [selected]="fCat() === cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="f-sub">{{ t.report.subCategory }}</label>
              <select id="f-sub" class="input h-11" [value]="fSub()" (change)="fSub.set($any($event.target).value)">
                <option value="" [selected]="fSub() === ''">{{ t.report.allSubs }}</option>
                @for (sub of subOptions(); track sub.id) {
                  <option [value]="sub.id" [selected]="fSub() === sub.id">{{ sub.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="f-from">{{ t.common.from }}</label>
              <input id="f-from" type="date" class="input h-11" [value]="fFrom()" (change)="fFrom.set($any($event.target).value)" />
            </div>
            <div>
              <label class="label" for="f-to">{{ t.common.to }}</label>
              <input id="f-to" type="date" class="input h-11" [value]="fTo()" (change)="fTo.set($any($event.target).value)" />
            </div>
            <div class="col-span-2 flex items-end lg:col-span-1">
              <button type="button" class="btn btn-ghost h-11 w-full" [disabled]="!hasFilters()" (click)="clearFilters()">
                <app-icon name="x" [size]="16" /> {{ t.common.reset }}
              </button>
            </div>
          </div>

          @if (filtered().length === 0) {
            <app-empty-state [title]="t.report.noExpenses" [hint]="t.report.noExpensesHint" icon="inbox" />
          } @else {
            <ul class="divide-y divide-stone-100">
              @for (e of filtered(); track e.id) {
                <li class="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
                  <div class="w-[4.5rem] shrink-0 text-xs font-semibold text-stone-500 sm:w-24 sm:text-sm">{{ e.date | dmy }}</div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span class="font-bold text-stone-900">{{ cats.subCategoryName(e.subCategoryId) }}</span>
                      <span class="badge badge-stone">{{ cats.categoryName(e.categoryId) }}</span>
                    </div>
                    @if (e.note) {
                      <div class="truncate text-sm text-stone-500">{{ e.note }}</div>
                    }
                  </div>
                  <div class="tabular shrink-0 font-extrabold text-stone-900">{{ e.amount | money }}</div>
                </li>
              }
            </ul>
          }
          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <span class="font-semibold text-stone-600">
              {{ t.report.filteredTotal }}
              <span class="text-xs font-normal text-stone-500">({{ t.report.expensesCount }}: {{ filtered().length }})</span>
            </span>
            <span class="tabular text-base font-extrabold text-stone-900">{{ filteredTotal() | money }}</span>
          </div>
        </div>
      </section>
    }
  `,
})
export class ClientReportPage {
  /** Route param `:id`. */
  readonly id = input.required<string>();

  private readonly reports = inject(ReportsService);
  private readonly paymentsSvc = inject(PaymentsService);
  private readonly expensesSvc = inject(ExpensesService);
  protected readonly cats = inject(CategoriesService);
  protected readonly quick = inject(QuickAddService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(350);

  protected readonly summary = computed(() => this.reports.summary(this.id()));
  protected readonly breakdown = computed(() => this.reports.categoryBreakdown(this.id()));
  protected readonly payments = computed(() => this.paymentsSvc.forClient(this.id()));
  private readonly allExpenses = computed(() => this.expensesSvc.forClient(this.id()));

  protected readonly categoryLabels = computed(() => this.breakdown().map((b) => b.category.name));
  protected readonly categorySeries = computed<ChartSeries[]>(() => [
    { label: T.kpi.spent, data: this.breakdown().map((b) => b.amount), color: CHART_COLORS.slice(0, this.breakdown().length) },
  ]);
  protected color(i: number): string {
    return CHART_COLORS[i % CHART_COLORS.length];
  }

  // ----- expandable categories
  private readonly open = signal<Record<string, boolean>>({});
  protected isOpen(id: string): boolean {
    return !!this.open()[id];
  }
  protected toggle(id: string): void {
    this.open.update((o) => ({ ...o, [id]: !o[id] }));
  }

  // ----- ledger filters
  protected readonly fCat = signal('');
  protected readonly fSub = signal('');
  protected readonly fFrom = signal('');
  protected readonly fTo = signal('');

  protected readonly subOptions = computed(() => (this.fCat() ? this.cats.subsOf(this.fCat()) : this.cats.subCategories()));
  protected readonly hasFilters = computed(() => !!(this.fCat() || this.fSub() || this.fFrom() || this.fTo()));
  protected readonly filtered = computed(() => {
    const cat = this.fCat();
    const sub = this.fSub();
    const from = this.fFrom();
    const to = this.fTo();
    return this.allExpenses().filter(
      (e) => (!cat || e.categoryId === cat) && (!sub || e.subCategoryId === sub) && (!from || e.date >= from) && (!to || e.date <= to),
    );
  });
  protected readonly filteredTotal = computed(() => this.filtered().reduce((a, e) => a + e.amount, 0));

  protected setCat(id: string): void {
    this.fCat.set(id);
    this.fSub.set('');
  }

  protected clearFilters(): void {
    this.fCat.set('');
    this.fSub.set('');
    this.fFrom.set('');
    this.fTo.set('');
  }
}

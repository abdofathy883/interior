import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { T } from '../../../core/i18n/strings';
import { ReportsService } from '../../../core/services/contracts';
import { ClientsTableComponent } from '../../../shared/clients-table/clients-table.component';
import { MoneyPipe, PctPipe } from '../../../shared/pipes/format.pipes';
import { ChartComponent, ChartSeries } from '../../../shared/ui/chart.component';
import { fakeLoading } from '../../../shared/ui/fake-loading';
import { IconComponent } from '../../../shared/ui/icon.component';
import { KpiCardComponent } from '../../../shared/ui/kpi-card.component';
import { EmptyStateComponent, PageHeaderComponent } from '../../../shared/ui/misc.components';
import { ProgressComponent } from '../../../shared/ui/progress-bar.component';
import { CHART_COLORS } from '../../../shared/ui/chart-colors';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    PageHeaderComponent,
    KpiCardComponent,
    ChartComponent,
    ClientsTableComponent,
    ProgressComponent,
    EmptyStateComponent,
    IconComponent,
    MoneyPipe,
    PctPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="t.dashboard.title" [subtitle]="t.dashboard.subtitle">
      <a routerLink="/admin/clients" class="btn btn-secondary">
        <app-icon name="users" [size]="18" /> {{ t.dashboard.viewAll }}
      </a>
    </app-page-header>

    @if (loading()) {
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" aria-busy="true" aria-label="{{ t.common.loading }}">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="skeleton h-28"></div>
        }
        <div class="skeleton col-span-2 h-28 lg:col-span-1"></div>
      </div>
      <div class="mt-4 grid gap-4 lg:grid-cols-5">
        <div class="skeleton h-80 lg:col-span-3"></div>
        <div class="skeleton h-80 lg:col-span-2"></div>
      </div>
      <div class="skeleton mt-4 h-72"></div>
    } @else {
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" aria-label="KPIs">
        <app-kpi-card [label]="t.kpi.totalBudget" [value]="totals().budget | money" icon="building" />
        <app-kpi-card [label]="t.kpi.totalReceived" [value]="totals().received | money" icon="arrow-down" tone="good" />
        <app-kpi-card [label]="t.kpi.totalSpent" [value]="totals().spent | money" icon="arrow-up" tone="warn" />
        <app-kpi-card [label]="t.kpi.totalRemaining" [value]="totals().remaining | money" icon="wallet" />
        <app-kpi-card
          class="col-span-2 lg:col-span-1"
          [label]="t.kpi.totalProfit"
          [value]="totals().profit | money"
          icon="trending-up"
          [tone]="totals().profit >= 0 ? 'good' : 'bad'"
        />
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-5">
        <div class="card p-4 sm:p-5 lg:col-span-3">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-extrabold text-stone-900">{{ t.dashboard.monthlyChart }}</h2>
            <span class="badge badge-stone">{{ t.dashboard.last6 }}</span>
          </div>
          <app-chart type="bar" [labels]="monthlyLabels()" [series]="monthlySeries()" [height]="280" [ariaLabel]="t.dashboard.monthlyChartAria" />
        </div>
        <div class="card p-4 sm:p-5 lg:col-span-2">
          <h2 class="mb-3 font-extrabold text-stone-900">{{ t.dashboard.categoryChart }}</h2>
          @if (spentTotal() > 0) {
            <app-chart type="doughnut" [labels]="categoryLabels()" [series]="categorySeries()" [height]="280" [ariaLabel]="t.dashboard.categoryChartAria" />
          } @else {
            <app-empty-state [title]="t.report.noSpend" />
          }
        </div>
      </section>

      <section class="mt-6">
        <h2 class="mb-3 font-extrabold text-stone-900">{{ t.dashboard.clientsTable }}</h2>
        <app-clients-table [data]="summaries()" />
      </section>

      <section class="mt-6">
        <div class="mb-3">
          <h2 class="font-extrabold text-stone-900">{{ t.dashboard.subTotals }}</h2>
          <p class="text-xs text-stone-500">{{ t.dashboard.subTotalsHint }}</p>
        </div>
        <div class="card divide-y divide-stone-100">
          @for (s of visibleSubs(); track s.subCategory.id; let i = $index) {
            <div class="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
              <span class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-extrabold text-stone-600">{{ i + 1 }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2">
                  <span class="font-bold text-stone-900">{{ s.subCategory.name }}</span>
                  <span class="badge" [class.badge-brand]="s.category.id === firstCategoryId()" [class.badge-amber]="s.category.id !== firstCategoryId()">{{ s.category.name }}</span>
                </div>
                <app-progress class="mt-2" [value]="s.pct * 100 / maxPct()" size="sm" [label]="s.subCategory.name" />
              </div>
              <div class="text-end">
                <div class="tabular font-bold text-stone-900">{{ s.amount | money }}</div>
                <div class="tabular text-xs text-stone-500">{{ s.pct | pct: 1 }}</div>
              </div>
            </div>
          }
          @if (allSubs().length > 8) {
            <button type="button" class="flex h-12 w-full items-center justify-center gap-2 text-sm font-bold text-brand-700 hover:bg-stone-50" (click)="showAllSubs.set(!showAllSubs())">
              <app-icon name="chevron-down" [size]="16" [class.rotate-180]="showAllSubs()" />
              {{ showAllSubs() ? t.common.close : t.common.all + ' (' + allSubs().length + ')' }}
            </button>
          }
        </div>
      </section>
    }
  `,
})
export class DashboardPage {
  private readonly reports = inject(ReportsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading();
  protected readonly showAllSubs = signal(false);

  protected readonly totals = computed(() => this.reports.totals());
  protected readonly summaries = computed(() => this.reports.summaries());
  protected readonly spentTotal = computed(() => this.totals().spent);

  private readonly monthly = computed(() => this.reports.monthly());
  protected readonly monthlyLabels = computed(() => this.monthly().map((m) => m.label));
  protected readonly monthlySeries = computed<ChartSeries[]>(() => [
    { label: T.kpi.received, data: this.monthly().map((m) => m.received), color: CHART_COLORS[0] },
    { label: T.kpi.spent, data: this.monthly().map((m) => m.spent), color: CHART_COLORS[1] },
  ]);

  private readonly breakdown = computed(() => this.reports.categoryBreakdown());
  protected readonly categoryLabels = computed(() => this.breakdown().map((b) => b.category.name));
  protected readonly categorySeries = computed<ChartSeries[]>(() => [
    { label: T.kpi.spent, data: this.breakdown().map((b) => b.amount), color: CHART_COLORS.slice(0, this.breakdown().length) },
  ]);
  protected readonly firstCategoryId = computed(() => this.breakdown()[0]?.category.id ?? '');

  protected readonly allSubs = computed(() => this.reports.subCategoryTotals().filter((s) => s.amount > 0));
  protected readonly visibleSubs = computed(() => (this.showAllSubs() ? this.allSubs() : this.allSubs().slice(0, 8)));
  protected readonly maxPct = computed(() => Math.max(1, ...this.allSubs().map((s) => s.pct)));
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { T } from '../../../core/i18n/strings';
import { DateRange } from '../../../core/models/models';
import { ReportsService } from '../../../core/services/contracts';
import { addDays, todayIso } from '../../../core/util/dates';
import { ClientsTableComponent } from '../../../shared/clients-table/clients-table.component';
import { MoneyPipe, PctPipe } from '../../../shared/pipes/format.pipes';
import { ChartComponent, ChartSeries } from '../../../shared/ui/chart.component';
import { CHART_COLORS } from '../../../shared/ui/chart-colors';
import { fakeLoading } from '../../../shared/ui/fake-loading';
import { IconComponent } from '../../../shared/ui/icon.component';
import { KpiCardComponent } from '../../../shared/ui/kpi-card.component';
import { EmptyStateComponent, ExportButtonsComponent, PageHeaderComponent } from '../../../shared/ui/misc.components';

type Preset = 'last30' | 'last90' | 'thisYear' | 'all';

@Component({
  selector: 'app-reports-page',
  imports: [PageHeaderComponent, ExportButtonsComponent, KpiCardComponent, ChartComponent, ClientsTableComponent, EmptyStateComponent, IconComponent, MoneyPipe, PctPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="t.reports.title" [subtitle]="t.reports.subtitle">
      <app-export-buttons />
    </app-page-header>

    <section class="card mb-4 p-4">
      <h2 class="mb-3 text-sm font-extrabold text-stone-700">{{ t.reports.range }}</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <label class="label" for="r-from">{{ t.common.from }}</label>
          <input id="r-from" type="date" class="input h-11" [value]="from()" (change)="setFrom($any($event.target).value)" />
        </div>
        <div>
          <label class="label" for="r-to">{{ t.common.to }}</label>
          <input id="r-to" type="date" class="input h-11" [value]="to()" (change)="setTo($any($event.target).value)" />
        </div>
        <div class="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-1">
          @for (p of presets; track p.key) {
            <button type="button" class="chip" [attr.aria-pressed]="preset() === p.key" (click)="applyPreset(p.key)">{{ p.label }}</button>
          }
        </div>
      </div>
      <p class="mt-3 flex items-start gap-2 text-xs text-stone-500">
        <app-icon name="info" [size]="14" class="mt-0.5" /> {{ t.reports.rangeNote }}
      </p>
    </section>

    @if (loading()) {
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" aria-busy="true">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="skeleton h-28"></div>
        }
        <div class="skeleton col-span-2 h-28 lg:col-span-1"></div>
      </div>
      <div class="skeleton mt-4 h-72"></div>
    } @else {
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" aria-label="KPIs">
        <app-kpi-card [label]="t.kpi.totalBudget" [value]="totals().budget | money" icon="building" />
        <app-kpi-card [label]="t.kpi.totalReceived" [value]="totals().received | money" icon="arrow-down" tone="good" />
        <app-kpi-card [label]="t.kpi.totalSpent" [value]="totals().spent | money" icon="arrow-up" tone="warn" />
        <app-kpi-card [label]="t.kpi.totalRemaining" [value]="totals().remaining | money" icon="wallet" />
        <app-kpi-card class="col-span-2 lg:col-span-1" [label]="t.kpi.totalProfit" [value]="totals().profit | money" icon="trending-up" [tone]="totals().profit >= 0 ? 'good' : 'bad'" />
      </section>

      <section class="mt-4 grid gap-4 lg:grid-cols-5">
        <div class="card p-4 sm:p-5 lg:col-span-3">
          <h2 class="mb-3 font-extrabold text-stone-900">{{ t.reports.monthly }}</h2>
          <app-chart type="bar" [labels]="monthlyLabels()" [series]="monthlySeries()" [height]="260" [ariaLabel]="t.dashboard.monthlyChartAria" />
        </div>
        <div class="card p-4 sm:p-5 lg:col-span-2">
          <h2 class="mb-3 font-extrabold text-stone-900">{{ t.reports.categories }}</h2>
          @if (totals().spent > 0) {
            <app-chart type="doughnut" [labels]="categoryLabels()" [series]="categorySeries()" [height]="260" [ariaLabel]="t.dashboard.categoryChartAria" />
          } @else {
            <app-empty-state [title]="t.report.noSpend" icon="chart" />
          }
        </div>
      </section>

      <section class="mt-6">
        <h2 class="mb-3 font-extrabold text-stone-900">{{ t.dashboard.clientsTable }}</h2>
        <app-clients-table [data]="summaries()" [detailed]="true" />
      </section>

      <section class="mt-6">
        <h2 class="mb-3 font-extrabold text-stone-900">{{ t.dashboard.subTotals }}</h2>
        <div class="card overflow-x-auto">
          <table class="w-full min-w-[420px] border-collapse">
            <thead class="bg-stone-50">
              <tr>
                <th class="table-th" scope="col">{{ t.report.subCategory }}</th>
                <th class="table-th" scope="col">{{ t.report.category }}</th>
                <th class="table-th" scope="col">{{ t.common.amount }}</th>
                <th class="table-th" scope="col">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (s of subTotals(); track s.subCategory.id) {
                <tr>
                  <td class="table-td font-bold text-stone-900">{{ s.subCategory.name }}</td>
                  <td class="table-td"><span class="badge badge-stone">{{ s.category.name }}</span></td>
                  <td class="table-td tabular font-semibold">{{ s.amount | money }}</td>
                  <td class="table-td tabular">{{ s.pct | pct: 1 }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class ReportsPage {
  private readonly reports = inject(ReportsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(350);

  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly preset = signal<Preset | ''>('all');

  protected readonly presets: { key: Preset; label: string }[] = [
    { key: 'last30', label: T.reports.last30 },
    { key: 'last90', label: T.reports.last90 },
    { key: 'thisYear', label: T.reports.thisYear },
    { key: 'all', label: T.reports.allTime },
  ];

  private readonly range = computed<DateRange>(() => ({ from: this.from() || undefined, to: this.to() || undefined }));

  protected readonly totals = computed(() => this.reports.totals(this.range()));
  protected readonly summaries = computed(() => this.reports.summaries(this.range()));
  protected readonly subTotals = computed(() => this.reports.subCategoryTotals(undefined, this.range()).filter((s) => s.amount > 0));

  private readonly monthly = computed(() => this.reports.monthly(this.range()));
  protected readonly monthlyLabels = computed(() => this.monthly().map((m) => m.label));
  protected readonly monthlySeries = computed<ChartSeries[]>(() => [
    { label: T.kpi.received, data: this.monthly().map((m) => m.received), color: CHART_COLORS[0] },
    { label: T.kpi.spent, data: this.monthly().map((m) => m.spent), color: CHART_COLORS[1] },
  ]);

  private readonly breakdown = computed(() => this.reports.categoryBreakdown(undefined, this.range()));
  protected readonly categoryLabels = computed(() => this.breakdown().map((b) => b.category.name));
  protected readonly categorySeries = computed<ChartSeries[]>(() => [
    { label: T.kpi.spent, data: this.breakdown().map((b) => b.amount), color: CHART_COLORS.slice(0, this.breakdown().length) },
  ]);

  protected setFrom(v: string): void {
    this.from.set(v);
    this.preset.set('');
  }
  protected setTo(v: string): void {
    this.to.set(v);
    this.preset.set('');
  }

  protected applyPreset(p: Preset): void {
    const today = todayIso();
    this.preset.set(p);
    switch (p) {
      case 'last30':
        this.from.set(addDays(today, -30));
        this.to.set(today);
        break;
      case 'last90':
        this.from.set(addDays(today, -90));
        this.to.set(today);
        break;
      case 'thisYear':
        this.from.set(`${today.slice(0, 4)}-01-01`);
        this.to.set(today);
        break;
      case 'all':
        this.from.set('');
        this.to.set('');
        break;
    }
  }
}

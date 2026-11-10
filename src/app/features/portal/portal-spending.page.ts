import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { APP_CONFIG } from '../../core/config';
import { T } from '../../core/i18n/strings';
import { AuthService, ReportsService } from '../../core/services/contracts';
import { MoneyPipe, PctPipe } from '../../shared/pipes/format.pipes';
import { CHART_COLORS } from '../../shared/ui/chart-colors';
import { ChartComponent, ChartSeries } from '../../shared/ui/chart.component';
import { fakeLoading } from '../../shared/ui/fake-loading';
import { EmptyStateComponent } from '../../shared/ui/misc.components';
import { ProgressComponent } from '../../shared/ui/progress-bar.component';

/**
 * Client portal spending overview: TOP-LEVEL category split only.
 * Deliberately no profit, no margins, no sub-categories, no individual expense lines.
 */
@Component({
  selector: 'app-portal-spending',
  imports: [ChartComponent, ProgressComponent, EmptyStateComponent, MoneyPipe, PctPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-xl font-extrabold text-stone-900">{{ t.portal.spendingTitle }}</h1>
    <p class="mb-5 text-sm text-stone-500">{{ t.portal.spendingSubtitle }}</p>

    @if (loading()) {
      <div class="skeleton h-80" aria-busy="true"></div>
    } @else if (total() === 0) {
      <div class="card"><app-empty-state [title]="t.portal.spendingEmpty" icon="chart" /></div>
    } @else {
      <div class="card p-5 sm:p-6">
        <app-chart type="doughnut" [labels]="labels()" [series]="series()" [height]="260" [ariaLabel]="t.portal.spendingChartAria" />
      </div>

      <ul class="mt-4 space-y-3">
        @for (b of rows(); track b.category.id; let i = $index) {
          <li class="card p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2 font-bold text-stone-900">
                <span class="inline-block size-3 rounded-full" [style.background-color]="color(i)"></span>
                {{ b.category.name }}
              </span>
              <span class="flex items-baseline gap-2">
                @if (showAmounts) {
                  <span class="tabular font-extrabold text-stone-900">{{ b.amount | money }}</span>
                }
                <span class="tabular text-sm font-bold text-brand-700">{{ b.pct | pct }}</span>
              </span>
            </div>
            <app-progress class="mt-3" [value]="b.pct" size="md" [label]="b.category.name" />
          </li>
        }
      </ul>
    }
  `,
})
export class PortalSpendingPage {
  private readonly auth = inject(AuthService);
  private readonly reports = inject(ReportsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(350);
  protected readonly showAmounts = APP_CONFIG.portalShowSpendAmounts;

  /** Only top-level categories are used from the breakdown (sub-category data is never read here). */
  protected readonly rows = computed(() => {
    const id = this.auth.user()?.clientId;
    return id ? this.reports.categoryBreakdown(id).map((b) => ({ category: b.category, amount: b.amount, pct: b.pct })) : [];
  });
  protected readonly total = computed(() => this.rows().reduce((a, r) => a + r.amount, 0));
  protected readonly labels = computed(() => this.rows().map((r) => r.category.name));
  protected readonly series = computed<ChartSeries[]>(() => [
    { label: T.portal.spendingTitle, data: this.rows().map((r) => r.amount), color: CHART_COLORS.slice(0, this.rows().length) },
  ]);
  protected color(i: number): string {
    return CHART_COLORS[i % CHART_COLORS.length];
  }
}

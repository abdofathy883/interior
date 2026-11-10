import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { formatCompact, formatMoney } from '../../core/util/money';

Chart.register(BarController, BarElement, ArcElement, DoughnutController, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.font.family = "'Cairo Variable', 'Cairo', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#57534e';

export interface ChartSeries {
  label: string;
  data: number[];
  color: string | string[];
}

/**
 * Thin Chart.js wrapper (bar + doughnut) configured for RTL and EGP tooltips.
 * Used instead of ng2-charts to keep the dependency list minimal.
 */
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full" [style.height.px]="height()">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
  `,
  host: { class: 'block w-full' },
})
export class ChartComponent implements OnDestroy {
  readonly type = input.required<'bar' | 'doughnut'>();
  readonly labels = input.required<string[]>();
  readonly series = input.required<ChartSeries[]>();
  readonly height = input(260);
  readonly ariaLabel = input('');
  readonly legend = input(true);

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const type = this.type();
      const labels = this.labels();
      const series = this.series();
      const showLegend = this.legend();
      if (!el) return;

      const config = this.buildConfig(type, labels, series, showLegend);
      this.chart?.destroy();
      this.chart = new Chart(el, config as ChartConfiguration);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private buildConfig(
    type: 'bar' | 'doughnut',
    labels: string[],
    series: ChartSeries[],
    showLegend: boolean,
  ): ChartConfiguration<'bar'> | ChartConfiguration<'doughnut'> {
    const legend = {
      display: showLegend,
      position: 'bottom' as const,
      rtl: true,
      labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 8 },
    };

    if (type === 'bar') {
      return {
        type: 'bar',
        data: {
          labels,
          datasets: series.map((s) => ({
            label: s.label,
            data: s.data,
            backgroundColor: s.color as string,
            borderRadius: 6,
            maxBarThickness: 28,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 500 },
          scales: {
            x: { reverse: true, grid: { display: false } },
            y: {
              position: 'right',
              beginAtZero: true,
              grid: { color: '#e7e5e4' },
              ticks: { callback: (v) => formatCompact(Number(v)) },
            },
          },
          plugins: {
            legend,
            tooltip: {
              rtl: true,
              textDirection: 'rtl',
              callbacks: { label: (c) => ` ${c.dataset.label}: ${formatMoney(Number(c.parsed.y))}` },
            },
          },
        },
      };
    }

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: series.map((s) => ({
          label: s.label,
          data: s.data,
          backgroundColor: s.color as string[],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 6,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '64%',
        animation: { duration: 500 },
        plugins: {
          legend,
          tooltip: {
            rtl: true,
            textDirection: 'rtl',
            callbacks: { label: (c) => ` ${c.label}: ${formatMoney(Number(c.parsed))}` },
          },
        },
      },
    };
  }
}

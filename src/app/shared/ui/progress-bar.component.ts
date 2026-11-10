import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { APP_CONFIG } from '../../core/config';

export type Tone = 'brand' | 'warn' | 'danger';

export function budgetTone(pct: number): Tone {
  if (pct > APP_CONFIG.budgetOverPct) return 'danger';
  if (pct >= APP_CONFIG.budgetWarnPct) return 'warn';
  return 'brand';
}

/** Horizontal progress bar. With `auto` the colour follows the 85% / 100% budget thresholds. */
@Component({
  selector: 'app-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full overflow-hidden rounded-full bg-stone-200"
      [class]="heightClass()"
      role="progressbar"
      [attr.aria-valuenow]="clamped()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-label]="label()"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        [class.bg-brand-600]="resolvedTone() === 'brand'"
        [class.bg-amber-500]="resolvedTone() === 'warn'"
        [class.bg-rose-500]="resolvedTone() === 'danger'"
        [style.width.%]="clamped()"
      ></div>
    </div>
  `,
  host: { class: 'block w-full' },
})
export class ProgressComponent {
  readonly value = input.required<number>();
  readonly label = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** auto = colour by budget thresholds */
  readonly tone = input<Tone | 'auto'>('brand');

  protected readonly heightClass = computed(() => ({ sm: 'h-1.5', md: 'h-2', lg: 'h-3' })[this.size()]);
  protected readonly clamped = computed(() => Math.round(Math.max(0, Math.min(100, this.value()))));
  protected readonly resolvedTone = computed(() => (this.tone() === 'auto' ? budgetTone(this.value()) : (this.tone() as Tone)));
}

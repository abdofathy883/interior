import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-kpi-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card flex h-full flex-col gap-1 p-4 sm:p-5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-semibold text-stone-500 sm:text-sm">{{ label() }}</span>
        @if (icon()) {
          <span
            class="inline-flex size-8 shrink-0 items-center justify-center rounded-lg"
            [class.bg-brand-50]="tone() === 'default'"
            [class.text-brand-700]="tone() === 'default'"
            [class.bg-emerald-50]="tone() === 'good'"
            [class.text-emerald-700]="tone() === 'good'"
            [class.bg-rose-50]="tone() === 'bad'"
            [class.text-rose-700]="tone() === 'bad'"
            [class.bg-amber-50]="tone() === 'warn'"
            [class.text-amber-700]="tone() === 'warn'"
          >
            <app-icon [name]="icon()" [size]="18" />
          </span>
        }
      </div>
      <div
        class="tabular text-lg leading-tight font-extrabold sm:text-xl 2xl:text-2xl"
        [class.text-stone-900]="tone() === 'default'"
        [class.text-emerald-700]="tone() === 'good'"
        [class.text-rose-700]="tone() === 'bad'"
        [class.text-amber-700]="tone() === 'warn'"
      >
        {{ value() }}
      </div>
      @if (hint()) {
        <div class="text-xs text-stone-500">{{ hint() }}</div>
      }
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input('');
  readonly icon = input('');
  readonly tone = input<'default' | 'good' | 'bad' | 'warn'>('default');
}

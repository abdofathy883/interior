import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { startWith, switchMap } from 'rxjs';
import { T } from '../../core/i18n/strings';
import { simulate } from '../../core/mock/simulate';
import { IconComponent } from './icon.component';
import { ToastService } from './toast.service';

/** Page title row with optional right-side actions (projected). */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
      <div class="min-w-0">
        <h1 class="text-xl font-extrabold text-stone-900 sm:text-2xl">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-stone-500">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2"><ng-content /></div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}

@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span class="inline-flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <app-icon [name]="icon()" [size]="28" />
      </span>
      <p class="font-bold text-stone-700">{{ title() }}</p>
      @if (hint()) {
        <p class="max-w-xs text-sm text-stone-500">{{ hint() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly hint = input('');
  readonly icon = input('inbox');
}

/** Arabic validation message under a control (shown once touched). */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as msg) {
      <p class="field-error" role="alert">{{ msg }}</p>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  /** Override the generic "required" text (e.g. "اختر العميل"). */
  readonly requiredText = input('');

  /** Ticks on every control event (value / status / touched), so OnPush stays correct. */
  private readonly tick = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.events.pipe(startWith(null)))),
    { initialValue: null },
  );

  protected readonly message = computed(() => {
    this.tick();
    const c = this.control();
    if (!c.invalid || !c.touched || !c.errors) return '';
    const e = c.errors;
    const v = T.validation;
    if (e['required']) return this.requiredText() || v.required;
    if (e['min'] || e['positive']) return v.positive;
    if (e['pattern'] || e['phone']) return v.phone;
    if (e['email']) return v.email;
    if (e['minlength']) return v.minLength;
    if (e['number']) return v.number;
    return v.required;
  });
}

/** "Export PDF" / "Export Excel": fake success toast only. */
@Component({
  selector: 'app-export-buttons',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="btn btn-secondary btn-sm sm:h-10 sm:text-sm" [disabled]="busy() !== ''" (click)="run('pdf')">
      <app-icon name="file" [size]="16" /> {{ t.export.pdf }}
    </button>
    <button type="button" class="btn btn-secondary btn-sm sm:h-10 sm:text-sm" [disabled]="busy() !== ''" (click)="run('excel')">
      <app-icon name="table" [size]="16" /> {{ t.export.excel }}
    </button>
  `,
  host: { class: 'inline-flex flex-wrap gap-2' },
})
export class ExportButtonsComponent {
  private readonly toast = inject(ToastService);
  protected readonly t = T;
  protected readonly busy = signal<'' | 'pdf' | 'excel'>('');

  async run(kind: 'pdf' | 'excel'): Promise<void> {
    this.busy.set(kind);
    await simulate(() => null, 700);
    this.busy.set('');
    this.toast.show(T.export.done);
  }
}

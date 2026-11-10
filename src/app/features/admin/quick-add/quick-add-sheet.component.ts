import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { T } from '../../../core/i18n/strings';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ExpenseFormComponent, PaymentFormComponent } from './quick-add-forms.component';
import { QuickAddService } from './quick-add.service';

/** Bottom sheet on phones, centred dialog on desktop. Hosts the expense / payment quick-add forms. */
@Component({
  selector: 'app-quick-add-sheet',
  imports: [IconComponent, ExpenseFormComponent, PaymentFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'svc.close()' },
  template: `
    @if (svc.tab(); as tab) {
      <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" [attr.aria-label]="t.quick.title">
        <button type="button" class="anim-fade absolute inset-0 cursor-default bg-stone-900/50" [attr.aria-label]="t.common.close" tabindex="-1" (click)="svc.close()"></button>

        <div class="anim-sheet relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
          <div class="shrink-0 px-5 pt-3 pb-3 sm:pt-5">
            <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-stone-300 sm:hidden"></div>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-extrabold text-stone-900">{{ t.quick.title }}</h2>
              <button type="button" class="icon-btn" [attr.aria-label]="t.common.close" (click)="svc.close()">
                <app-icon name="x" />
              </button>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1" role="tablist">
              <button
                type="button"
                role="tab"
                class="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition"
                [attr.aria-selected]="tab === 'expense'"
                [class.bg-white]="tab === 'expense'"
                [class.shadow-sm]="tab === 'expense'"
                [class.text-stone-900]="tab === 'expense'"
                [class.text-stone-500]="tab !== 'expense'"
                (click)="svc.tab.set('expense')"
              >
                <app-icon name="arrow-up" [size]="16" /> {{ t.quick.expenseTab }}
              </button>
              <button
                type="button"
                role="tab"
                class="flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition"
                [attr.aria-selected]="tab === 'payment'"
                [class.bg-white]="tab === 'payment'"
                [class.shadow-sm]="tab === 'payment'"
                [class.text-stone-900]="tab === 'payment'"
                [class.text-stone-500]="tab !== 'payment'"
                (click)="svc.tab.set('payment')"
              >
                <app-icon name="arrow-down" [size]="16" /> {{ t.quick.paymentTab }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-5 pt-2 pb-6">
            @if (tab === 'expense') {
              <app-expense-form />
            } @else {
              <app-payment-form />
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class QuickAddSheetComponent {
  protected readonly svc = inject(QuickAddService);
  protected readonly t = T;

  constructor() {
    // lock page scroll while the sheet is open
    effect((onCleanup) => {
      if (this.svc.tab()) {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        onCleanup(() => (document.body.style.overflow = prev));
      }
    });
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { T } from '../../core/i18n/strings';
import { IconComponent } from './icon.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of svc.toasts(); track toast.id) {
        <div
          role="status"
          class="anim-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg"
          [class.bg-brand-800]="toast.kind === 'success'"
          [class.bg-stone-800]="toast.kind === 'info'"
          [class.bg-rose-700]="toast.kind === 'error'"
        >
          <span class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
            <app-icon [name]="toast.kind === 'error' ? 'x' : toast.kind === 'info' ? 'info' : 'check'" [size]="14" [strokeWidth]="3" />
          </span>
          <span class="flex-1">{{ toast.message }}</span>
          <button type="button" class="rounded-lg p-1 hover:bg-white/15" [attr.aria-label]="t.common.close" (click)="svc.dismiss(toast.id)">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastsComponent {
  protected readonly svc = inject(ToastService);
  protected readonly t = T;
}

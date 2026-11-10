import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { T } from '../../core/i18n/strings';
import { AuthService, PaymentsService } from '../../core/services/contracts';
import { DmyPipe, MoneyPipe } from '../../shared/pipes/format.pipes';
import { fakeLoading } from '../../shared/ui/fake-loading';
import { IconComponent } from '../../shared/ui/icon.component';
import { EmptyStateComponent } from '../../shared/ui/misc.components';

@Component({
  selector: 'app-portal-payments',
  imports: [IconComponent, EmptyStateComponent, MoneyPipe, DmyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-xl font-extrabold text-stone-900">{{ t.portal.paymentsTitle }}</h1>
    <p class="mb-5 text-sm text-stone-500">{{ t.portal.paymentsSubtitle }}</p>

    @if (loading()) {
      <div class="skeleton h-24" aria-busy="true"></div>
      <div class="skeleton mt-4 h-72"></div>
    } @else {
      <div class="card mb-4 flex items-center justify-between bg-brand-700 p-5 text-white">
        <div>
          <div class="text-sm text-brand-100">{{ t.portal.totalPaid }}</div>
          <div class="tabular text-2xl font-extrabold">{{ total() | money }}</div>
        </div>
        <span class="inline-flex size-12 items-center justify-center rounded-2xl bg-white/15"><app-icon name="wallet" [size]="26" /></span>
      </div>

      <div class="card">
        @if (payments().length === 0) {
          <app-empty-state [title]="t.portal.noPayments" icon="wallet" />
        } @else {
          <ul class="divide-y divide-stone-100">
            @for (p of payments(); track p.id) {
              <li class="flex items-center gap-4 p-4">
                <span class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><app-icon name="check" [strokeWidth]="3" /></span>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-stone-900">{{ p.note || t.portal.paymentsTitle }}</div>
                  <div class="flex items-center gap-1 text-xs text-stone-500"><app-icon name="calendar" [size]="13" /> {{ p.date | dmy }}</div>
                </div>
                <div class="tabular text-lg font-extrabold text-stone-900">{{ p.amount | money }}</div>
              </li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class PortalPaymentsPage {
  private readonly auth = inject(AuthService);
  private readonly paymentsSvc = inject(PaymentsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(350);

  protected readonly payments = computed(() => {
    const id = this.auth.user()?.clientId;
    return id ? this.paymentsSvc.forClient(id) : [];
  });
  protected readonly total = computed(() => this.payments().reduce((a, p) => a + p.amount, 0));
}

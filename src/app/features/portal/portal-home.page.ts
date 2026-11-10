import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { T } from '../../core/i18n/strings';
import { AuthService, ClientsService, ReportsService } from '../../core/services/contracts';
import { MoneyPipe, DmyPipe, PctPipe } from '../../shared/pipes/format.pipes';
import { fakeLoading } from '../../shared/ui/fake-loading';
import { IconComponent } from '../../shared/ui/icon.component';
import { EmptyStateComponent } from '../../shared/ui/misc.components';
import { ProgressComponent } from '../../shared/ui/progress-bar.component';

/**
 * Client portal home. READ-ONLY. Never renders profit, margins, expense lines or sub-categories.
 */
@Component({
  selector: 'app-portal-home',
  imports: [IconComponent, ProgressComponent, EmptyStateComponent, MoneyPipe, PctPipe, DmyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="skeleton h-64" aria-busy="true"></div>
      <div class="skeleton mt-4 h-72"></div>
    } @else if (!project(); as _) {
      <div class="card"><app-empty-state [title]="t.clientForm.notFound" icon="building" /></div>
    } @else {
      @let p = project()!;
      @let c = p.client;
      <section class="card overflow-hidden">
        <div class="flex items-center gap-5 p-5 sm:p-6">
          <div class="relative size-28 shrink-0 sm:size-32">
            <svg viewBox="0 0 36 36" class="size-full -rotate-90" role="img" [attr.aria-label]="t.portal.paidPct + ' ' + (paidPct() | pct)">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e7e5e4" stroke-width="3.2" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#217262"
                stroke-width="3.2"
                stroke-linecap="round"
                [attr.stroke-dasharray]="paidPct() + ' 100'"
                pathLength="100"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="tabular text-2xl font-extrabold text-brand-800">{{ paidPct() | pct }}</span>
              <span class="text-[11px] font-semibold text-stone-500">{{ t.portal.paidPct }}</span>
            </div>
          </div>
          <div class="min-w-0 flex-1 space-y-3">
            <div>
              <div class="text-xs text-stone-500">{{ t.portal.paid }}</div>
              <div class="tabular text-xl font-extrabold text-stone-900 sm:text-2xl">{{ p.received | money }}</div>
            </div>
            <div>
              <div class="text-xs text-stone-500">{{ t.portal.remaining }}</div>
              <div class="tabular text-base font-bold text-stone-700">{{ p.remaining | money }}</div>
            </div>
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-px border-t border-stone-200 bg-stone-200 text-sm sm:grid-cols-4">
          <div class="bg-white p-4">
            <dt class="flex items-center gap-1.5 text-xs text-stone-500"><app-icon name="building" [size]="14" /> {{ t.portal.projectType }}</dt>
            <dd class="mt-1 font-bold text-stone-900">{{ t.enums.projectType[c.projectType] }}</dd>
          </div>
          <div class="bg-white p-4">
            <dt class="flex items-center gap-1.5 text-xs text-stone-500"><app-icon name="pin" [size]="14" /> {{ t.portal.location }}</dt>
            <dd class="mt-1 font-bold text-stone-900">{{ c.location }}</dd>
          </div>
          <div class="bg-white p-4">
            <dt class="flex items-center gap-1.5 text-xs text-stone-500"><app-icon name="wallet" [size]="14" /> {{ t.portal.budget }}</dt>
            <dd class="tabular mt-1 font-bold text-stone-900">{{ p.budget | money }}</dd>
          </div>
          <div class="bg-white p-4">
            <dt class="flex items-center gap-1.5 text-xs text-stone-500"><app-icon name="calendar" [size]="14" /> {{ t.clients.startedOn }}</dt>
            <dd class="mt-1 font-bold text-stone-900">{{ c.startDate | dmy }}</dd>
          </div>
        </dl>
      </section>

      <section class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-extrabold text-stone-900">{{ t.portal.stages }}</h2>
          <span class="badge badge-brand">{{ doneCount() }} / {{ stages().length }} {{ t.portal.stagesDone }}</span>
        </div>
        <app-progress class="mb-4" [value]="stagesPct()" size="lg" [label]="t.portal.stages" />

        <ol class="card p-5 sm:p-6">
          @for (s of stages(); track s.id; let last = $last) {
            <li class="relative flex gap-4 pb-6 last:pb-0">
              @if (!last) {
                <span class="absolute start-[1.1rem] top-10 bottom-0 w-0.5 -translate-x-1/2 rtl:translate-x-1/2" [class.bg-brand-500]="s.status === 'done'" [class.bg-stone-200]="s.status !== 'done'"></span>
              }
              <span
                class="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white"
                [class.bg-brand-600]="s.status === 'done'"
                [class.text-white]="s.status === 'done'"
                [class.bg-sand-500]="s.status === 'in-progress'"
                [class.text-white]="s.status === 'in-progress'"
                [class.bg-stone-200]="s.status === 'upcoming'"
                [class.text-stone-500]="s.status === 'upcoming'"
              >
                @if (s.status === 'done') {
                  <app-icon name="check" [size]="18" [strokeWidth]="3" />
                } @else {
                  <span class="tabular text-sm font-extrabold">{{ s.order }}</span>
                }
              </span>
              <div class="flex flex-1 items-center justify-between gap-3 pt-1">
                <span class="font-bold" [class.text-stone-900]="s.status !== 'upcoming'" [class.text-stone-400]="s.status === 'upcoming'">{{ s.name }}</span>
                <span
                  class="badge"
                  [class.badge-green]="s.status === 'done'"
                  [class.badge-amber]="s.status === 'in-progress'"
                  [class.badge-stone]="s.status === 'upcoming'"
                >
                  {{ t.enums.stageStatus[s.status] }}
                </span>
              </div>
            </li>
          }
        </ol>
      </section>
    }
  `,
})
export class PortalHomePage {
  private readonly auth = inject(AuthService);
  private readonly reports = inject(ReportsService);
  private readonly clients = inject(ClientsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(400);

  /** The portal user only ever sees the client linked to their own account. */
  protected readonly project = computed(() => {
    const clientId = this.auth.user()?.clientId;
    return clientId ? this.reports.summary(clientId) : undefined;
  });
  protected readonly stages = computed(() => {
    const clientId = this.auth.user()?.clientId;
    return clientId ? this.clients.stagesOf(clientId) : [];
  });
  protected readonly paidPct = computed(() => {
    const p = this.project();
    return p && p.budget ? Math.min(100, Math.round((p.received / p.budget) * 100)) : 0;
  });
  protected readonly doneCount = computed(() => this.stages().filter((s) => s.status === 'done').length);
  protected readonly stagesPct = computed(() => (this.stages().length ? (this.doneCount() / this.stages().length) * 100 : 0));
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { T } from '../../../core/i18n/strings';
import { ClientStatus } from '../../../core/models/models';
import { ReportsService } from '../../../core/services/contracts';
import { DmyPipe, MoneyPipe, PctPipe } from '../../../shared/pipes/format.pipes';
import { fakeLoading } from '../../../shared/ui/fake-loading';
import { IconComponent } from '../../../shared/ui/icon.component';
import { EmptyStateComponent, PageHeaderComponent } from '../../../shared/ui/misc.components';
import { ProgressComponent } from '../../../shared/ui/progress-bar.component';

type StatusFilter = 'all' | ClientStatus;

@Component({
  selector: 'app-clients-page',
  imports: [RouterLink, PageHeaderComponent, IconComponent, ProgressComponent, EmptyStateComponent, MoneyPipe, PctPipe, DmyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="t.clients.title" [subtitle]="t.clients.subtitle">
      <a routerLink="/admin/clients/new" class="btn btn-primary">
        <app-icon name="plus" [size]="18" /> {{ t.clients.add }}
      </a>
    </app-page-header>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <span class="pointer-events-none absolute inset-y-0 start-3 flex items-center text-stone-400"><app-icon name="search" [size]="18" /></span>
        <input type="search" class="input ps-10" [placeholder]="t.clients.searchPlaceholder" [attr.aria-label]="t.common.search" [value]="query()" (input)="query.set($any($event.target).value)" />
      </div>
      <div class="grid grid-cols-3 gap-1 rounded-2xl bg-stone-200/70 p-1 sm:w-72" role="group" [attr.aria-label]="t.clients.statusFilter">
        @for (f of filters; track f.key) {
          <button
            type="button"
            class="h-10 rounded-xl text-sm font-bold transition"
            [class.bg-white]="status() === f.key"
            [class.shadow-sm]="status() === f.key"
            [class.text-stone-900]="status() === f.key"
            [class.text-stone-500]="status() !== f.key"
            [attr.aria-pressed]="status() === f.key"
            (click)="status.set(f.key)"
          >
            {{ f.label }}
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        @for (i of [1, 2, 3]; track i) {
          <div class="skeleton h-52"></div>
        }
      </div>
    } @else if (rows().length === 0) {
      <div class="card">
        <app-empty-state [title]="t.clients.empty" [hint]="t.clients.emptyHint" icon="users">
          <a routerLink="/admin/clients/new" class="btn btn-primary mt-3"><app-icon name="plus" [size]="18" /> {{ t.clients.add }}</a>
        </app-empty-state>
      </div>
    } @else {
      <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (r of rows(); track r.client.id) {
          <li class="card flex flex-col transition hover:shadow-md">
            <a class="block flex-1 space-y-3 p-4 sm:p-5" [routerLink]="['/admin/clients', r.client.id]">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-extrabold text-stone-900">{{ r.client.name }}</h2>
                  <p class="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                    <app-icon name="pin" [size]="13" /> {{ t.enums.projectType[r.client.projectType] }} · {{ r.client.location }}
                  </p>
                </div>
                <span class="badge" [class.badge-green]="r.client.status === 'active'" [class.badge-stone]="r.client.status === 'completed'">
                  {{ t.enums.clientStatus[r.client.status] }}
                </span>
              </div>
              <div class="flex items-center justify-between text-xs text-stone-500">
                <span class="flex items-center gap-1" dir="ltr"><app-icon name="phone" [size]="13" /> {{ r.client.phone }}</span>
                <span>{{ t.clients.startedOn }} {{ r.client.startDate | dmy }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div class="text-xs text-stone-500">{{ t.kpi.budget }}</div>
                  <div class="tabular font-bold">{{ r.budget | money }}</div>
                </div>
                <div>
                  <div class="text-xs text-stone-500">{{ t.kpi.received }}</div>
                  <div class="tabular font-bold">{{ r.received | money }}</div>
                </div>
              </div>
              <div>
                <div class="mb-1 flex items-center justify-between text-xs">
                  <span class="text-stone-500">{{ t.kpi.budgetUsed }}</span>
                  <span class="tabular font-bold" [class.text-rose-700]="r.budgetUsedPct > 100" [class.text-amber-700]="r.budgetUsedPct >= 85 && r.budgetUsedPct <= 100">{{ r.budgetUsedPct | pct }}</span>
                </div>
                <app-progress [value]="r.budgetUsedPct" tone="auto" [label]="t.kpi.budgetUsed" />
              </div>
            </a>
            <div class="flex border-t border-stone-100">
              <a class="flex h-12 flex-1 items-center justify-center gap-2 text-sm font-bold text-brand-700 hover:bg-brand-50" [routerLink]="['/admin/clients', r.client.id]">
                <app-icon name="eye" [size]="16" /> {{ t.clients.openReport }}
              </a>
              <a class="flex h-12 flex-1 items-center justify-center gap-2 border-s border-stone-100 text-sm font-bold text-stone-600 hover:bg-stone-50" [routerLink]="['/admin/clients', r.client.id, 'edit']">
                <app-icon name="pencil" [size]="16" /> {{ t.common.edit }}
              </a>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class ClientsPage {
  private readonly reports = inject(ReportsService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(300);
  protected readonly query = signal('');
  protected readonly status = signal<StatusFilter>('all');

  protected readonly filters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: T.common.all },
    { key: 'active', label: T.enums.clientStatus.active },
    { key: 'completed', label: T.enums.clientStatus.completed },
  ];

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const st = this.status();
    return this.reports
      .summaries()
      .filter((r) => st === 'all' || r.client.status === st)
      .filter(
        (r) =>
          !q ||
          r.client.name.toLowerCase().includes(q) ||
          r.client.phone.includes(q) ||
          r.client.location.toLowerCase().includes(q),
      );
  });
}

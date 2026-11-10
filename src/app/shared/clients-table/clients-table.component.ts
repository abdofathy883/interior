import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { T } from '../../core/i18n/strings';
import { ClientSummary } from '../../core/models/models';
import { MoneyPipe, PctPipe } from '../pipes/format.pipes';
import { IconComponent } from '../ui/icon.component';
import { EmptyStateComponent } from '../ui/misc.components';
import { ProgressComponent } from '../ui/progress-bar.component';

type SortKey = 'name' | 'budget' | 'received' | 'spent' | 'profit' | 'used' | 'remaining' | 'expected';

@Component({
  selector: 'app-clients-table',
  imports: [RouterLink, IconComponent, MoneyPipe, PctPipe, ProgressComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card overflow-hidden">
      <!-- toolbar -->
      <div class="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <span class="pointer-events-none absolute inset-y-0 start-3 flex items-center text-stone-400">
            <app-icon name="search" [size]="18" />
          </span>
          <input
            type="search"
            class="input ps-10"
            [placeholder]="t.clientsTable.searchPlaceholder"
            [attr.aria-label]="t.common.search"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <!-- mobile sort -->
        <label class="flex items-center gap-2 md:hidden">
          <span class="text-sm font-semibold text-stone-600">{{ t.common.sortBy }}</span>
          <select class="input h-11 flex-1" [value]="sortKey()" (change)="setSortFromSelect($any($event.target).value)">
            @for (o of sortOptions; track o.key) {
              <option [value]="o.key" [selected]="o.key === sortKey()">{{ o.label }}</option>
            }
          </select>
        </label>
      </div>

      @if (rows().length === 0) {
        <app-empty-state [title]="t.clientsTable.empty" [hint]="t.clientsTable.emptyHint" icon="search" />
      } @else {
        <!-- desktop table -->
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[720px] border-collapse">
            <thead class="bg-stone-50">
              <tr>
                @for (c of columns(); track c.key) {
                  <th class="table-th" [attr.aria-sort]="ariaSort(c.key)" scope="col">
                    <button type="button" class="inline-flex items-center gap-1 rounded-md hover:text-stone-800" (click)="toggleSort(c.key)">
                      {{ c.label }}
                      <app-icon
                        name="sort"
                        [size]="14"
                        [class.text-brand-700]="sortKey() === c.key"
                        [class.opacity-40]="sortKey() !== c.key"
                      />
                    </button>
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (r of rows(); track r.client.id) {
                <tr class="cursor-pointer transition hover:bg-brand-50/50" (click)="open(r.client.id)" (keydown.enter)="open(r.client.id)">
                  <td class="table-td">
                    <a class="font-bold text-stone-900 hover:text-brand-700" [routerLink]="['/admin/clients', r.client.id]" (click)="$event.stopPropagation()">
                      {{ r.client.name }}
                    </a>
                    <div class="text-xs text-stone-500">
                      {{ t.enums.projectType[r.client.projectType] }} · {{ r.client.location }}
                    </div>
                  </td>
                  <td class="table-td tabular">{{ r.budget | money }}</td>
                  <td class="table-td tabular">{{ r.received | money }}</td>
                  <td class="table-td tabular">{{ r.spent | money }}</td>
                  <td class="table-td tabular font-bold" [class.text-emerald-700]="r.profit >= 0" [class.text-rose-700]="r.profit < 0">
                    {{ r.profit | money }}
                  </td>
                  <td class="table-td min-w-36">
                    <div class="flex items-center gap-2">
                      <app-progress class="flex-1" [value]="r.budgetUsedPct" tone="auto" size="md" [label]="t.kpi.budgetUsed" />
                      <span
                        class="tabular w-11 text-xs font-bold"
                        [class.text-rose-700]="r.budgetUsedPct > 100"
                        [class.text-amber-700]="r.budgetUsedPct >= 85 && r.budgetUsedPct <= 100"
                      >
                        {{ r.budgetUsedPct | pct }}
                      </span>
                    </div>
                  </td>
                  @if (detailed()) {
                    <td class="table-td tabular">{{ r.remaining | money }}</td>
                    <td class="table-td tabular">{{ r.expectedProfit | money }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- mobile cards -->
        <ul class="divide-y divide-stone-100 md:hidden">
          @for (r of rows(); track r.client.id) {
            <li>
              <a class="block space-y-3 p-4 active:bg-stone-50" [routerLink]="['/admin/clients', r.client.id]">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-bold text-stone-900">{{ r.client.name }}</div>
                    <div class="text-xs text-stone-500">
                      {{ t.enums.projectType[r.client.projectType] }} · {{ r.client.location }}
                    </div>
                  </div>
                  <span class="badge" [class.badge-green]="r.client.status === 'active'" [class.badge-stone]="r.client.status === 'completed'">
                    {{ t.enums.clientStatus[r.client.status] }}
                  </span>
                </div>
                <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt class="text-xs text-stone-500">{{ t.clientsTable.budget }}</dt>
                    <dd class="tabular font-semibold">{{ r.budget | money }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-stone-500">{{ t.clientsTable.received }}</dt>
                    <dd class="tabular font-semibold">{{ r.received | money }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-stone-500">{{ t.clientsTable.spent }}</dt>
                    <dd class="tabular font-semibold">{{ r.spent | money }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-stone-500">{{ t.clientsTable.profit }}</dt>
                    <dd class="tabular font-bold" [class.text-emerald-700]="r.profit >= 0" [class.text-rose-700]="r.profit < 0">
                      {{ r.profit | money }}
                    </dd>
                  </div>
                  @if (detailed()) {
                    <div>
                      <dt class="text-xs text-stone-500">{{ t.clientsTable.remaining }}</dt>
                      <dd class="tabular font-semibold">{{ r.remaining | money }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs text-stone-500">{{ t.clientsTable.expectedProfit }}</dt>
                      <dd class="tabular font-semibold">{{ r.expectedProfit | money }}</dd>
                    </div>
                  }
                </dl>
                <div>
                  <div class="mb-1 flex items-center justify-between text-xs">
                    <span class="text-stone-500">{{ t.kpi.budgetUsed }}</span>
                    <span
                      class="tabular font-bold"
                      [class.text-rose-700]="r.budgetUsedPct > 100"
                      [class.text-amber-700]="r.budgetUsedPct >= 85 && r.budgetUsedPct <= 100"
                    >
                      {{ r.budgetUsedPct | pct }}
                    </span>
                  </div>
                  <app-progress [value]="r.budgetUsedPct" tone="auto" [label]="t.kpi.budgetUsed" />
                </div>
              </a>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ClientsTableComponent {
  private readonly router = inject(Router);
  protected readonly t = T;

  readonly data = input.required<ClientSummary[]>();
  /** Adds "remaining to collect" and "expected profit" columns. */
  readonly detailed = input(false);

  protected readonly query = signal('');
  protected readonly sortKey = signal<SortKey>('name');
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly sortOptions: { key: SortKey; label: string }[] = [
    { key: 'name', label: T.clientsTable.client },
    { key: 'budget', label: T.clientsTable.budget },
    { key: 'received', label: T.clientsTable.received },
    { key: 'spent', label: T.clientsTable.spent },
    { key: 'profit', label: T.clientsTable.profit },
    { key: 'used', label: T.clientsTable.used },
  ];

  protected readonly columns = computed(() => {
    const base: { key: SortKey; label: string }[] = [...this.sortOptions];
    if (this.detailed()) {
      base.push({ key: 'remaining', label: T.clientsTable.remaining }, { key: 'expected', label: T.clientsTable.expectedProfit });
    }
    return base;
  });

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const value = (r: ClientSummary): number | string => {
      switch (key) {
        case 'name':
          return r.client.name;
        case 'budget':
          return r.budget;
        case 'received':
          return r.received;
        case 'spent':
          return r.spent;
        case 'profit':
          return r.profit;
        case 'used':
          return r.budgetUsedPct;
        case 'remaining':
          return r.remaining;
        case 'expected':
          return r.expectedProfit;
      }
    };
    return this.data()
      .filter((r) => !q || r.client.name.toLowerCase().includes(q) || r.client.location.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = value(a);
        const vb = value(b);
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string, 'ar') : va - (vb as number);
        return cmp * dir;
      });
  });

  protected toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'name' ? 'asc' : 'desc');
    }
  }

  protected setSortFromSelect(key: string): void {
    this.sortKey.set(key as SortKey);
    this.sortDir.set(key === 'name' ? 'asc' : 'desc');
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  protected open(id: string): void {
    void this.router.navigate(['/admin/clients', id]);
  }
}

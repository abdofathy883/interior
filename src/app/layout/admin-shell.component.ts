import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { T } from '../core/i18n/strings';
import { DemoService } from '../core/mock/demo.service';
import { AuthService } from '../core/services/contracts';
import { QuickAddSheetComponent } from '../features/admin/quick-add/quick-add-sheet.component';
import { QuickAddService } from '../features/admin/quick-add/quick-add.service';
import { IconComponent } from '../shared/ui/icon.component';
import { ToastService } from '../shared/ui/toast.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, QuickAddSheetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
      {{ t.nav.skip }}
    </a>

    <!-- desktop sidebar -->
    <aside class="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col bg-brand-900 text-white lg:flex">
      <div class="flex items-center gap-3 px-6 pt-7 pb-6">
        <span class="inline-flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <app-icon name="building" [size]="24" />
        </span>
        <div>
          <div class="text-lg leading-tight font-extrabold">{{ t.app.name }}</div>
          <div class="text-[11px] text-brand-200">{{ t.app.demo }}</div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3" aria-label="Main">
        @for (item of nav; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-white/15 text-white"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white"
          >
            <app-icon [name]="item.icon" /> {{ item.label }}
          </a>
        }
      </nav>
      <div class="space-y-1 border-t border-white/10 p-3">
        <div class="flex items-center gap-3 px-3 py-2">
          <span class="inline-flex size-9 items-center justify-center rounded-full bg-sand-500 text-sm font-extrabold">{{ initial() }}</span>
          <div class="min-w-0">
            <div class="truncate text-sm font-bold">{{ auth.user()?.name }}</div>
            <div class="text-xs text-brand-200">{{ t.nav.admin }}</div>
          </div>
        </div>
        <button type="button" class="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-brand-100 hover:bg-white/10" [disabled]="resetting()" (click)="resetDemo()">
          <app-icon name="refresh" [size]="18" /> {{ t.nav.resetDemo }}
        </button>
        <button type="button" class="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-brand-100 hover:bg-white/10" (click)="logout()">
          <app-icon name="logout" [size]="18" /> {{ t.nav.logout }}
        </button>
      </div>
    </aside>

    <!-- mobile top bar -->
    <header class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur lg:hidden">
      <div class="flex items-center gap-2">
        <span class="inline-flex size-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <app-icon name="building" [size]="20" />
        </span>
        <span class="text-base font-extrabold text-stone-900">{{ t.app.name }}</span>
      </div>
      <div class="relative">
        <button type="button" class="icon-btn" [attr.aria-label]="t.nav.more" [attr.aria-expanded]="menuOpen()" (click)="menuOpen.set(!menuOpen())">
          <app-icon name="dots" [strokeWidth]="3" />
        </button>
        @if (menuOpen()) {
          <button type="button" class="fixed inset-0 z-40 cursor-default" tabindex="-1" [attr.aria-label]="t.common.close" (click)="menuOpen.set(false)"></button>
          <div class="anim-fade absolute end-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl">
            <div class="px-3 py-2">
              <div class="text-sm font-bold text-stone-900">{{ auth.user()?.name }}</div>
              <div class="text-xs text-stone-500">{{ t.nav.admin }}</div>
            </div>
            <button type="button" class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100" [disabled]="resetting()" (click)="resetDemo()">
              <app-icon name="refresh" [size]="18" /> {{ t.nav.resetDemo }}
            </button>
            <button type="button" class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50" (click)="logout()">
              <app-icon name="logout" [size]="18" /> {{ t.nav.logout }}
            </button>
          </div>
        }
      </div>
    </header>

    <main id="main" class="mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-6 lg:ms-64 lg:max-w-none lg:px-10 lg:py-8 lg:pb-24">
      <div class="mx-auto max-w-6xl">
        <router-outlet />
      </div>
    </main>

    <!-- mobile bottom nav -->
    <nav class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Main">
      @for (item of nav; track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="text-brand-700"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          #rla="routerLinkActive"
          class="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold text-stone-500"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <app-icon [name]="item.icon" [size]="22" [strokeWidth]="rla.isActive ? 2.5 : 2" />
          {{ item.label }}
        </a>
      }
    </nav>

    <!-- FAB -->
    @if (!quick.tab()) {
      <button
        type="button"
        class="fixed end-4 bottom-20 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-brand-700 px-5 text-base font-bold text-white shadow-xl shadow-brand-900/30 ring-4 ring-white transition hover:bg-brand-800 active:scale-95 lg:end-10 lg:bottom-8"
        [attr.aria-label]="t.nav.addExpense"
        (click)="quick.open('expense')"
      >
        <app-icon name="plus" [size]="24" [strokeWidth]="2.5" />
        <span class="hidden sm:inline">{{ t.nav.addExpense }}</span>
      </button>
    }

    <app-quick-add-sheet />
  `,
})
export class AdminShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly quick = inject(QuickAddService);
  private readonly router = inject(Router);
  private readonly demo = inject(DemoService);
  private readonly toast = inject(ToastService);

  protected readonly t = T;
  protected readonly menuOpen = signal(false);
  protected readonly resetting = signal(false);

  protected readonly nav: NavItem[] = [
    { path: '/admin', label: T.nav.dashboard, icon: 'home', exact: true },
    { path: '/admin/clients', label: T.nav.clients, icon: 'users', exact: false },
    { path: '/admin/reports', label: T.nav.reports, icon: 'chart', exact: false },
    { path: '/admin/categories', label: T.nav.categories, icon: 'tag', exact: false },
  ];

  protected initial(): string {
    return (this.auth.user()?.name ?? '?').charAt(0);
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.quick.close();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  protected async resetDemo(): Promise<void> {
    this.menuOpen.set(false);
    if (!confirm(T.nav.resetConfirm)) return;
    this.resetting.set(true);
    await this.demo.resetData();
    this.resetting.set(false);
    this.toast.show(T.nav.resetDone);
  }
}

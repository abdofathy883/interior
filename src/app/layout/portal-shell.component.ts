import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { T } from '../core/i18n/strings';
import { AuthService } from '../core/services/contracts';
import { IconComponent } from '../shared/ui/icon.component';

@Component({
  selector: 'app-portal-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
      {{ t.nav.skip }}
    </a>
    <div class="min-h-dvh bg-sand-50">
      <header class="bg-gradient-to-b from-brand-800 to-brand-700 text-white">
        <div class="mx-auto flex max-w-3xl items-center justify-between px-4 pt-4 sm:px-6">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <app-icon name="building" />
            </span>
            <span class="text-lg font-extrabold">{{ t.app.name }}</span>
          </div>
          <button type="button" class="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-50 hover:bg-white/10" (click)="logout()">
            <app-icon name="logout" [size]="18" /> {{ t.nav.logout }}
          </button>
        </div>
        <div class="mx-auto max-w-3xl px-4 pt-5 pb-0 sm:px-6">
          <p class="text-sm text-brand-100">{{ t.portal.greeting }}</p>
          <p class="text-2xl font-extrabold">{{ auth.user()?.name }}</p>
          <nav class="-mb-px mt-4 flex gap-1" aria-label="Portal">
            @for (item of nav; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-sand-50 text-brand-800"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="flex h-12 flex-1 items-center justify-center gap-2 rounded-t-2xl text-sm font-bold text-brand-100 transition hover:text-white"
              >
                <app-icon [name]="item.icon" [size]="18" /> {{ item.label }}
              </a>
            }
          </nav>
        </div>
      </header>
      <main id="main" class="mx-auto max-w-3xl px-4 py-6 pb-12 sm:px-6">
        <router-outlet />
        <p class="mt-10 text-center text-xs text-stone-400">{{ t.portal.readOnly }} · {{ t.portal.contact }}</p>
      </main>
    </div>
  `,
})
export class PortalShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly t = T;

  protected readonly nav = [
    { path: '/portal', label: T.nav.portalHome, icon: 'home', exact: true },
    { path: '/portal/payments', label: T.nav.portalPayments, icon: 'wallet', exact: false },
    { path: '/portal/spending', label: T.nav.portalSpending, icon: 'chart', exact: false },
  ];

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}

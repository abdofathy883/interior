import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { T } from '../../core/i18n/strings';
import { AuthService } from '../../core/services/contracts';
import { IconComponent } from '../../shared/ui/icon.component';
import { FieldErrorComponent } from '../../shared/ui/misc.components';

interface DemoAccount {
  role: 'admin' | 'client';
  email: string;
  password: string;
  label: string;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent, FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="flex min-h-dvh items-center justify-center bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 p-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center text-white">
          <div class="mx-auto mb-3 inline-flex size-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <app-icon name="building" [size]="32" />
          </div>
          <h1 class="text-3xl font-extrabold">{{ t.app.name }}</h1>
          <p class="mt-1 text-sm text-brand-100">{{ t.app.tagline }}</p>
        </div>

        <div class="card p-5 sm:p-7">
          <h2 class="text-lg font-extrabold text-stone-900">{{ t.auth.title }}</h2>
          <p class="mb-5 text-sm text-stone-500">{{ t.auth.subtitle }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
            <div>
              <label class="label" for="email">{{ t.auth.email }}</label>
              <input id="email" type="email" class="input" dir="ltr" autocomplete="username" inputmode="email" formControlName="email" placeholder="name@example.com" />
              <app-field-error [control]="form.controls.email" />
            </div>
            <div>
              <label class="label" for="password">{{ t.auth.password }}</label>
              <input id="password" type="password" class="input" dir="ltr" autocomplete="current-password" formControlName="password" />
              <app-field-error [control]="form.controls.password" />
            </div>
            @if (error()) {
              <p class="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="busy()">
              {{ busy() === 'form' ? t.auth.loggingIn : t.auth.login }}
            </button>
          </form>

          <div class="my-5 flex items-center gap-3 text-xs font-semibold text-stone-400">
            <span class="h-px flex-1 bg-stone-200"></span>
            {{ t.auth.demoTitle }}
            <span class="h-px flex-1 bg-stone-200"></span>
          </div>

          <div class="grid gap-3">
            @for (a of accounts; track a.role) {
              <button
                type="button"
                class="group flex items-center gap-3 rounded-2xl border border-stone-200 p-3 text-start transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-60"
                [disabled]="busy() !== ''"
                (click)="quick(a)"
              >
                <span class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <app-icon [name]="a.icon" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-bold text-stone-900">
                    {{ busy() === a.role ? t.auth.loggingIn : a.label }}
                  </span>
                  <span class="block text-xs text-stone-500">{{ a.hint }}</span>
                  <span class="mt-1 block text-[11px] text-stone-500">
                    {{ t.auth.credentials }}: <bdi dir="ltr">{{ a.email }} / {{ a.password }}</bdi>
                  </span>
                </span>
                <app-icon name="chevron-left" class="text-stone-300 group-hover:text-brand-600" />
              </button>
            }
          </div>
        </div>
        <p class="mt-4 text-center text-xs text-brand-100">{{ t.auth.demoNote }}</p>
      </div>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly t = T;
  protected readonly busy = signal<'' | 'form' | 'admin' | 'client'>('');
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected readonly accounts: DemoAccount[] = [
    { role: 'admin', email: 'admin@demo.com', password: 'demo123', label: T.auth.loginAsAdmin, hint: T.auth.adminHint, icon: 'chart' },
    { role: 'client', email: 'client@demo.com', password: 'demo123', label: T.auth.loginAsClient, hint: T.auth.clientHint, icon: 'user' },
  ];

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    void this.run('form', email, password);
  }

  protected quick(a: DemoAccount): void {
    void this.run(a.role, a.email, a.password);
  }

  private async run(kind: 'form' | 'admin' | 'client', email: string, password: string): Promise<void> {
    this.error.set('');
    this.busy.set(kind);
    try {
      const user = await this.auth.login(email, password);
      await this.router.navigateByUrl(user.role === 'admin' ? '/admin' : '/portal');
    } catch {
      this.error.set(T.auth.invalid);
    } finally {
      this.busy.set('');
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { T } from '../../../core/i18n/strings';
import { CategoriesService, ClientsService, ExpensesService, PaymentsService, ReportsService } from '../../../core/services/contracts';
import { todayIso } from '../../../core/util/dates';
import { formatMoney } from '../../../core/util/money';
import { MoneyPipe, PctPipe } from '../../../shared/pipes/format.pipes';
import { IconComponent } from '../../../shared/ui/icon.component';
import { FieldErrorComponent } from '../../../shared/ui/misc.components';
import { ProgressComponent } from '../../../shared/ui/progress-bar.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { QuickAddService } from './quick-add.service';

/** Sorted client options: active first. */
function useClientOptions() {
  const clients = inject(ClientsService);
  return computed(() =>
    [...clients.clients()].sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name, 'ar') : a.status === 'active' ? -1 : 1)),
  );
}

/** Quick-add EXPENSE: the most important form. Big inputs, chips instead of dropdowns. */
@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule, FieldErrorComponent, IconComponent, ProgressComponent, PctPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
      <div>
        <label class="label" for="qe-client">{{ t.quick.client }}</label>
        <select id="qe-client" class="input input-lg" formControlName="clientId">
          <option value="" disabled>{{ t.quick.clientPh }}</option>
          @for (c of clientOptions(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <app-field-error [control]="form.controls.clientId" [requiredText]="t.validation.selectClient" />
        @if (summary(); as s) {
          <div class="mt-2 flex items-center gap-3 text-xs text-stone-500">
            <span class="whitespace-nowrap">{{ t.quick.clientBudgetUsed }}</span>
            <app-progress class="flex-1" [value]="s.budgetUsedPct" tone="auto" size="sm" [label]="t.quick.clientBudgetUsed" />
            <span class="tabular font-bold" [class.text-rose-700]="s.budgetUsedPct > 100" [class.text-amber-700]="s.budgetUsedPct >= 85 && s.budgetUsedPct <= 100">
              {{ s.budgetUsedPct | pct }}
            </span>
          </div>
        }
      </div>

      <div>
        <label class="label" for="qe-amount">{{ t.quick.amount }}</label>
        <div class="relative">
          <input
            #amountInput
            id="qe-amount"
            type="number"
            inputmode="decimal"
            step="any"
            min="0"
            class="input input-lg tabular pe-16 text-2xl font-extrabold"
            placeholder="0"
            formControlName="amount"
            autocomplete="off"
          />
          <span class="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-bold text-stone-500">{{ t.common.currency }}</span>
        </div>
        <app-field-error [control]="form.controls.amount" />
      </div>

      <div>
        <span class="label" id="qe-cat-label">{{ t.quick.category }}</span>
        <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="qe-cat-label">
          @for (c of cats.categories(); track c.id) {
            <button type="button" role="radio" class="chip h-14 text-base" [attr.aria-checked]="categoryId() === c.id" (click)="form.controls.categoryId.setValue(c.id)">
              {{ c.name }}
            </button>
          }
        </div>
      </div>

      <div>
        <span class="label" id="qe-sub-label">{{ t.quick.subCategory }}</span>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="qe-sub-label">
          @for (s of subs(); track s.id) {
            <button type="button" role="radio" class="chip" [attr.aria-checked]="form.controls.subCategoryId.value === s.id" (click)="pickSub(s.id)">
              {{ s.name }}
            </button>
          }
        </div>
        <app-field-error [control]="form.controls.subCategoryId" [requiredText]="t.validation.selectSub" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="qe-date">{{ t.quick.date }}</label>
          <input id="qe-date" type="date" class="input" formControlName="date" />
          <app-field-error [control]="form.controls.date" [requiredText]="t.validation.date" />
        </div>
        <div>
          <label class="label" for="qe-note">{{ t.quick.note }}</label>
          <input id="qe-note" type="text" class="input" [placeholder]="t.quick.notePhExpense" formControlName="note" autocomplete="off" />
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="saving()">
        @if (saving()) {
          {{ t.common.saving }}
        } @else {
          <app-icon name="check" /> {{ t.quick.saveExpense }}
        }
      </button>
    </form>
  `,
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly quick = inject(QuickAddService);
  private readonly expenses = inject(ExpensesService);
  private readonly reports = inject(ReportsService);
  private readonly toast = inject(ToastService);
  protected readonly cats = inject(CategoriesService);
  protected readonly clientOptions = useClientOptions();
  protected readonly t = T;
  protected readonly saving = signal(false);
  private readonly amountEl = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  protected readonly form = this.fb.group({
    clientId: [this.quick.lastClientId(), Validators.required],
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    categoryId: [this.cats.categories()[0]?.id ?? '', Validators.required],
    subCategoryId: ['', Validators.required],
    date: [todayIso(), Validators.required],
    note: [''],
  });

  protected readonly categoryId = toSignal(this.form.controls.categoryId.valueChanges.pipe(startWith(this.form.controls.categoryId.value)), {
    initialValue: this.form.controls.categoryId.value,
  });
  private readonly clientId = toSignal(this.form.controls.clientId.valueChanges.pipe(startWith(this.form.controls.clientId.value)), {
    initialValue: this.form.controls.clientId.value,
  });
  protected readonly subs = computed(() => this.cats.subsOf(this.categoryId()));
  protected readonly summary = computed(() => (this.clientId() ? this.reports.summary(this.clientId()) : undefined));

  constructor() {
    this.form.controls.categoryId.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.form.controls.subCategoryId.reset(''));
    this.form.controls.clientId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => this.quick.lastClientId.set(id));
    // focus the amount once on open (the first time the input exists)
    let focused = false;
    effect(() => {
      const el = this.amountEl()?.nativeElement;
      if (el && !focused) {
        focused = true;
        if (this.form.controls.clientId.value) el.focus();
      }
    });
  }

  protected pickSub(id: string): void {
    this.form.controls.subCategoryId.setValue(id);
    this.form.controls.subCategoryId.markAsTouched();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const amount = Number(v.amount);
    this.saving.set(true);
    await this.expenses.add({
      clientId: v.clientId,
      date: v.date,
      amount,
      categoryId: v.categoryId,
      subCategoryId: v.subCategoryId,
      note: v.note.trim() || undefined,
    });
    this.saving.set(false);
    this.toast.show(`${T.quick.expenseSaved}: ${formatMoney(amount)} · ${this.cats.subCategoryName(v.subCategoryId)}`);
    // keep client / category / sub / date so the next entry is one number away
    this.form.controls.amount.reset(null);
    this.form.controls.note.reset('');
    this.amountEl()?.nativeElement.focus();
  }
}

/** Quick-add PAYMENT received. */
@Component({
  selector: 'app-payment-form',
  imports: [ReactiveFormsModule, FieldErrorComponent, IconComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
      <div>
        <label class="label" for="qp-client">{{ t.quick.client }}</label>
        <select id="qp-client" class="input input-lg" formControlName="clientId">
          <option value="" disabled>{{ t.quick.clientPh }}</option>
          @for (c of clientOptions(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <app-field-error [control]="form.controls.clientId" [requiredText]="t.validation.selectClient" />
        @if (summary(); as s) {
          <p class="mt-2 text-xs text-stone-500">
            {{ t.quick.clientRemaining }}:
            <span class="tabular font-bold text-stone-800">{{ s.remaining | money }}</span>
          </p>
        }
      </div>

      <div>
        <label class="label" for="qp-amount">{{ t.quick.amount }}</label>
        <div class="relative">
          <input
            #amountInput
            id="qp-amount"
            type="number"
            inputmode="decimal"
            step="any"
            min="0"
            class="input input-lg tabular pe-16 text-2xl font-extrabold"
            placeholder="0"
            formControlName="amount"
            autocomplete="off"
          />
          <span class="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-bold text-stone-500">{{ t.common.currency }}</span>
        </div>
        <app-field-error [control]="form.controls.amount" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="qp-date">{{ t.quick.date }}</label>
          <input id="qp-date" type="date" class="input" formControlName="date" />
          <app-field-error [control]="form.controls.date" [requiredText]="t.validation.date" />
        </div>
        <div>
          <label class="label" for="qp-note">{{ t.quick.note }}</label>
          <input id="qp-note" type="text" class="input" [placeholder]="t.quick.notePhPayment" formControlName="note" autocomplete="off" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        @for (s of t.quick.suggestions; track s) {
          <button type="button" class="chip" (click)="form.controls.note.setValue(s)">{{ s }}</button>
        }
      </div>

      <button type="submit" class="btn btn-primary btn-lg w-full" [disabled]="saving()">
        @if (saving()) {
          {{ t.common.saving }}
        } @else {
          <app-icon name="check" /> {{ t.quick.savePayment }}
        }
      </button>
    </form>
  `,
})
export class PaymentFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly quick = inject(QuickAddService);
  private readonly payments = inject(PaymentsService);
  private readonly reports = inject(ReportsService);
  private readonly toast = inject(ToastService);
  protected readonly clientOptions = useClientOptions();
  protected readonly t = T;
  protected readonly saving = signal(false);
  private readonly amountEl = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  protected readonly form = this.fb.group({
    clientId: [this.quick.lastClientId(), Validators.required],
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    date: [todayIso(), Validators.required],
    note: [''],
  });

  private readonly clientId = toSignal(this.form.controls.clientId.valueChanges.pipe(startWith(this.form.controls.clientId.value)), {
    initialValue: this.form.controls.clientId.value,
  });
  protected readonly summary = computed(() => (this.clientId() ? this.reports.summary(this.clientId()) : undefined));

  constructor() {
    this.form.controls.clientId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => this.quick.lastClientId.set(id));
    let focused = false;
    effect(() => {
      const el = this.amountEl()?.nativeElement;
      if (el && !focused) {
        focused = true;
        if (this.form.controls.clientId.value) el.focus();
      }
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const amount = Number(v.amount);
    this.saving.set(true);
    await this.payments.add({ clientId: v.clientId, date: v.date, amount, note: v.note.trim() || undefined });
    this.saving.set(false);
    this.toast.show(`${T.quick.paymentSaved}: ${formatMoney(amount)}`);
    this.form.controls.amount.reset(null);
    this.form.controls.note.reset('');
    this.amountEl()?.nativeElement.focus();
  }
}

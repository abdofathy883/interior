import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { T } from '../../../core/i18n/strings';
import { ClientStatus, ProjectType } from '../../../core/models/models';
import { ClientsService } from '../../../core/services/contracts';
import { todayIso } from '../../../core/util/dates';
import { IconComponent } from '../../../shared/ui/icon.component';
import { EmptyStateComponent, FieldErrorComponent, PageHeaderComponent } from '../../../shared/ui/misc.components';
import { ToastService } from '../../../shared/ui/toast.service';

const PHONE_RE = /^01[0125]\d{8}$/;
const LOCATIONS = ['التجمع الخامس', 'الشيخ زايد', '6 أكتوبر', 'المعادي', 'الساحل الشمالي', 'مدينة نصر', 'الرحاب', 'الشروق'];

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, FieldErrorComponent, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (notFound()) {
      <div class="card">
        <app-empty-state [title]="t.clientForm.notFound" icon="users">
          <a routerLink="/admin/clients" class="btn btn-secondary mt-3">{{ t.common.back }}</a>
        </app-empty-state>
      </div>
    } @else {
      <app-page-header [title]="isEdit() ? t.clientForm.editTitle : t.clientForm.addTitle" />

      <form [formGroup]="form" (ngSubmit)="submit()" class="card max-w-2xl space-y-5 p-5 sm:p-7" novalidate>
        <div>
          <label class="label" for="cf-name">{{ t.clientForm.name }}</label>
          <input id="cf-name" class="input" formControlName="name" [placeholder]="t.clientForm.namePh" autocomplete="off" />
          <app-field-error [control]="form.controls.name" />
        </div>

        <div>
          <label class="label" for="cf-phone">{{ t.clientForm.phone }}</label>
          <input id="cf-phone" class="input" dir="ltr" style="text-align: right" inputmode="tel" formControlName="phone" [placeholder]="t.clientForm.phonePh" autocomplete="off" />
          <app-field-error [control]="form.controls.phone" />
        </div>

        <div>
          <span class="label" id="cf-type-label">{{ t.clientForm.projectType }}</span>
          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="cf-type-label">
            @for (p of projectTypes; track p.key) {
              <button type="button" role="radio" class="chip h-14 text-base" [attr.aria-checked]="form.controls.projectType.value === p.key" (click)="form.controls.projectType.setValue(p.key)">
                {{ p.label }}
              </button>
            }
          </div>
        </div>

        <div>
          <label class="label" for="cf-location">{{ t.clientForm.location }}</label>
          <input id="cf-location" class="input" list="cf-locations" formControlName="location" [placeholder]="t.clientForm.locationPh" autocomplete="off" />
          <datalist id="cf-locations">
            @for (l of locations; track l) {
              <option [value]="l"></option>
            }
          </datalist>
          <app-field-error [control]="form.controls.location" />
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="label" for="cf-budget">{{ t.clientForm.budget }}</label>
            <div class="relative">
              <input id="cf-budget" type="number" inputmode="decimal" step="any" min="0" class="input tabular pe-14" formControlName="budget" placeholder="0" />
              <span class="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-bold text-stone-500">{{ t.common.currency }}</span>
            </div>
            <app-field-error [control]="form.controls.budget" />
          </div>
          <div>
            <label class="label" for="cf-start">{{ t.clientForm.startDate }}</label>
            <input id="cf-start" type="date" class="input" formControlName="startDate" />
            <app-field-error [control]="form.controls.startDate" [requiredText]="t.validation.date" />
          </div>
        </div>

        @if (isEdit()) {
          <div>
            <span class="label" id="cf-status-label">{{ t.clientForm.status }}</span>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="cf-status-label">
              @for (s of statuses; track s.key) {
                <button type="button" role="radio" class="chip h-12" [attr.aria-checked]="form.controls.status.value === s.key" (click)="form.controls.status.setValue(s.key)">
                  {{ s.label }}
                </button>
              }
            </div>
          </div>
        }

        <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <a routerLink="/admin/clients" class="btn btn-secondary btn-lg sm:h-12 sm:rounded-xl">{{ t.common.cancel }}</a>
          <button type="submit" class="btn btn-primary btn-lg sm:h-12 sm:rounded-xl" [disabled]="saving()">
            @if (saving()) {
              {{ t.common.saving }}
            } @else {
              <app-icon name="check" /> {{ t.common.save }}
            }
          </button>
        </div>
      </form>
    }
  `,
})
export class ClientFormPage implements OnInit {
  /** Route param (bound by withComponentInputBinding). Absent on `/clients/new`. */
  readonly id = input<string>();

  private readonly clients = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly t = T;
  protected readonly saving = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly notFound = signal(false);
  protected readonly locations = LOCATIONS;

  protected readonly projectTypes: { key: ProjectType; label: string }[] = [
    { key: 'apartment', label: T.enums.projectType.apartment },
    { key: 'villa', label: T.enums.projectType.villa },
  ];
  protected readonly statuses: { key: ClientStatus; label: string }[] = [
    { key: 'active', label: T.enums.clientStatus.active },
    { key: 'completed', label: T.enums.clientStatus.completed },
  ];

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_RE)]],
    projectType: this.fb.control<ProjectType>('apartment'),
    location: ['', Validators.required],
    budget: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    startDate: [todayIso(), Validators.required],
    status: this.fb.control<ClientStatus>('active'),
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const c = this.clients.getById(id);
    if (!c) {
      this.notFound.set(true);
      return;
    }
    this.isEdit.set(true);
    this.form.patchValue({
      name: c.name,
      phone: c.phone,
      projectType: c.projectType,
      location: c.location,
      budget: c.budget,
      startDate: c.startDate,
      status: c.status,
    });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const data = {
      name: v.name.trim(),
      phone: v.phone.trim(),
      projectType: v.projectType,
      location: v.location.trim(),
      budget: Number(v.budget),
      startDate: v.startDate,
      status: v.status,
    };
    this.saving.set(true);
    const id = this.id();
    const saved = id ? await this.clients.update(id, data) : await this.clients.create(data);
    this.saving.set(false);
    this.toast.show(id ? T.clientForm.saved : T.clientForm.created);
    await this.router.navigate(['/admin/clients', saved.id]);
  }
}

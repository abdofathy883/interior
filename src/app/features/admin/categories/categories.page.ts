import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { T } from '../../../core/i18n/strings';
import { CategoriesService } from '../../../core/services/contracts';
import { fakeLoading } from '../../../shared/ui/fake-loading';
import { IconComponent } from '../../../shared/ui/icon.component';
import { PageHeaderComponent } from '../../../shared/ui/misc.components';
import { ToastService } from '../../../shared/ui/toast.service';

@Component({
  selector: 'app-categories-page',
  imports: [PageHeaderComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header [title]="t.categories.title" [subtitle]="t.categories.subtitle">
      <button type="button" class="btn btn-primary" (click)="addingCategory.set(!addingCategory())">
        <app-icon name="plus" [size]="18" /> {{ t.categories.addCategory }}
      </button>
    </app-page-header>

    @if (addingCategory()) {
      <form class="card anim-fade mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end" (submit)="$event.preventDefault(); addCategory(catInput)">
        <div class="flex-1">
          <label class="label" for="new-cat">{{ t.categories.categoryName }}</label>
          <input #catInput id="new-cat" class="input" autocomplete="off" />
        </div>
        <button type="submit" class="btn btn-primary h-12" [disabled]="busy() !== ''">{{ busy() === 'cat' ? t.common.saving : t.common.save }}</button>
        <button type="button" class="btn btn-secondary h-12" (click)="addingCategory.set(false)">{{ t.common.cancel }}</button>
      </form>
    }

    @if (loading()) {
      <div class="grid gap-4 lg:grid-cols-2" aria-busy="true">
        <div class="skeleton h-80"></div>
        <div class="skeleton h-80"></div>
      </div>
    } @else {
      <div class="grid items-start gap-4 lg:grid-cols-2">
        @for (cat of cats.categories(); track cat.id) {
          <section class="card overflow-hidden">
            <header class="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
              @if (editing() === 'cat:' + cat.id) {
                <form class="flex flex-1 items-center gap-2" (submit)="$event.preventDefault(); saveRename(cat.id, 'cat', renameCat)">
                  <input #renameCat class="input h-10 flex-1" [value]="cat.name" [attr.aria-label]="t.categories.rename" (keydown.escape)="editing.set('')" />
                  <button type="submit" class="icon-btn text-emerald-700" [attr.aria-label]="t.common.save"><app-icon name="check" /></button>
                  <button type="button" class="icon-btn" [attr.aria-label]="t.common.cancel" (click)="editing.set('')"><app-icon name="x" /></button>
                </form>
              } @else {
                <span class="inline-flex size-9 items-center justify-center rounded-lg bg-brand-100 text-brand-800"><app-icon name="tag" [size]="18" /></span>
                <div class="min-w-0 flex-1">
                  <h2 class="truncate font-extrabold text-stone-900">{{ cat.name }}</h2>
                  <p class="text-xs text-stone-500">{{ cats.subsOf(cat.id).length }} {{ t.categories.subCount }}</p>
                </div>
                <button type="button" class="icon-btn" [attr.aria-label]="t.categories.rename + ' ' + cat.name" (click)="startEdit('cat:' + cat.id)"><app-icon name="pencil" [size]="18" /></button>
                <button
                  type="button"
                  class="icon-btn text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                  [disabled]="cats.isCategoryUsed(cat.id)"
                  [attr.title]="cats.isCategoryUsed(cat.id) ? t.categories.usedTooltip : t.categories.deleteCategory"
                  [attr.aria-label]="cats.isCategoryUsed(cat.id) ? t.categories.usedTooltip : t.categories.deleteCategory + ' ' + cat.name"
                  (click)="removeCategory(cat.id)"
                >
                  <app-icon name="trash" [size]="18" />
                </button>
              }
            </header>

            <ul class="divide-y divide-stone-100">
              @for (sub of cats.subsOf(cat.id); track sub.id) {
                <li class="flex items-center gap-2 px-4 py-2">
                  @if (editing() === 'sub:' + sub.id) {
                    <form class="flex flex-1 items-center gap-2" (submit)="$event.preventDefault(); saveRename(sub.id, 'sub', renameSub)">
                      <input #renameSub class="input h-10 flex-1" [value]="sub.name" [attr.aria-label]="t.categories.rename" (keydown.escape)="editing.set('')" />
                      <button type="submit" class="icon-btn text-emerald-700" [attr.aria-label]="t.common.save"><app-icon name="check" /></button>
                      <button type="button" class="icon-btn" [attr.aria-label]="t.common.cancel" (click)="editing.set('')"><app-icon name="x" /></button>
                    </form>
                  } @else {
                    <span class="flex-1 text-sm font-semibold text-stone-800">{{ sub.name }}</span>
                    @if (cats.isSubCategoryUsed(sub.id)) {
                      <span class="badge badge-stone">{{ t.categories.usedBadge }}</span>
                    }
                    <button type="button" class="icon-btn" [attr.aria-label]="t.categories.rename + ' ' + sub.name" (click)="startEdit('sub:' + sub.id)"><app-icon name="pencil" [size]="17" /></button>
                    <button
                      type="button"
                      class="icon-btn text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                      [disabled]="cats.isSubCategoryUsed(sub.id)"
                      [attr.title]="cats.isSubCategoryUsed(sub.id) ? t.categories.usedTooltip : t.categories.deleteSub"
                      [attr.aria-label]="cats.isSubCategoryUsed(sub.id) ? t.categories.usedTooltip : t.categories.deleteSub + ' ' + sub.name"
                      (click)="removeSub(sub.id)"
                    >
                      <app-icon name="trash" [size]="17" />
                    </button>
                  }
                </li>
              } @empty {
                <li class="px-4 py-6 text-center text-sm text-stone-500">{{ t.categories.noSubs }}</li>
              }
            </ul>

            <form class="flex items-center gap-2 border-t border-stone-200 bg-stone-50/60 p-3" (submit)="$event.preventDefault(); addSub(cat.id, subInput)">
              <input #subInput class="input h-11 flex-1" [placeholder]="t.categories.subName" [attr.aria-label]="t.categories.addSub + ' - ' + cat.name" autocomplete="off" />
              <button type="submit" class="btn btn-secondary h-11" [disabled]="busy() !== ''">
                <app-icon name="plus" [size]="16" /> {{ t.categories.addSub }}
              </button>
            </form>
          </section>
        }
      </div>
    }
  `,
})
export class CategoriesPage {
  protected readonly cats = inject(CategoriesService);
  private readonly toast = inject(ToastService);
  protected readonly t = T;
  protected readonly loading = fakeLoading(300);

  protected readonly addingCategory = signal(false);
  protected readonly editing = signal('');
  protected readonly busy = signal('');

  protected startEdit(key: string): void {
    this.editing.set(key);
    // focus the freshly rendered rename input
    setTimeout(() => document.querySelector<HTMLInputElement>('input[aria-label="' + T.categories.rename + '"]')?.select());
  }

  private nameTaken(name: string, scope: string[]): boolean {
    return scope.some((n) => n.trim() === name.trim());
  }

  protected async addCategory(input: HTMLInputElement): Promise<void> {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    if (this.nameTaken(name, this.cats.categories().map((c) => c.name))) {
      this.toast.show(T.categories.exists, 'error');
      return;
    }
    this.busy.set('cat');
    await this.cats.addCategory(name);
    this.busy.set('');
    input.value = '';
    this.addingCategory.set(false);
    this.toast.show(T.categories.categoryAdded);
  }

  protected async addSub(categoryId: string, input: HTMLInputElement): Promise<void> {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    if (this.nameTaken(name, this.cats.subsOf(categoryId).map((s) => s.name))) {
      this.toast.show(T.categories.exists, 'error');
      return;
    }
    this.busy.set('sub');
    await this.cats.addSubCategory(categoryId, name);
    this.busy.set('');
    input.value = '';
    this.toast.show(T.categories.subAdded);
  }

  protected async saveRename(id: string, kind: 'cat' | 'sub', input: HTMLInputElement): Promise<void> {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    if (kind === 'cat') await this.cats.renameCategory(id, name);
    else await this.cats.renameSubCategory(id, name);
    this.editing.set('');
    this.toast.show(T.categories.renamed);
  }

  protected async removeCategory(id: string): Promise<void> {
    if (this.cats.isCategoryUsed(id) || !confirm(T.categories.deleteConfirmCategory)) return;
    await this.cats.removeCategory(id);
    this.toast.show(T.categories.deleted);
  }

  protected async removeSub(id: string): Promise<void> {
    if (this.cats.isSubCategoryUsed(id) || !confirm(T.categories.deleteConfirmSub)) return;
    await this.cats.removeSubCategory(id);
    this.toast.show(T.categories.deleted);
  }
}

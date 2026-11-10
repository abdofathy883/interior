import { computed, inject, Injectable } from '@angular/core';
import { DemoStore } from '../data/store';
import { Category, Client, Expense, NewClient, NewExpense, NewPayment, Payment, ProjectStage, SubCategory } from '../models/models';
import { CategoriesService, ClientsService, ExpensesService, PaymentsService } from '../services/contracts';
import { simulate } from './simulate';

@Injectable()
export class MockClientsService extends ClientsService {
  private readonly store = inject(DemoStore);
  override readonly clients = computed(() => this.store.clients());

  override getById(id: string): Client | undefined {
    return this.store.clients().find((c) => c.id === id);
  }

  override stagesOf(clientId: string): ProjectStage[] {
    return this.store.stages().filter((s) => s.clientId === clientId).sort((a, b) => a.order - b.order);
  }

  override create(input: NewClient): Promise<Client> {
    return simulate(() => {
      const client: Client = { ...input, id: this.store.newId('c') };
      this.store.clients.update((list) => [client, ...list]);
      return client;
    });
  }

  override update(id: string, patch: Partial<NewClient>): Promise<Client> {
    return simulate(() => {
      let updated!: Client;
      this.store.clients.update((list) =>
        list.map((c) => (c.id === id ? (updated = { ...c, ...patch }) : c)),
      );
      return updated;
    });
  }
}

@Injectable()
export class MockPaymentsService extends PaymentsService {
  private readonly store = inject(DemoStore);
  override readonly payments = computed(() => this.store.payments());

  override forClient(clientId: string): Payment[] {
    return this.store
      .payments()
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  override add(input: NewPayment): Promise<Payment> {
    return simulate(() => {
      const p: Payment = { ...input, id: this.store.newId('p') };
      this.store.payments.update((list) => [...list, p]);
      return p;
    });
  }
}

@Injectable()
export class MockExpensesService extends ExpensesService {
  private readonly store = inject(DemoStore);
  override readonly expenses = computed(() => this.store.expenses());

  override forClient(clientId: string): Expense[] {
    return this.store
      .expenses()
      .filter((e) => e.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  override add(input: NewExpense): Promise<Expense> {
    return simulate(() => {
      const e: Expense = { ...input, id: this.store.newId('e') };
      this.store.expenses.update((list) => [...list, e]);
      return e;
    });
  }
}

@Injectable()
export class MockCategoriesService extends CategoriesService {
  private readonly store = inject(DemoStore);
  override readonly categories = computed(() => this.store.categories());
  override readonly subCategories = computed(() => this.store.subCategories());

  override subsOf(categoryId: string): SubCategory[] {
    return this.store.subCategories().filter((s) => s.categoryId === categoryId);
  }

  override categoryName(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.name ?? '—';
  }

  override subCategoryName(id: string): string {
    return this.store.subCategories().find((s) => s.id === id)?.name ?? '—';
  }

  override isCategoryUsed(id: string): boolean {
    return this.store.expenses().some((e) => e.categoryId === id);
  }

  override isSubCategoryUsed(id: string): boolean {
    return this.store.expenses().some((e) => e.subCategoryId === id);
  }

  override addCategory(name: string): Promise<Category> {
    return simulate(() => {
      const c: Category = { id: this.store.newId('cat'), name: name.trim() };
      this.store.categories.update((l) => [...l, c]);
      return c;
    });
  }

  override addSubCategory(categoryId: string, name: string): Promise<SubCategory> {
    return simulate(() => {
      const s: SubCategory = { id: this.store.newId('sub'), categoryId, name: name.trim() };
      this.store.subCategories.update((l) => [...l, s]);
      return s;
    });
  }

  override renameCategory(id: string, name: string): Promise<void> {
    return simulate(() => this.store.categories.update((l) => l.map((c) => (c.id === id ? { ...c, name: name.trim() } : c))));
  }

  override renameSubCategory(id: string, name: string): Promise<void> {
    return simulate(() =>
      this.store.subCategories.update((l) => l.map((s) => (s.id === id ? { ...s, name: name.trim() } : s))),
    );
  }

  override removeCategory(id: string): Promise<void> {
    return simulate(() => {
      this.store.subCategories.update((l) => l.filter((s) => s.categoryId !== id));
      this.store.categories.update((l) => l.filter((c) => c.id !== id));
    });
  }

  override removeSubCategory(id: string): Promise<void> {
    return simulate(() => this.store.subCategories.update((l) => l.filter((s) => s.id !== id)));
  }
}

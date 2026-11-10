import { effect, Injectable, signal } from '@angular/core';
import {
  AppUser,
  Category,
  Client,
  Expense,
  Payment,
  ProjectStage,
  SubCategory,
} from '../models/models';
import { buildSeed, SeedData } from './seed';

const STORAGE_KEY = 'decor-track-demo-v1';

/**
 * The single in-memory store (signals) behind every mock service.
 * Seeded on startup, persisted to localStorage so a refresh keeps demo entries.
 * Components never touch this directly - they go through the service contracts.
 */
@Injectable({ providedIn: 'root' })
export class DemoStore {
  readonly clients = signal<Client[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly subCategories = signal<SubCategory[]>([]);
  readonly stages = signal<ProjectStage[]>([]);
  readonly users = signal<AppUser[]>([]);

  constructor() {
    this.apply(this.load() ?? buildSeed());
    effect(() => this.persist());
  }

  /** Restore the seed (fresh dates relative to today). */
  reset(): void {
    this.apply(buildSeed());
  }

  newId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  private apply(d: SeedData): void {
    this.clients.set(d.clients);
    this.payments.set(d.payments);
    this.expenses.set(d.expenses);
    this.categories.set(d.categories);
    this.subCategories.set(d.subCategories);
    this.stages.set(d.stages);
    this.users.set(d.users);
  }

  private snapshot(): SeedData {
    return {
      clients: this.clients(),
      payments: this.payments(),
      expenses: this.expenses(),
      categories: this.categories(),
      subCategories: this.subCategories(),
      stages: this.stages(),
      users: this.users(),
    };
  }

  private persist(): void {
    const snap = this.snapshot();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      /* storage unavailable (private mode / quota): the demo still works in memory */
    }
  }

  private load(): SeedData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as Partial<SeedData>;
      const ok = (['clients', 'payments', 'expenses', 'categories', 'subCategories', 'stages', 'users'] as const).every(
        (k) => Array.isArray(d[k]),
      );
      return ok ? (d as SeedData) : null;
    } catch {
      return null;
    }
  }
}

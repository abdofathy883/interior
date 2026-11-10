import { Signal } from '@angular/core';
import {
  Category,
  CategoryBreakdown,
  Client,
  ClientSummary,
  DateRange,
  Expense,
  MonthlyPoint,
  NewClient,
  NewExpense,
  NewPayment,
  Payment,
  ProjectStage,
  SessionUser,
  SubCategory,
  SubCategoryTotal,
  Totals,
} from '../models/models';

/**
 * Service contracts. Components depend ONLY on these abstract classes (used as DI tokens).
 * To go real: write HTTP implementations and swap them in `core/providers.ts`.
 *
 * Read members are signals (reactive, synchronous). Write members return Promises.
 */

export abstract class AuthService {
  abstract readonly user: Signal<SessionUser | null>;
  abstract login(email: string, password: string): Promise<SessionUser>;
  abstract logout(): void;
}

export abstract class ClientsService {
  abstract readonly clients: Signal<Client[]>;
  abstract getById(id: string): Client | undefined;
  abstract stagesOf(clientId: string): ProjectStage[];
  abstract create(input: NewClient): Promise<Client>;
  abstract update(id: string, patch: Partial<NewClient>): Promise<Client>;
}

export abstract class PaymentsService {
  abstract readonly payments: Signal<Payment[]>;
  abstract forClient(clientId: string): Payment[];
  abstract add(input: NewPayment): Promise<Payment>;
}

export abstract class ExpensesService {
  abstract readonly expenses: Signal<Expense[]>;
  abstract forClient(clientId: string): Expense[];
  abstract add(input: NewExpense): Promise<Expense>;
}

export abstract class CategoriesService {
  abstract readonly categories: Signal<Category[]>;
  abstract readonly subCategories: Signal<SubCategory[]>;
  abstract subsOf(categoryId: string): SubCategory[];
  abstract categoryName(id: string): string;
  abstract subCategoryName(id: string): string;
  abstract isCategoryUsed(id: string): boolean;
  abstract isSubCategoryUsed(id: string): boolean;
  abstract addCategory(name: string): Promise<Category>;
  abstract addSubCategory(categoryId: string, name: string): Promise<SubCategory>;
  abstract renameCategory(id: string, name: string): Promise<void>;
  abstract renameSubCategory(id: string, name: string): Promise<void>;
  abstract removeCategory(id: string): Promise<void>;
  abstract removeSubCategory(id: string): Promise<void>;
}

/**
 * Read-only aggregations. All methods read signals internally, so calling them inside
 * `computed()` / templates keeps results reactive.
 *
 * Definitions (cash basis):
 *  received = sum(payments)   spent = sum(expenses)   profit = received - spent
 *  remaining = budget - received   budgetUsed% = spent / budget   expectedProfit = budget - spent
 * When a date range is given, `received`, `spent`, `profit` are for the range;
 * `remaining`, `budgetUsedPct`, `expectedProfit` always use ALL-TIME figures.
 */
export abstract class ReportsService {
  abstract summary(clientId: string, range?: DateRange): ClientSummary | undefined;
  abstract summaries(range?: DateRange): ClientSummary[];
  abstract totals(range?: DateRange): Totals;
  abstract monthly(range?: DateRange, clientId?: string): MonthlyPoint[];
  abstract categoryBreakdown(clientId?: string, range?: DateRange): CategoryBreakdown[];
  abstract subCategoryTotals(clientId?: string, range?: DateRange): SubCategoryTotal[];
}

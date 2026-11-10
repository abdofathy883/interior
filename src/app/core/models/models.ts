export type ProjectType = 'apartment' | 'villa';
export type ClientStatus = 'active' | 'completed';
export type StageStatus = 'done' | 'in-progress' | 'upcoming';
export type Role = 'admin' | 'client';

/** ISO calendar date, `YYYY-MM-DD` (local time, no timezone). */
export type IsoDate = string;

export interface Client {
  id: string;
  name: string;
  phone: string;
  projectType: ProjectType;
  location: string;
  /** EGP */
  budget: number;
  startDate: IsoDate;
  status: ClientStatus;
  /** Optional link to a portal user (AppUser.id). */
  portalUserId?: string;
}
export type NewClient = Omit<Client, 'id' | 'portalUserId'>;

/** Money received from the client. */
export interface Payment {
  id: string;
  clientId: string;
  date: IsoDate;
  amount: number;
  note?: string;
}
export type NewPayment = Omit<Payment, 'id'>;

export interface Category {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
}

/** Money out (spent on the client's project). */
export interface Expense {
  id: string;
  clientId: string;
  date: IsoDate;
  amount: number;
  categoryId: string;
  subCategoryId: string;
  note?: string;
}
export type NewExpense = Omit<Expense, 'id'>;

export interface ProjectStage {
  id: string;
  clientId: string;
  name: string;
  status: StageStatus;
  order: number;
}

/** Full user record (kept only inside the mock store). */
export interface AppUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  clientId?: string;
}

/** What the rest of the app is allowed to see about the logged-in user. */
export type SessionUser = Omit<AppUser, 'password'>;

export interface DateRange {
  from?: IsoDate;
  to?: IsoDate;
}

// ---------- Report shapes ----------

export interface ClientSummary {
  client: Client;
  budget: number;
  /** Sum of payments (in the date range, if any). */
  received: number;
  /** Sum of expenses (in the date range, if any). */
  spent: number;
  /** received - spent (cash basis). */
  profit: number;
  /** budget - ALL-TIME received (never range-filtered). */
  remaining: number;
  /** ALL-TIME spent / budget, in percent (0..n). */
  budgetUsedPct: number;
  /** budget - ALL-TIME spent. */
  expectedProfit: number;
}

export interface Totals {
  budget: number;
  received: number;
  spent: number;
  profit: number;
  remaining: number;
}

export interface MonthlyPoint {
  key: string; // YYYY-MM
  label: string;
  received: number;
  spent: number;
}

export interface SubCategoryTotal {
  subCategory: SubCategory;
  category: Category;
  amount: number;
  /** % of total spent in the scope. */
  pct: number;
}

export interface CategoryBreakdown {
  category: Category;
  amount: number;
  pct: number;
  subs: SubCategoryTotal[];
}

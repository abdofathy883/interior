import { Provider } from '@angular/core';
import {
  AuthService,
  CategoriesService,
  ClientsService,
  ExpensesService,
  PaymentsService,
  ReportsService,
} from './services/contracts';
import { MockAuthService } from './mock/mock-auth.service';
import { MockCategoriesService, MockClientsService, MockExpensesService, MockPaymentsService } from './mock/mock-data.services';
import { MockReportsService } from './mock/mock-reports.service';

/**
 * THE swap point. To use a real backend, replace each `useClass` with an HTTP-backed
 * implementation of the same abstract class (see docs/HANDOVER.md).
 */
export function provideDataServices(): Provider[] {
  return [
    { provide: AuthService, useClass: MockAuthService },
    { provide: ClientsService, useClass: MockClientsService },
    { provide: PaymentsService, useClass: MockPaymentsService },
    { provide: ExpensesService, useClass: MockExpensesService },
    { provide: CategoriesService, useClass: MockCategoriesService },
    { provide: ReportsService, useClass: MockReportsService },
  ];
}

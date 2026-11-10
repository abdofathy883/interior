import { Routes } from '@angular/router';
import { guestGuard, homeGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'تسجيل الدخول — ديكور تراك',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./layout/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        title: 'لوحة التحكم — ديكور تراك',
        loadComponent: () => import('./features/admin/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'clients',
        title: 'العملاء — ديكور تراك',
        loadComponent: () => import('./features/admin/clients/clients.page').then((m) => m.ClientsPage),
      },
      {
        path: 'clients/new',
        title: 'إضافة عميل — ديكور تراك',
        loadComponent: () => import('./features/admin/clients/client-form.page').then((m) => m.ClientFormPage),
      },
      {
        path: 'clients/:id/edit',
        title: 'تعديل عميل — ديكور تراك',
        loadComponent: () => import('./features/admin/clients/client-form.page').then((m) => m.ClientFormPage),
      },
      {
        path: 'clients/:id',
        title: 'تقرير العميل — ديكور تراك',
        loadComponent: () => import('./features/admin/client-report/client-report.page').then((m) => m.ClientReportPage),
      },
      {
        path: 'reports',
        title: 'التقارير — ديكور تراك',
        loadComponent: () => import('./features/admin/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'categories',
        title: 'التصنيفات — ديكور تراك',
        loadComponent: () => import('./features/admin/categories/categories.page').then((m) => m.CategoriesPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: 'portal',
    canActivate: [roleGuard('client')],
    loadComponent: () => import('./layout/portal-shell.component').then((m) => m.PortalShellComponent),
    children: [
      {
        path: '',
        title: 'مشروعي — ديكور تراك',
        loadComponent: () => import('./features/portal/portal-home.page').then((m) => m.PortalHomePage),
      },
      {
        path: 'payments',
        title: 'دفعاتي — ديكور تراك',
        loadComponent: () => import('./features/portal/portal-payments.page').then((m) => m.PortalPaymentsPage),
      },
      {
        path: 'spending',
        title: 'أوجه الصرف — ديكور تراك',
        loadComponent: () => import('./features/portal/portal-spending.page').then((m) => m.PortalSpendingPage),
      },
      { path: '**', redirectTo: '' },
    ],
  },
  // "/" and anything unknown: go to the right home for the current session
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
  { path: '**', canActivate: [homeGuard], children: [] },
];

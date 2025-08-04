import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'properties',
    loadComponent: () => import('./components/property-list/property-list.component').then(m => m.PropertyListComponent)
  },
  {
    path: 'properties/new',
    loadComponent: () => import('./components/property-form/property-form.component').then(m => m.PropertyFormComponent)
  },
  {
    path: 'properties/:id',
    loadComponent: () => import('./components/property-detail/property-detail.component').then(m => m.PropertyDetailComponent)
  },
  {
    path: 'properties/:id/edit',
    loadComponent: () => import('./components/property-form/property-form.component').then(m => m.PropertyFormComponent)
  },
  {
    path: 'properties/:propertyId/revenue/new',
    loadComponent: () => import('./components/revenue-form/revenue-form.component').then(m => m.RevenueFormComponent)
  },
  {
    path: 'properties/:propertyId/revenue/:id',
    loadComponent: () => import('./components/revenue-form/revenue-form.component').then(m => m.RevenueFormComponent)
  },
  {
    path: 'revenue/new',
    loadComponent: () => import('./components/revenue-form/revenue-form.component').then(m => m.RevenueFormComponent)
  },
  {
    path: 'properties/:propertyId/expenses/new',
    loadComponent: () => import('./components/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'properties/:propertyId/expenses/:id',
    loadComponent: () => import('./components/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'expenses/new',
    loadComponent: () => import('./components/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];

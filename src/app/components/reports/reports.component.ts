import { Component, inject, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PropertyService } from '../../services/property.service';
import { ExportService } from '../../services/export.service';
import { ImportService } from '../../services/import.service';
import { BackupService } from '../../services/backup.service';
import { Property, Revenue, Expense, PropertyType, RevenueType, ExpenseCategory } from '../../models/property.model';

interface PropertyReport {
  property: Property;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  roi: number;
  revenueCount: number;
  expenseCount: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reports-container">
      <div class="header">
        <h1>Financial Reports & Analytics</h1>
        <p>Comprehensive analysis of your property portfolio performance</p>
        
        <div class="header-actions">
          <button mat-raised-button color="primary" [matMenuTriggerFor]="exportMenu">
            <mat-icon>download</mat-icon>
            Export Reports
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportFinancialSummary()">
              <mat-icon>assessment</mat-icon>
              <span>Financial Summary (CSV)</span>
            </button>
            <button mat-menu-item (click)="exportProperties()">
              <mat-icon>home_work</mat-icon>
              <span>Properties (CSV)</span>
            </button>
            <button mat-menu-item (click)="exportRevenues()">
              <mat-icon>trending_up</mat-icon>
              <span>Revenues (CSV)</span>
            </button>
            <button mat-menu-item (click)="exportExpenses()">
              <mat-icon>trending_down</mat-icon>
              <span>Expenses (CSV)</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="exportAllData()">
              <mat-icon>backup</mat-icon>
              <span>Complete Backup (JSON)</span>
            </button>
          </mat-menu>

          <button mat-raised-button color="accent" [matMenuTriggerFor]="importMenu">
            <mat-icon>upload</mat-icon>
            Import Data
          </button>
          <mat-menu #importMenu="matMenu">
            <button mat-menu-item (click)="triggerFileImport('properties')">
              <mat-icon>home_work</mat-icon>
              <span>Import Properties (CSV)</span>
            </button>
            <button mat-menu-item (click)="triggerFileImport('revenues')">
              <mat-icon>trending_up</mat-icon>
              <span>Import Revenues (CSV)</span>
            </button>
            <button mat-menu-item (click)="triggerFileImport('expenses')">
              <mat-icon>trending_down</mat-icon>
              <span>Import Expenses (CSV)</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="triggerFileImport('backup')">
              <mat-icon>restore</mat-icon>
              <span>Restore Backup (JSON)</span>
            </button>
            <button mat-menu-item (click)="exportBackup()">
              <mat-icon>backup</mat-icon>
              <span>Create Backup File</span>
            </button>
            <button mat-menu-item (click)="restoreAutoBackup()">
              <mat-icon>history</mat-icon>
              <span>Restore Auto Backup</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="clearAllData()" class="danger-item">
              <mat-icon>delete_forever</mat-icon>
              <span>Clear All Data</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Filter Section -->
      <mat-card class="filter-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filter-form">
            <mat-form-field appearance="outline">
              <mat-label>Date Range</mat-label>
              <mat-select formControlName="dateRange">
                <mat-option value="all">All Time</mat-option>
                <mat-option value="ytd">Year to Date</mat-option>
                <mat-option value="last12">Last 12 Months</mat-option>
                <mat-option value="last6">Last 6 Months</mat-option>
                <mat-option value="last3">Last 3 Months</mat-option>
                <mat-option value="custom">Custom Range</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="date-range" *ngIf="filterForm.get('dateRange')?.value === 'custom'">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Property Filter</mat-label>
              <mat-select formControlName="propertyFilter">
                <mat-option value="all">All Properties</mat-option>
                @for (property of properties(); track property.id) {
                  <mat-option [value]="property.id">{{ property.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="applyFilters()">
              <mat-icon>filter_list</mat-icon>
              Apply Filters
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card revenue">
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="summary-data">
                <h3>{{ formatCurrency(totalRevenue()) }}</h3>
                <p>Total Revenue</p>
                <span class="summary-detail">{{ filteredRevenues().length }} transactions</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card expense">
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-icon">
                <mat-icon>trending_down</mat-icon>
              </div>
              <div class="summary-data">
                <h3>{{ formatCurrency(totalExpenses()) }}</h3>
                <p>Total Expenses</p>
                <span class="summary-detail">{{ filteredExpenses().length }} transactions</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card profit">
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="summary-data">
                <h3 [style.color]="netIncome() >= 0 ? '#4caf50' : '#f44336'">
                  {{ formatCurrency(netIncome()) }}
                </h3>
                <p>Net Income</p>
                <span class="summary-detail">
                  {{ formatPercentage(profitMargin()) }} margin
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card roi">
          <mat-card-content>
            <div class="summary-content">
              <div class="summary-icon">
                <mat-icon>assessment</mat-icon>
              </div>
              <div class="summary-data">
                <h3>{{ formatPercentage(averageROI()) }}</h3>
                <p>Average ROI</p>
                <span class="summary-detail">Portfolio average</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Detailed Reports -->
      <mat-tab-group class="reports-tabs">
        <!-- Property Performance Tab -->
        <mat-tab label="Property Performance">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Property Performance Analysis</mat-card-title>
                <mat-card-subtitle>Financial performance by property</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="propertyReports()" class="property-reports-table">
                    <ng-container matColumnDef="property">
                      <th mat-header-cell *matHeaderCellDef>Property</th>
                      <td mat-cell *matCellDef="let report">
                        <div class="property-cell">
                          <strong>{{ report.property.name }}</strong>
                          <span class="property-type">{{ getPropertyTypeLabel(report.property.type) }}</span>
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="revenue">
                      <th mat-header-cell *matHeaderCellDef>Revenue</th>
                      <td mat-cell *matCellDef="let report" class="amount-cell">
                        <div>{{ formatCurrency(report.totalRevenue) }}</div>
                        <small>{{ report.revenueCount }} transactions</small>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="expenses">
                      <th mat-header-cell *matHeaderCellDef>Expenses</th>
                      <td mat-cell *matCellDef="let report" class="amount-cell">
                        <div>{{ formatCurrency(report.totalExpenses) }}</div>
                        <small>{{ report.expenseCount }} transactions</small>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="netIncome">
                      <th mat-header-cell *matHeaderCellDef>Net Income</th>
                      <td mat-cell *matCellDef="let report" class="amount-cell">
                        <div [style.color]="report.netIncome >= 0 ? '#4caf50' : '#f44336'">
                          {{ formatCurrency(report.netIncome) }}
                        </div>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="roi">
                      <th mat-header-cell *matHeaderCellDef>ROI</th>
                      <td mat-cell *matCellDef="let report" class="amount-cell">
                        <div [style.color]="report.roi >= 0 ? '#4caf50' : '#f44336'">
                          {{ formatPercentage(report.roi) }}
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="propertyColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: propertyColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Monthly Trends Tab -->
        <mat-tab label="Monthly Trends">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Monthly Financial Trends</mat-card-title>
                <mat-card-subtitle>Revenue and expense trends over time</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="table-container">
                  <table mat-table [dataSource]="monthlyData()" class="monthly-table">
                    <ng-container matColumnDef="month">
                      <th mat-header-cell *matHeaderCellDef>Month</th>
                      <td mat-cell *matCellDef="let data">{{ data.month }}</td>
                    </ng-container>

                    <ng-container matColumnDef="revenue">
                      <th mat-header-cell *matHeaderCellDef>Revenue</th>
                      <td mat-cell *matCellDef="let data" class="amount-cell">
                        {{ formatCurrency(data.revenue) }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="expenses">
                      <th mat-header-cell *matHeaderCellDef>Expenses</th>
                      <td mat-cell *matCellDef="let data" class="amount-cell">
                        {{ formatCurrency(data.expenses) }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="netIncome">
                      <th mat-header-cell *matHeaderCellDef>Net Income</th>
                      <td mat-cell *matCellDef="let data" class="amount-cell">
                        <div [style.color]="data.netIncome >= 0 ? '#4caf50' : '#f44336'">
                          {{ formatCurrency(data.netIncome) }}
                        </div>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="monthlyColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: monthlyColumns;"></tr>
                  </table>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Category Analysis Tab -->
        <mat-tab label="Category Analysis">
          <div class="tab-content">
            <div class="category-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Revenue by Type</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="category-list">
                    @for (category of revenueByType(); track category.type) {
                      <div class="category-item">
                        <div class="category-info">
                          <span class="category-name">{{ getRevenueTypeLabel(category.type) }}</span>
                          <span class="category-amount">{{ formatCurrency(category.amount) }}</span>
                        </div>
                        <div class="category-bar">
                          <div class="category-fill" 
                               [style.width.%]="(category.amount / totalRevenue()) * 100">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card>
                <mat-card-header>
                  <mat-card-title>Expenses by Category</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="category-list">
                    @for (category of expensesByCategory(); track category.category) {
                      <div class="category-item">
                        <div class="category-info">
                          <span class="category-name">{{ getExpenseCategoryLabel(category.category) }}</span>
                          <span class="category-amount">{{ formatCurrency(category.amount) }}</span>
                        </div>
                        <div class="category-bar">
                          <div class="category-fill expense" 
                               [style.width.%]="(category.amount / totalExpenses()) * 100">
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
      text-align: center;
      position: relative;
    }

    .header h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2.5em;
    }

    .header p {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 1.1em;
    }

    .header-actions {
      margin-top: 16px;
    }

    .filter-card {
      margin-bottom: 32px;
    }

    .filter-form {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .date-range {
      display: flex;
      gap: 16px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .summary-card {
      height: 120px;
    }

    .summary-card.revenue {
      border-left: 4px solid #4caf50;
    }

    .summary-card.expense {
      border-left: 4px solid #f44336;
    }

    .summary-card.profit {
      border-left: 4px solid #2196f3;
    }

    .summary-card.roi {
      border-left: 4px solid #ff9800;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 100%;
    }

    .summary-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #f5f5f5;
    }

    .summary-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .summary-data h3 {
      margin: 0 0 4px 0;
      font-size: 1.5em;
      font-weight: 600;
    }

    .summary-data p {
      margin: 0 0 4px 0;
      color: #666;
      font-size: 0.9em;
    }

    .summary-detail {
      color: #999;
      font-size: 0.8em;
    }

    .reports-tabs {
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .table-container {
      overflow-x: auto;
    }

    .property-reports-table,
    .monthly-table {
      width: 100%;
    }

    .property-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .property-type {
      font-size: 0.8em;
      color: #666;
    }

    .amount-cell {
      text-align: right;
      font-weight: 500;
    }

    .amount-cell small {
      display: block;
      font-size: 0.75em;
      color: #666;
      font-weight: normal;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-name {
      font-weight: 500;
    }

    .category-amount {
      color: #666;
    }

    .category-bar {
      height: 8px;
      background-color: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-fill {
      height: 100%;
      background-color: #4caf50;
      transition: width 0.3s ease;
    }

    .category-fill.expense {
      background-color: #f44336;
    }

    @media (max-width: 768px) {
      .reports-container {
        padding: 16px;
      }

      .filter-form {
        flex-direction: column;
        align-items: stretch;
      }

      .date-range {
        flex-direction: column;
      }

      .summary-cards {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .category-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class ReportsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private readonly propertyService = inject(PropertyService);
  private readonly exportService = inject(ExportService);
  private readonly importService = inject(ImportService);
  private readonly backupService = inject(BackupService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly properties = this.propertyService.properties;
  protected readonly revenues = this.propertyService.revenues;
  protected readonly expenses = this.propertyService.expenses;

  protected readonly filterForm: FormGroup;
  protected readonly dateRangeSignal = signal<{ start?: Date; end?: Date }>({});

  protected readonly propertyColumns = ['property', 'revenue', 'expenses', 'netIncome', 'roi'];
  protected readonly monthlyColumns = ['month', 'revenue', 'expenses', 'netIncome'];

  constructor() {
    this.filterForm = this.formBuilder.group({
      dateRange: ['all'],
      startDate: [''],
      endDate: [''],
      propertyFilter: ['all']
    });
  }

  protected readonly filteredRevenues = computed(() => {
    const revenues = this.revenues();
    const filter = this.filterForm.value;
    const dateRange = this.dateRangeSignal();
    
    return revenues.filter(revenue => {
      // Property filter
      if (filter.propertyFilter !== 'all' && revenue.propertyId !== filter.propertyFilter) {
        return false;
      }
      
      // Date filter
      if (dateRange.start || dateRange.end) {
        const revenueDate = new Date(revenue.date);
        if (dateRange.start && revenueDate < dateRange.start) return false;
        if (dateRange.end && revenueDate > dateRange.end) return false;
      }
      
      return true;
    });
  });

  protected readonly filteredExpenses = computed(() => {
    const expenses = this.expenses();
    const filter = this.filterForm.value;
    const dateRange = this.dateRangeSignal();
    
    return expenses.filter(expense => {
      // Property filter
      if (filter.propertyFilter !== 'all' && expense.propertyId !== filter.propertyFilter) {
        return false;
      }
      
      // Date filter
      if (dateRange.start || dateRange.end) {
        const expenseDate = new Date(expense.date);
        if (dateRange.start && expenseDate < dateRange.start) return false;
        if (dateRange.end && expenseDate > dateRange.end) return false;
      }
      
      return true;
    });
  });

  protected readonly totalRevenue = computed(() => {
    return this.filteredRevenues().reduce((sum, revenue) => sum + revenue.amount, 0);
  });

  protected readonly totalExpenses = computed(() => {
    return this.filteredExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  });

  protected readonly netIncome = computed(() => {
    return this.totalRevenue() - this.totalExpenses();
  });

  protected readonly profitMargin = computed(() => {
    const revenue = this.totalRevenue();
    return revenue > 0 ? (this.netIncome() / revenue) * 100 : 0;
  });

  protected readonly averageROI = computed(() => {
    const reports = this.propertyReports();
    if (reports.length === 0) return 0;
    const totalROI = reports.reduce((sum, report) => sum + report.roi, 0);
    return totalROI / reports.length;
  });

  protected readonly propertyReports = computed(() => {
    const properties = this.properties();
    const revenues = this.filteredRevenues();
    const expenses = this.filteredExpenses();

    return properties.map(property => {
      const propertyRevenues = revenues.filter(r => r.propertyId === property.id);
      const propertyExpenses = expenses.filter(e => e.propertyId === property.id);
      
      const totalRevenue = propertyRevenues.reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = propertyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const netIncome = totalRevenue - totalExpenses;
      const roi = property.purchasePrice > 0 ? (netIncome / property.purchasePrice) * 100 : 0;

      return {
        property,
        totalRevenue,
        totalExpenses,
        netIncome,
        roi,
        revenueCount: propertyRevenues.length,
        expenseCount: propertyExpenses.length
      };
    }).sort((a, b) => b.netIncome - a.netIncome);
  });

  protected readonly monthlyData = computed(() => {
    const revenues = this.filteredRevenues();
    const expenses = this.filteredExpenses();
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

    // Process revenues
    revenues.forEach(revenue => {
      const month = new Date(revenue.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const existing = monthlyMap.get(month) || { revenue: 0, expenses: 0 };
      monthlyMap.set(month, { ...existing, revenue: existing.revenue + revenue.amount });
    });

    // Process expenses
    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const existing = monthlyMap.get(month) || { revenue: 0, expenses: 0 };
      monthlyMap.set(month, { ...existing, expenses: existing.expenses + expense.amount });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        netIncome: data.revenue - data.expenses
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  });

  protected readonly revenueByType = computed(() => {
    const revenues = this.filteredRevenues();
    const typeMap = new Map<string, number>();

    revenues.forEach(revenue => {
      const existing = typeMap.get(revenue.type) || 0;
      typeMap.set(revenue.type, existing + revenue.amount);
    });

    return Array.from(typeMap.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  protected readonly expensesByCategory = computed(() => {
    const expenses = this.filteredExpenses();
    const categoryMap = new Map<string, number>();

    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, existing + expense.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  protected applyFilters(): void {
    const dateRange = this.filterForm.get('dateRange')?.value;
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (dateRange) {
      case 'ytd':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      case 'last12':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        end = now;
        break;
      case 'last6':
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        end = now;
        break;
      case 'last3':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        end = now;
        break;
      case 'custom':
        start = this.filterForm.get('startDate')?.value;
        end = this.filterForm.get('endDate')?.value;
        break;
      default:
        start = undefined;
        end = undefined;
    }

    this.dateRangeSignal.set({ start, end });
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  protected formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value / 100);
  }

  protected getPropertyTypeLabel(type: PropertyType): string {
    const typeMap = {
      [PropertyType.APARTMENT]: 'Apartment',
      [PropertyType.HOUSE]: 'House',
      [PropertyType.CONDO]: 'Condo',
      [PropertyType.TOWNHOUSE]: 'Townhouse',
      [PropertyType.STUDIO]: 'Studio',
      [PropertyType.OTHER]: 'Other'
    };
    return typeMap[type] || type;
  }

  protected getRevenueTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      rent: 'Rent',
      late_fee: 'Late Fee',
      security_deposit: 'Security Deposit',
      pet_fee: 'Pet Fee',
      other: 'Other'
    };
    return typeMap[type] || type;
  }

  protected getExpenseCategoryLabel(category: string): string {
    const categoryMap: { [key: string]: string } = {
      maintenance: 'Maintenance',
      repairs: 'Repairs',
      insurance: 'Insurance',
      property_tax: 'Property Tax',
      utilities: 'Utilities',
      property_management: 'Property Management',
      marketing: 'Marketing',
      legal_fees: 'Legal Fees',
      mortgage: 'Mortgage',
      other: 'Other'
    };
    return categoryMap[category] || category;
  }

  // Export methods
  protected exportFinancialSummary(): void {
    try {
      this.exportService.exportFinancialSummaryCSV(
        this.properties(),
        this.filteredRevenues(),
        this.filteredExpenses()
      );
      this.snackBar.open('Financial summary exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting financial summary', 'Close', { duration: 3000 });
    }
  }

  protected exportProperties(): void {
    try {
      this.exportService.exportPropertiesCSV(this.properties());
      this.snackBar.open('Properties exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting properties', 'Close', { duration: 3000 });
    }
  }

  protected exportRevenues(): void {
    try {
      this.exportService.exportRevenuesCSV(this.filteredRevenues(), this.properties());
      this.snackBar.open('Revenues exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting revenues', 'Close', { duration: 3000 });
    }
  }

  protected exportExpenses(): void {
    try {
      this.exportService.exportExpensesCSV(this.filteredExpenses(), this.properties());
      this.snackBar.open('Expenses exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting expenses', 'Close', { duration: 3000 });
    }
  }

  protected exportAllData(): void {
    try {
      this.exportService.exportAllDataJSON({
        properties: this.properties(),
        revenues: this.revenues(),
        expenses: this.expenses()
      });
      this.snackBar.open('Complete backup exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting backup', 'Close', { duration: 3000 });
    }
  }

  // Import Methods
  protected triggerFileImport(type: 'properties' | 'revenues' | 'expenses' | 'backup'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'backup' ? '.json' : '.csv';
    input.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.handleFileImport(file, type);
      }
    });
    input.click();
  }

  private async handleFileImport(file: File, type: 'properties' | 'revenues' | 'expenses' | 'backup'): Promise<void> {
    try {
      const content = await this.readFileContent(file);
      let result;

      switch (type) {
        case 'properties':
          result = await this.importService.importPropertiesFromCSV(content);
          break;
        case 'revenues':
          result = await this.importService.importRevenuesFromCSV(content);
          break;
        case 'expenses':
          result = await this.importService.importExpensesFromCSV(content);
          break;
        case 'backup':
          result = await this.importService.importBackupFromJSON(content);
          break;
        default:
          throw new Error('Invalid import type');
      }

      if (result.success) {
        this.snackBar.open(result.message, 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open(result.message, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }

      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }

    } catch (error) {
      this.snackBar.open(
        `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Close',
        { 
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  protected clearAllData(): void {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      this.propertyService.clearAllData();
      this.snackBar.open('All data cleared successfully', 'Close', { duration: 3000 });
    }
  }

  protected exportBackup(): void {
    try {
      this.backupService.exportBackup();
      this.snackBar.open('Backup file created successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error creating backup file', 'Close', { duration: 3000 });
    }
  }

  protected async restoreAutoBackup(): Promise<void> {
    try {
      const backupInfo = this.backupService.getAutoBackupInfo();
      
      if (!backupInfo.hasBackup) {
        this.snackBar.open('No automatic backup found', 'Close', { duration: 3000 });
        return;
      }

      const confirmed = confirm(
        `Restore from automatic backup created ${backupInfo.metadata?.createdAt ? 
          new Date(backupInfo.metadata.createdAt).toLocaleString() : 'recently'}? This will replace all current data.`
      );

      if (!confirmed) return;

      const result = await this.backupService.restoreAutoBackup();
      
      if (result.success) {
        this.snackBar.open(result.message, 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open(result.message, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } catch (error) {
      this.snackBar.open('Error restoring backup', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
}

import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { PropertyService } from '../../services/property.service';
import { Revenue, Expense } from '../../models/property.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Property Portfolio Dashboard</h1>
        <button mat-raised-button color="primary" routerLink="/properties/new">
          <mat-icon>add</mat-icon>
          Add Property
        </button>
      </div>

      <!-- Key Metrics Grid -->
      <mat-grid-list cols="4" rowHeight="150px" gutterSize="16px" class="metrics-grid">
        <mat-grid-tile>
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-content">
                <mat-icon class="metric-icon">home</mat-icon>
                <div class="metric-details">
                  <div class="metric-value">{{ propertyService.activePropertiesCount() }}</div>
                  <div class="metric-label">Active Properties</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-content">
                <mat-icon class="metric-icon income">attach_money</mat-icon>
                <div class="metric-details">
                  <div class="metric-value">{{ formatCurrency(totalRevenue()) }}</div>
                  <div class="metric-label">Total Revenue</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-content">
                <mat-icon class="metric-icon expense">money_off</mat-icon>
                <div class="metric-details">
                  <div class="metric-value">{{ formatCurrency(totalExpenses()) }}</div>
                  <div class="metric-label">Total Expenses</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>

        <mat-grid-tile>
          <mat-card class="metric-card">
            <mat-card-content>
              <div class="metric-content">
                <mat-icon class="metric-icon" [class.profit]="propertyService.totalNetIncome() >= 0" [class.loss]="propertyService.totalNetIncome() < 0">
                  {{ propertyService.totalNetIncome() >= 0 ? 'trending_up' : 'trending_down' }}
                </mat-icon>
                <div class="metric-details">
                  <div class="metric-value" [class.profit]="propertyService.totalNetIncome() >= 0" [class.loss]="propertyService.totalNetIncome() < 0">
                    {{ formatCurrency(propertyService.totalNetIncome()) }}
                  </div>
                  <div class="metric-label">Net Income</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>

      <!-- Properties Overview -->
      <div class="properties-section">
        <div class="section-header">
          <h2>Properties Overview</h2>
          <button mat-button routerLink="/properties">View All</button>
        </div>

        <div class="properties-grid">
          @for (financial of topPerformingProperties(); track financial.property.id) {
            <mat-card class="property-card" [routerLink]="['/properties', financial.property.id]">
              <mat-card-header>
                <mat-card-title>{{ financial.property.name }}</mat-card-title>
                <mat-card-subtitle>{{ financial.property.address }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="property-metrics">
                  <div class="property-metric">
                    <span class="label">Monthly Rent:</span>
                    <span class="value">{{ formatCurrency(financial.property.monthlyRent) }}</span>
                  </div>
                  <div class="property-metric">
                    <span class="label">Net Income:</span>
                    <span class="value" [class.profit]="financial.netIncome >= 0" [class.loss]="financial.netIncome < 0">
                      {{ formatCurrency(financial.netIncome) }}
                    </span>
                  </div>
                  <div class="property-metric">
                    <span class="label">ROI:</span>
                    <span class="value" [class.profit]="financial.roi >= 0" [class.loss]="financial.roi < 0">
                      {{ financial.roi.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <mat-card class="empty-state">
              <mat-card-content>
                <mat-icon>home_work</mat-icon>
                <h3>No Properties Yet</h3>
                <p>Add your first property to start tracking your rental income and expenses.</p>
                <button mat-raised-button color="primary" routerLink="/properties/new">
                  Add Your First Property
                </button>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <button mat-stroked-button routerLink="/revenue/new">
            <mat-icon>payment</mat-icon>
            Record Revenue
          </button>
          <button mat-stroked-button routerLink="/expenses/new">
            <mat-icon>receipt</mat-icon>
            Add Expense
          </button>
          <button mat-stroked-button routerLink="/reports">
            <mat-icon>assessment</mat-icon>
            View Reports
          </button>
          <button mat-stroked-button (click)="loadSampleData()">
            <mat-icon>data_usage</mat-icon>
            Load Sample Data
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      margin: 0;
      color: var(--primary-color);
    }

    .metrics-grid {
      margin-bottom: var(--spacing-xl);
    }

    .metric-card {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
    }

    .metric-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--text-secondary);
    }

    .metric-icon.income {
      color: var(--success-color);
    }

    .metric-icon.expense {
      color: var(--error-color);
    }

    .metric-icon.profit {
      color: var(--success-color);
    }

    .metric-icon.loss {
      color: var(--error-color);
    }

    .metric-details {
      text-align: left;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .metric-value.profit {
      color: var(--success-color);
    }

    .metric-value.loss {
      color: var(--error-color);
    }

    .metric-label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .properties-section {
      margin-bottom: var(--spacing-xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h2 {
      margin: 0;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-md);
    }

    .property-card {
      cursor: pointer;
      transition: var(--transition-normal);
    }

    .property-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px var(--shadow-medium);
    }

    .property-metrics {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .property-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .property-metric .label {
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
    }

    .property-metric .value {
      font-weight: var(--font-weight-bold);
    }

    .property-metric .value.profit {
      color: var(--success-color);
    }

    .property-metric .value.loss {
      color: var(--error-color);
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xxl) var(--spacing-lg);
      grid-column: 1 / -1;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-disabled);
      margin-bottom: var(--spacing-md);
    }

    .empty-state h3 {
      margin: var(--spacing-md) 0 var(--spacing-sm) 0;
      color: var(--text-secondary);
    }

    .empty-state p {
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
    }

    .quick-actions h2 {
      margin-bottom: var(--spacing-md);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .actions-grid button {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: var(--spacing-md);
      }

      .dashboard-header {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: stretch;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }

      .properties-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  protected readonly propertyService = inject(PropertyService);

  protected readonly totalRevenue = computed(() => 
    this.propertyService.revenues().reduce((sum: number, revenue: Revenue) => sum + revenue.amount, 0)
  );

  protected readonly totalExpenses = computed(() => 
    this.propertyService.expenses().reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
  );

  protected readonly topPerformingProperties = computed(() => 
    this.propertyService.getAllPropertyFinancials()
      .sort((a: any, b: any) => b.netIncome - a.netIncome)
      .slice(0, 6)
  );

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected loadSampleData(): void {
    this.propertyService.loadSampleData();
  }
}

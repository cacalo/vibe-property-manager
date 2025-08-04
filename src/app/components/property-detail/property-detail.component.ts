import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { PropertyService } from '../../services/property.service';
import { Property, Revenue, Expense, PropertyType } from '../../models/property.model';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule
  ],
  template: `
    <div class="property-detail-container" *ngIf="property()">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="property-info">
            <h1>{{ property()?.name }}</h1>
            <p class="address">{{ property()?.address }}</p>
            <div class="chips">
              <mat-chip [style.background-color]="getPropertyTypeColor()">
                {{ getPropertyTypeLabel() }}
              </mat-chip>
              <mat-chip [color]="property()?.isActive ? 'primary' : 'warn'">
                {{ property()?.isActive ? 'Active' : 'Inactive' }}
              </mat-chip>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button mat-button [matMenuTriggerFor]="menu" class="more-button">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="editProperty()">
              <mat-icon>edit</mat-icon>
              <span>Edit Property</span>
            </button>
            <button mat-menu-item (click)="addRevenue()">
              <mat-icon>attach_money</mat-icon>
              <span>Add Revenue</span>
            </button>
            <button mat-menu-item (click)="addExpense()">
              <mat-icon>receipt</mat-icon>
              <span>Add Expense</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="toggleActiveStatus()" 
                    [style.color]="property()?.isActive ? '#f44336' : '#4caf50'">
              <mat-icon>{{ property()?.isActive ? 'pause' : 'play_arrow' }}</mat-icon>
              <span>{{ property()?.isActive ? 'Deactivate' : 'Activate' }}</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Financial Summary Cards -->
      <div class="summary-cards">
        <mat-card class="metric-card revenue">
          <mat-card-content>
            <div class="metric-content">
              <div class="metric-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="metric-data">
                <h3>{{ formatCurrency(propertyFinancials()?.totalRevenue || 0) }}</h3>
                <p>Total Revenue</p>
                <span class="metric-detail">{{ propertyRevenues().length }} transactions</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card expense">
          <mat-card-content>
            <div class="metric-content">
              <div class="metric-icon">
                <mat-icon>trending_down</mat-icon>
              </div>
              <div class="metric-data">
                <h3>{{ formatCurrency(propertyFinancials()?.totalExpenses || 0) }}</h3>
                <p>Total Expenses</p>
                <span class="metric-detail">{{ propertyExpenses().length }} transactions</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card profit">
          <mat-card-content>
            <div class="metric-content">
              <div class="metric-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="metric-data">
                <h3 [style.color]="(propertyFinancials()?.netIncome || 0) >= 0 ? '#4caf50' : '#f44336'">
                  {{ formatCurrency(propertyFinancials()?.netIncome || 0) }}
                </h3>
                <p>Net Income</p>
                <span class="metric-detail">
                  {{ formatPercentage((propertyFinancials()?.netIncome || 0) / (propertyFinancials()?.totalRevenue || 1) * 100) }} margin
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card roi">
          <mat-card-content>
            <div class="metric-content">
              <div class="metric-icon">
                <mat-icon>assessment</mat-icon>
              </div>
              <div class="metric-data">
                <h3>{{ formatPercentage(propertyFinancials()?.roi || 0) }}</h3>
                <p>Return on Investment</p>
                <span class="metric-detail">Annualized</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Property Details and Financial Data -->
      <mat-tab-group class="detail-tabs">
        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="overview-grid">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Property Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Type:</label>
                      <span>{{ getPropertyTypeLabel() }}</span>
                    </div>
                    <div class="info-item">
                      <label>Purchase Price:</label>
                      <span>{{ formatCurrency(property()?.purchasePrice || 0) }}</span>
                    </div>
                    <div class="info-item">
                      <label>Monthly Rent:</label>
                      <span>{{ formatCurrency(property()?.monthlyRent || 0) }}</span>
                    </div>
                    <div class="info-item">
                      <label>Date Acquired:</label>
                      <span>{{ formatDate(property()?.dateAcquired) }}</span>
                    </div>
                    <div class="info-item" *ngIf="property()?.description">
                      <label>Description:</label>
                      <span>{{ property()?.description }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card *ngIf="property()?.tenantName">
                <mat-card-header>
                  <mat-card-title>Tenant Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Tenant Name:</label>
                      <span>{{ property()?.tenantName }}</span>
                    </div>
                    <div class="info-item" *ngIf="property()?.leaseStartDate">
                      <label>Lease Start:</label>
                      <span>{{ formatDate(property()?.leaseStartDate) }}</span>
                    </div>
                    <div class="info-item" *ngIf="property()?.leaseEndDate">
                      <label>Lease End:</label>
                      <span>{{ formatDate(property()?.leaseEndDate) }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Revenue Tab -->
        <mat-tab label="Revenue">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Revenue History</h2>
              <button mat-raised-button color="primary" (click)="addRevenue()">
                <mat-icon>add</mat-icon>
                Add Revenue
              </button>
            </div>

            <mat-card>
              <mat-card-content>
                <div class="table-container" *ngIf="propertyRevenues().length > 0; else noRevenue">
                  <table mat-table [dataSource]="propertyRevenues()" class="revenue-table">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let revenue">{{ formatDate(revenue.date) }}</td>
                    </ng-container>

                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let revenue">
                        <mat-chip class="type-chip">{{ getRevenueTypeLabel(revenue.type) }}</mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let revenue" class="amount-cell">
                        {{ formatCurrency(revenue.amount) }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="description">
                      <th mat-header-cell *matHeaderCellDef>Description</th>
                      <td mat-cell *matCellDef="let revenue">{{ revenue.description || '-' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let revenue">
                        <button mat-icon-button [matMenuTriggerFor]="revenueMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #revenueMenu="matMenu">
                          <button mat-menu-item (click)="editRevenue(revenue)">
                            <mat-icon>edit</mat-icon>
                            <span>Edit</span>
                          </button>
                          <button mat-menu-item (click)="deleteRevenue(revenue.id)" class="delete-action">
                            <mat-icon>delete</mat-icon>
                            <span>Delete</span>
                          </button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="revenueColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: revenueColumns;"></tr>
                  </table>
                </div>

                <ng-template #noRevenue>
                  <div class="empty-state">
                    <mat-icon>attach_money</mat-icon>
                    <h3>No revenue recorded</h3>
                    <p>Start tracking income for this property by adding your first revenue entry.</p>
                    <button mat-raised-button color="primary" (click)="addRevenue()">
                      Add Revenue
                    </button>
                  </div>
                </ng-template>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Expenses Tab -->
        <mat-tab label="Expenses">
          <div class="tab-content">
            <div class="tab-header">
              <h2>Expense History</h2>
              <button mat-raised-button color="primary" (click)="addExpense()">
                <mat-icon>add</mat-icon>
                Add Expense
              </button>
            </div>

            <mat-card>
              <mat-card-content>
                <div class="table-container" *ngIf="propertyExpenses().length > 0; else noExpenses">
                  <table mat-table [dataSource]="propertyExpenses()" class="expense-table">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let expense">{{ formatDate(expense.date) }}</td>
                    </ng-container>

                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let expense">
                        <mat-chip class="category-chip">{{ getExpenseCategoryLabel(expense.category) }}</mat-chip>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let expense" class="amount-cell">
                        {{ formatCurrency(expense.amount) }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="description">
                      <th mat-header-cell *matHeaderCellDef>Description</th>
                      <td mat-cell *matCellDef="let expense">{{ expense.description || '-' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let expense">
                        <button mat-icon-button [matMenuTriggerFor]="expenseMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #expenseMenu="matMenu">
                          <button mat-menu-item (click)="editExpense(expense)">
                            <mat-icon>edit</mat-icon>
                            <span>Edit</span>
                          </button>
                          <button mat-menu-item (click)="deleteExpense(expense.id)" class="delete-action">
                            <mat-icon>delete</mat-icon>
                            <span>Delete</span>
                          </button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="expenseColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: expenseColumns;"></tr>
                  </table>
                </div>

                <ng-template #noExpenses>
                  <div class="empty-state">
                    <mat-icon>receipt</mat-icon>
                    <h3>No expenses recorded</h3>
                    <p>Track maintenance, repairs, and other costs associated with this property.</p>
                    <button mat-raised-button color="primary" (click)="addExpense()">
                      Add Expense
                    </button>
                  </div>
                </ng-template>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

    <div class="empty-state" *ngIf="!property()">
      <mat-icon>home_work</mat-icon>
      <h2>Property not found</h2>
      <p>The requested property could not be found.</p>
      <button mat-raised-button color="primary" (click)="goBack()">
        Go Back to Properties
      </button>
    </div>
  `,
  styles: [`
    .property-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      gap: 16px;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }

    .property-info h1 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 2em;
    }

    .address {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 1.1em;
    }

    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .more-button {
      min-width: 48px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      height: 120px;
    }

    .metric-card.revenue {
      border-left: 4px solid #4caf50;
    }

    .metric-card.expense {
      border-left: 4px solid #f44336;
    }

    .metric-card.profit {
      border-left: 4px solid #2196f3;
    }

    .metric-card.roi {
      border-left: 4px solid #ff9800;
    }

    .metric-content {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 100%;
    }

    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: #f5f5f5;
    }

    .metric-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .metric-data h3 {
      margin: 0 0 4px 0;
      font-size: 1.5em;
      font-weight: 600;
    }

    .metric-data p {
      margin: 0 0 4px 0;
      color: #666;
      font-size: 0.9em;
    }

    .metric-detail {
      color: #999;
      font-size: 0.8em;
    }

    .detail-tabs {
      margin-bottom: 24px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .tab-header h2 {
      margin: 0;
      color: #333;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-grid {
      display: grid;
      gap: 16px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item label {
      font-weight: 500;
      color: #666;
      min-width: 120px;
    }

    .info-item span {
      text-align: right;
      flex: 1;
    }

    .table-container {
      overflow-x: auto;
    }

    .revenue-table,
    .expense-table {
      width: 100%;
    }

    .amount-cell {
      text-align: right;
      font-weight: 500;
    }

    .type-chip,
    .category-chip {
      font-size: 0.75em;
    }

    .delete-action {
      color: #f44336;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #ddd;
    }

    .empty-state h2,
    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #999;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    @media (max-width: 768px) {
      .property-detail-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-content {
        flex-direction: column;
        gap: 12px;
      }

      .property-info h1 {
        font-size: 1.5em;
      }

      .summary-cards {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }

      .tab-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }

      .tab-header button {
        width: 100%;
      }

      .overview-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .info-item span {
        text-align: left;
      }
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly property = signal<Property | null>(null);
  protected currentPropertyId: string | null = null;

  protected readonly propertyFinancials = computed(() => {
    const prop = this.property();
    return prop ? this.propertyService.getPropertyFinancials(prop.id) : null;
  });

  protected readonly propertyRevenues = computed(() => {
    const prop = this.property();
    return prop ? this.propertyService.getRevenuesForProperty(prop.id) : [];
  });

  protected readonly propertyExpenses = computed(() => {
    const prop = this.property();
    return prop ? this.propertyService.getExpensesForProperty(prop.id) : [];
  });

  protected readonly revenueColumns = ['date', 'type', 'amount', 'description', 'actions'];
  protected readonly expenseColumns = ['date', 'category', 'amount', 'description', 'actions'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentPropertyId = id;
      this.loadProperty(id);
    }
  }

  private loadProperty(id: string): void {
    const property = this.propertyService.getProperty(id);
    this.property.set(property || null);
  }

  protected getPropertyTypeLabel(): string {
    const type = this.property()?.type;
    switch (type) {
      case PropertyType.APARTMENT: return 'Apartment';
      case PropertyType.HOUSE: return 'House';
      case PropertyType.CONDO: return 'Condo';
      case PropertyType.TOWNHOUSE: return 'Townhouse';
      case PropertyType.STUDIO: return 'Studio';
      case PropertyType.OTHER: return 'Other';
      default: return 'Unknown';
    }
  }

  protected getPropertyTypeColor(): string {
    const type = this.property()?.type;
    switch (type) {
      case PropertyType.APARTMENT: return '#e3f2fd';
      case PropertyType.HOUSE: return '#f3e5f5';
      case PropertyType.CONDO: return '#e8f5e8';
      case PropertyType.TOWNHOUSE: return '#fff3e0';
      case PropertyType.STUDIO: return '#fce4ec';
      case PropertyType.OTHER: return '#f5f5f5';
      default: return '#f5f5f5';
    }
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

  protected formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected editProperty(): void {
    this.router.navigate(['/properties', this.currentPropertyId, 'edit']);
  }

  protected addRevenue(): void {
    this.router.navigate(['/properties', this.currentPropertyId, 'revenue', 'new']);
  }

  protected addExpense(): void {
    this.router.navigate(['/properties', this.currentPropertyId, 'expenses', 'new']);
  }

  protected editRevenue(revenue: Revenue): void {
    this.router.navigate(['/properties', this.currentPropertyId, 'revenue', revenue.id]);
  }

  protected editExpense(expense: Expense): void {
    this.router.navigate(['/properties', this.currentPropertyId, 'expenses', expense.id]);
  }

  protected deleteRevenue(revenueId: string): void {
    if (confirm('Are you sure you want to delete this revenue entry?')) {
      this.propertyService.deleteRevenue(revenueId);
      this.snackBar.open('Revenue deleted successfully', 'Close', { duration: 3000 });
    }
  }

  protected deleteExpense(expenseId: string): void {
    if (confirm('Are you sure you want to delete this expense entry?')) {
      this.propertyService.deleteExpense(expenseId);
      this.snackBar.open('Expense deleted successfully', 'Close', { duration: 3000 });
    }
  }

  protected toggleActiveStatus(): void {
    const property = this.property();
    if (property && this.currentPropertyId) {
      const newStatus = !property.isActive;
      this.propertyService.updateProperty(this.currentPropertyId, { isActive: newStatus });
      this.loadProperty(this.currentPropertyId);
      this.snackBar.open(
        `Property ${newStatus ? 'activated' : 'deactivated'} successfully`,
        'Close',
        { duration: 3000 }
      );
    }
  }

  protected goBack(): void {
    this.router.navigate(['/properties']);
  }
}

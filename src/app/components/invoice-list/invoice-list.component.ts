import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../services/invoice.service';
import { PropertyService } from '../../services/property.service';
import { Invoice, InvoiceStatus } from '../../models/property.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="invoice-container">
      <div class="header">
        <h1>Invoice Management</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/invoices/new">
            <mat-icon>add</mat-icon>
            Create Invoice
          </button>
          <button mat-stroked-button (click)="loadSampleData()">
            <mat-icon>data_usage</mat-icon>
            Load Sample Data
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon class="summary-icon pending">receipt</mat-icon>
              <div class="summary-details">
                <div class="summary-value">{{ invoiceService.pendingInvoices().length }}</div>
                <div class="summary-label">Pending Invoices</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon class="summary-icon overdue">warning</mat-icon>
              <div class="summary-details">
                <div class="summary-value">{{ invoiceService.overdueInvoices().length }}</div>
                <div class="summary-label">Overdue Invoices</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon class="summary-icon outstanding">attach_money</mat-icon>
              <div class="summary-details">
                <div class="summary-value">{{ formatCurrency(invoiceService.totalOutstanding()) }}</div>
                <div class="summary-label">Total Outstanding</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-content">
              <mat-icon class="summary-icon total">description</mat-icon>
              <div class="summary-details">
                <div class="summary-value">{{ invoiceService.invoices().length }}</div>
                <div class="summary-label">Total Invoices</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Invoices Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>All Invoices</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (invoiceService.invoices().length > 0) {
            <table mat-table [dataSource]="invoiceService.invoices()" class="invoice-table">
              <!-- Invoice Number Column -->
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                <td mat-cell *matCellDef="let invoice">
                  <strong>{{ invoice.invoiceNumber }}</strong>
                </td>
              </ng-container>

              <!-- Property Column -->
              <ng-container matColumnDef="property">
                <th mat-header-cell *matHeaderCellDef>Property</th>
                <td mat-cell *matCellDef="let invoice">
                  <div class="property-info">
                    <div class="property-name">{{ getPropertyName(invoice.propertyId) }}</div>
                    <div class="tenant-name">{{ invoice.tenantName }}</div>
                  </div>
                </td>
              </ng-container>

              <!-- Period Column -->
              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let invoice">
                  <div class="period-info">
                    {{ formatDate(invoice.rentPeriodStart) }} - {{ formatDate(invoice.rentPeriodEnd) }}
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let invoice">
                  <div class="amount-info">
                    <div class="net-amount">{{ formatCurrency(invoice.netAmount) }}</div>
                    @if (invoice.totalChargeableExpenses > 0 || invoice.totalDeductibleExpenses > 0) {
                      <div class="amount-breakdown">
                        Rent: {{ formatCurrency(invoice.monthlyRent) }}
                        @if (invoice.totalChargeableExpenses > 0) {
                          <br>+{{ formatCurrency(invoice.totalChargeableExpenses) }} charges
                        }
                        @if (invoice.totalDeductibleExpenses > 0) {
                          <br>-{{ formatCurrency(invoice.totalDeductibleExpenses) }} deductions
                        }
                      </div>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Due Date Column -->
              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef>Due Date</th>
                <td mat-cell *matCellDef="let invoice">
                  <div class="due-date" [class.overdue]="isOverdue(invoice)">
                    {{ formatDate(invoice.dueDate) }}
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let invoice">
                  <mat-chip [class]="getStatusClass(invoice.status)">
                    {{ getStatusLabel(invoice.status) }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let invoice">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item [routerLink]="['/invoices', invoice.id]">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    <button mat-menu-item [routerLink]="['/invoices', invoice.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                      Edit
                    </button>
                    @if (invoice.status !== 'paid') {
                      <button mat-menu-item (click)="markAsPaid(invoice)">
                        <mat-icon>check_circle</mat-icon>
                        Mark as Paid
                      </button>
                    }
                    <button mat-menu-item (click)="deleteInvoice(invoice)">
                      <mat-icon>delete</mat-icon>
                      Delete
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          } @else {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <h3>No Invoices Yet</h3>
              <p>Create your first invoice to start tracking rental payments and expenses.</p>
              <button mat-raised-button color="primary" routerLink="/invoices/new">
                Create First Invoice
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .invoice-container {
      padding: var(--spacing-lg);
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .header h1 {
      margin: 0;
      color: var(--primary-color);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .summary-card {
      cursor: default;
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .summary-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .summary-icon.pending { color: var(--warning-color); }
    .summary-icon.overdue { color: var(--error-color); }
    .summary-icon.outstanding { color: var(--success-color); }
    .summary-icon.total { color: var(--primary-color); }

    .summary-details {
      text-align: left;
    }

    .summary-value {
      font-size: 24px;
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--spacing-xs);
    }

    .summary-label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .table-card {
      overflow-x: auto;
    }

    .invoice-table {
      width: 100%;
    }

    .property-info {
      display: flex;
      flex-direction: column;
    }

    .property-name {
      font-weight: var(--font-weight-medium);
    }

    .tenant-name {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .period-info {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .amount-info {
      text-align: right;
    }

    .net-amount {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-md);
    }

    .amount-breakdown {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin-top: var(--spacing-xs);
    }

    .due-date {
      font-size: var(--font-size-sm);
    }

    .due-date.overdue {
      color: var(--error-color);
      font-weight: var(--font-weight-medium);
    }

    .status-chip {
      font-size: var(--font-size-xs);
    }

    .status-chip.draft { background-color: var(--text-disabled); color: white; }
    .status-chip.sent { background-color: var(--warning-color); color: white; }
    .status-chip.viewed { background-color: var(--primary-color); color: white; }
    .status-chip.paid { background-color: var(--success-color); color: white; }
    .status-chip.overdue { background-color: var(--error-color); color: white; }
    .status-chip.disputed { background-color: var(--purple-color); color: white; }
    .status-chip.cancelled { background-color: var(--text-secondary); color: white; }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xxl);
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

    @media (max-width: 768px) {
      .invoice-container {
        padding: var(--spacing-md);
      }

      .header {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: stretch;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InvoiceListComponent {
  protected readonly invoiceService = inject(InvoiceService);
  private readonly propertyService = inject(PropertyService);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['invoiceNumber', 'property', 'period', 'amount', 'dueDate', 'status', 'actions'];

  protected getPropertyName(propertyId: string): string {
    const property = this.propertyService.properties().find(p => p.id === propertyId);
    return property?.name || 'Unknown Property';
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }

  protected isOverdue(invoice: Invoice): boolean {
    const now = new Date();
    return invoice.status !== InvoiceStatus.PAID && 
           invoice.status !== InvoiceStatus.CANCELLED &&
           new Date(invoice.dueDate) < now;
  }

  protected getStatusClass(status: InvoiceStatus): string {
    return `status-chip ${status.toLowerCase()}`;
  }

  protected getStatusLabel(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.DRAFT: return 'Draft';
      case InvoiceStatus.SENT: return 'Sent';
      case InvoiceStatus.VIEWED: return 'Viewed';
      case InvoiceStatus.PAID: return 'Paid';
      case InvoiceStatus.OVERDUE: return 'Overdue';
      case InvoiceStatus.DISPUTED: return 'Disputed';
      case InvoiceStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  }

  protected markAsPaid(invoice: Invoice): void {
    this.invoiceService.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID, new Date());
    this.snackBar.open('Invoice marked as paid', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  protected deleteInvoice(invoice: Invoice): void {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      this.invoiceService.deleteInvoice(invoice.id);
      this.snackBar.open('Invoice deleted', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  protected loadSampleData(): void {
    this.invoiceService.loadSampleInvoices();
    this.snackBar.open('Sample invoice data loaded', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}

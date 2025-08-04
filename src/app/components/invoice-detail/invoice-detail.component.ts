import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../services/invoice.service';
import { PropertyService } from '../../services/property.service';
import { Invoice, InvoiceStatus } from '../../models/property.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatMenuModule
  ],
  template: `
    @if (invoice()) {
      <div class="invoice-container">
        <!-- Print-only company header -->
        <div class="print-header">
          <div class="company-info">
            <h1 class="company-name">Property Management Services</h1>
            <p class="company-details">Professional Property Management & Rental Services</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p class="invoice-number">{{ invoice()!.invoiceNumber }}</p>
          </div>
        </div>

        <!-- Header -->
        <div class="header">
          <button mat-icon-button routerLink="/invoices">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ invoice()!.invoiceNumber }}</h1>
            <mat-chip [class]="getStatusClass(invoice()!.status)">
              {{ getStatusLabel(invoice()!.status) }}
            </mat-chip>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="printInvoice()" class="print-button">
              <mat-icon>print</mat-icon>
              Print Invoice
            </button>
            <button mat-icon-button [matMenuTriggerFor]="actionMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionMenu="matMenu">
              <button mat-menu-item [routerLink]="['/invoices', invoice()!.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit Invoice
              </button>
              @if (invoice()!.status !== 'paid') {
                <button mat-menu-item (click)="markAsPaid()">
                  <mat-icon>check_circle</mat-icon>
                  Mark as Paid
                </button>
              }
              <button mat-menu-item (click)="emailInvoice()">
                <mat-icon>email</mat-icon>
                Email Invoice
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Invoice Information -->
        <div class="invoice-content">
          <div class="invoice-header-section">
            <mat-card class="info-card">
              <mat-card-header>
                <mat-card-title>Invoice Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Property:</span>
                    <span class="value">{{ getPropertyName() }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Tenant:</span>
                    <span class="value">{{ invoice()!.tenantName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Invoice Date:</span>
                    <span class="value">{{ formatDate(invoice()!.invoiceDate) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Due Date:</span>
                    <span class="value" [class.overdue]="isOverdue()">
                      {{ formatDate(invoice()!.dueDate) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">Rental Period:</span>
                    <span class="value">
                      {{ formatDate(invoice()!.rentPeriodStart) }} - {{ formatDate(invoice()!.rentPeriodEnd) }}
                    </span>
                  </div>
                  @if (invoice()!.paidDate) {
                    <div class="info-item">
                      <span class="label">Paid Date:</span>
                      <span class="value">{{ formatDate(invoice()!.paidDate!) }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Invoice Breakdown -->
          <div class="invoice-breakdown">
            <mat-card class="breakdown-card">
              <mat-card-header>
                <mat-card-title>Invoice Breakdown</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="breakdown-section">
                  <div class="breakdown-item">
                    <span class="item-label">Monthly Rent</span>
                    <span class="item-amount">{{ formatCurrency(invoice()!.monthlyRent) }}</span>
                  </div>

                  @if (invoice()!.chargeableExpenses.length > 0) {
                    <div class="breakdown-subsection">
                      <h4>Additional Charges</h4>
                      @for (expense of invoice()!.chargeableExpenses; track expense.id) {
                        <div class="breakdown-item expense">
                          <span class="item-label">{{ expense.description }}</span>
                          <span class="item-amount">{{ formatCurrency(expense.amount) }}</span>
                        </div>
                      }
                      <div class="breakdown-item subtotal">
                        <span class="item-label">Subtotal Charges</span>
                        <span class="item-amount">{{ formatCurrency(invoice()!.totalChargeableExpenses) }}</span>
                      </div>
                    </div>
                  }

                  <div class="breakdown-item gross">
                    <span class="item-label">Gross Amount</span>
                    <span class="item-amount">{{ formatCurrency(invoice()!.grossAmount) }}</span>
                  </div>

                  @if (invoice()!.deductibleExpenses.length > 0) {
                    <div class="breakdown-subsection">
                      <h4>Deductions (Tenant-Paid Expenses)</h4>
                      @for (expense of invoice()!.deductibleExpenses; track expense.id) {
                        <div class="breakdown-item expense">
                          <span class="item-label">{{ expense.description }}</span>
                          <span class="item-amount">-{{ formatCurrency(expense.amount) }}</span>
                        </div>
                      }
                      <div class="breakdown-item subtotal">
                        <span class="item-label">Total Deductions</span>
                        <span class="item-amount">-{{ formatCurrency(invoice()!.totalDeductibleExpenses) }}</span>
                      </div>
                    </div>
                  }

                  <hr class="breakdown-divider">
                  
                  <div class="breakdown-item final">
                    <span class="item-label"><strong>Net Amount Due</strong></span>
                    <span class="item-amount final-amount">
                      <strong>{{ formatCurrency(invoice()!.netAmount) }}</strong>
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Payment Information -->
          @if (invoice()!.status === 'paid' && invoice()!.paidDate) {
            <mat-card class="payment-card">
              <mat-card-header>
                <mat-card-title>Payment Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="payment-info">
                  <div class="payment-item">
                    <mat-icon class="payment-icon">check_circle</mat-icon>
                    <div class="payment-details">
                      <div class="payment-status">Payment Received</div>
                      <div class="payment-date">{{ formatDate(invoice()!.paidDate!) }}</div>
                      @if (invoice()!.paymentMethod) {
                        <div class="payment-method">via {{ invoice()!.paymentMethod }}</div>
                      }
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }

          <!-- Notes -->
          @if (invoice()!.notes) {
            <mat-card class="notes-card">
              <mat-card-header>
                <mat-card-title>Notes</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>{{ invoice()!.notes }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>
    } @else {
      <div class="error-container">
        <mat-card>
          <mat-card-content>
            <div class="error-content">
              <mat-icon>error</mat-icon>
              <h2>Invoice Not Found</h2>
              <p>The requested invoice could not be found.</p>
              <button mat-raised-button routerLink="/invoices">
                Back to Invoices
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .invoice-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    /* Hide print header on screen */
    .print-header {
      display: none;
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .header-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-info h1 {
      margin: 0;
      color: var(--primary-color);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .invoice-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .info-card,
    .breakdown-card,
    .payment-card,
    .notes-card {
      width: 100%;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .label {
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .value {
      color: var(--text-primary);
    }

    .value.overdue {
      color: var(--error-color);
      font-weight: var(--font-weight-medium);
    }

    .breakdown-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xs) 0;
    }

    .breakdown-item.expense {
      padding-left: var(--spacing-md);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .breakdown-item.subtotal {
      border-top: 1px solid var(--border-light);
      margin-top: var(--spacing-xs);
      padding-top: var(--spacing-sm);
    }

    .breakdown-item.gross {
      background-color: var(--background-secondary);
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      font-weight: var(--font-weight-medium);
    }

    .breakdown-item.final {
      background-color: var(--primary-color);
      color: white;
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-lg);
    }

    .breakdown-subsection {
      margin: var(--spacing-md) 0;
    }

    .breakdown-subsection h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .breakdown-divider {
      border: none;
      border-top: 2px solid var(--border-medium);
      margin: var(--spacing-md) 0;
    }

    .final-amount {
      color: white !important;
    }

    .payment-card {
      background-color: var(--success-background);
      border-left: 4px solid var(--success-color);
    }

    .payment-info {
      display: flex;
      align-items: center;
    }

    .payment-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .payment-icon {
      color: var(--success-color);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .payment-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .payment-status {
      font-weight: var(--font-weight-medium);
      color: var(--success-dark);
    }

    .payment-date,
    .payment-method {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
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

    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      padding: var(--spacing-lg);
    }

    .error-content {
      text-align: center;
      padding: var(--spacing-xl);
    }

    .error-content mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--error-color);
      margin-bottom: var(--spacing-md);
    }

    .error-content h2 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .error-content p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-lg);
    }

    @media (max-width: 768px) {
      .invoice-container {
        padding: var(--spacing-md);
      }

      .header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-md);
      }

      .header-info {
        flex-direction: column;
        align-items: stretch;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .breakdown-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-xs);
      }
    }

    /* Print Styles */
    .print-button {
      margin-right: var(--spacing-sm);
    }

    @media print {
      /* Page setup */
      @page {
        margin: 0.75in;
        size: A4;
      }

      /* Hide non-essential elements */
      .header button,
      .header-actions,
      .mat-card-header,
      mat-card-header,
      .print-button {
        display: none !important;
      }

      /* Show print header */
      .print-header {
        display: block !important;
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #000;
      }

      .company-info {
        margin-bottom: 15px;
      }

      .company-name {
        font-size: 28px;
        font-weight: bold;
        margin: 0;
        color: #000 !important;
      }

      .company-details {
        font-size: 14px;
        margin: 5px 0 0 0;
        color: #000 !important;
      }

      .invoice-title {
        margin-top: 15px;
      }

      .invoice-title h2 {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        color: #000 !important;
        letter-spacing: 2px;
      }

      .invoice-number {
        font-size: 16px;
        margin: 5px 0 0 0;
        color: #000 !important;
        font-weight: bold;
      }

      /* Main container adjustments */
      .invoice-container {
        max-width: none;
        margin: 0;
        padding: 0;
        font-family: 'Times New Roman', serif;
        color: #000;
        background: white;
      }

      /* Header styling for print */
      .header {
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
      }

      .header-info h1 {
        color: #000 !important;
        font-size: 24px;
        font-weight: bold;
      }

      /* Remove material design cards for print */
      mat-card,
      .mat-card,
      .info-card,
      .breakdown-card,
      .payment-card,
      .notes-card {
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .mat-card-content {
        padding: 0 !important;
        margin: 10px 0 !important;
      }

      /* Invoice content layout */
      .invoice-content {
        gap: 20px;
      }

      /* Information grid for print */
      .info-grid {
        display: block;
        margin-bottom: 20px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        border-bottom: 1px dotted #ccc;
        page-break-inside: avoid;
      }

      .info-item .label {
        font-weight: bold;
        color: #000;
        min-width: 120px;
      }

      .info-item .value {
        color: #000;
        text-align: right;
      }

      /* Breakdown section styling */
      .breakdown-section {
        margin: 20px 0;
      }

      .breakdown-item {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        border-bottom: 1px dotted #ddd;
        page-break-inside: avoid;
      }

      .breakdown-item.expense {
        padding-left: 20px;
        font-size: 12px;
        border-bottom: none;
      }

      .breakdown-item.subtotal {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        font-weight: bold;
        padding: 8px 0;
        margin-top: 10px;
      }

      .breakdown-item.gross {
        background-color: #f5f5f5 !important;
        border: 1px solid #000;
        padding: 8px;
        font-weight: bold;
        margin: 10px 0;
      }

      .breakdown-item.final {
        background-color: #000 !important;
        color: white !important;
        border: 2px solid #000;
        padding: 12px;
        font-size: 16px;
        font-weight: bold;
        margin: 15px 0;
      }

      /* Subsection headers */
      .breakdown-subsection h4 {
        color: #000;
        font-weight: bold;
        font-size: 14px;
        margin: 15px 0 5px 0;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
      }

      /* Table styling for expenses */
      mat-table,
      .mat-table {
        border-collapse: collapse;
        width: 100%;
        border: 1px solid #000;
      }

      .mat-header-cell,
      .mat-cell {
        border: 1px solid #000 !important;
        padding: 8px !important;
        color: #000 !important;
        background: white !important;
      }

      .mat-header-cell {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
      }

      /* Status chips */
      mat-chip,
      .mat-chip {
        background-color: white !important;
        color: #000 !important;
        border: 1px solid #000 !important;
        font-weight: bold;
      }

      /* Ensure proper page breaks */
      .invoice-header-section,
      .breakdown-card {
        page-break-inside: avoid;
      }

      /* Force colors for better print contrast */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Remove any hover effects */
      *:hover {
        background-color: inherit !important;
        color: inherit !important;
      }

      /* Typography adjustments */
      h1, h2, h3, h4, h5, h6 {
        color: #000 !important;
      }

      /* Ensure text is readable */
      .label,
      .value,
      span,
      div {
        color: #000 !important;
      }

      /* Hide material icons in print */
      mat-icon {
        display: none !important;
      }

      /* Payment status for print */
      .overdue {
        color: #000 !important;
        font-weight: bold !important;
        text-decoration: underline !important;
      }
    }
  `]
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly propertyService = inject(PropertyService);
  private readonly snackBar = inject(MatSnackBar);

  invoice = signal<Invoice | null>(null);

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      const foundInvoice = this.invoiceService.getInvoiceById(invoiceId);
      this.invoice.set(foundInvoice || null);
    }
  }

  protected getPropertyName(): string {
    const propertyId = this.invoice()?.propertyId;
    if (propertyId) {
      const property = this.propertyService.properties().find(p => p.id === propertyId);
      return property?.name || 'Unknown Property';
    }
    return 'Unknown Property';
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

  protected isOverdue(): boolean {
    const invoice = this.invoice();
    if (!invoice) return false;
    
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

  protected markAsPaid(): void {
    const invoice = this.invoice();
    if (invoice) {
      this.invoiceService.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID, new Date());
      // Update local signal
      this.invoice.set({
        ...invoice,
        status: InvoiceStatus.PAID,
        paidDate: new Date()
      });
      
      this.snackBar.open('Invoice marked as paid', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  protected printInvoice(): void {
    window.print();
  }

  protected emailInvoice(): void {
    const invoice = this.invoice();
    if (invoice) {
      const subject = `Invoice ${invoice.invoiceNumber}`;
      const body = `Please find attached invoice ${invoice.invoiceNumber} for the amount of ${this.formatCurrency(invoice.netAmount)}.`;
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    }
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { InvoiceService } from '../../services/invoice.service';
import { PropertyService } from '../../services/property.service';
import { Invoice, Property, Expense, ExpenseType, InvoiceStatus } from '../../models/property.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatTableModule,
    MatChipsModule,
    MatNativeDateModule,
    MatDialogModule,
    MatListModule
  ],
  template: `
    <div class="form-container">
      <div class="header">
        <button mat-icon-button routerLink="/invoices">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit Invoice' : 'Create New Invoice' }}</h1>
      </div>

      <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Invoice Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field class="full-width">
                <mat-label>Property</mat-label>
                <mat-select formControlName="propertyId" (selectionChange)="onPropertyChange()">
                  @for (property of propertyService.properties(); track property.id) {
                    <mat-option [value]="property.id">
                      {{ property.name }} - {{ property.address }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field class="half-width">
                <mat-label>Invoice Number</mat-label>
                <input matInput formControlName="invoiceNumber" readonly>
              </mat-form-field>
              <mat-form-field class="half-width">
                <mat-label>Tenant Name</mat-label>
                <input matInput formControlName="tenantName">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field class="half-width">
                <mat-label>Invoice Date</mat-label>
                <input matInput [matDatepicker]="invoiceDatePicker" formControlName="invoiceDate">
                <mat-datepicker-toggle matSuffix [for]="invoiceDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #invoiceDatePicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field class="half-width">
                <mat-label>Due Date</mat-label>
                <input matInput [matDatepicker]="dueDatePicker" formControlName="dueDate">
                <mat-datepicker-toggle matSuffix [for]="dueDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #dueDatePicker></mat-datepicker>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Rental Period -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Rental Period</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-row">
              <mat-form-field class="half-width">
                <mat-label>Period Start</mat-label>
                <input matInput [matDatepicker]="periodStartPicker" formControlName="rentPeriodStart">
                <mat-datepicker-toggle matSuffix [for]="periodStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #periodStartPicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field class="half-width">
                <mat-label>Period End</mat-label>
                <input matInput [matDatepicker]="periodEndPicker" formControlName="rentPeriodEnd">
                <mat-datepicker-toggle matSuffix [for]="periodEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #periodEndPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field class="full-width">
                <mat-label>Monthly Rent</mat-label>
                <input matInput type="number" formControlName="monthlyRent" (input)="calculateTotal()">
                <span matPrefix>$</span>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Chargeable Expenses -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Expenses to Charge Tenant</mat-card-title>
            <mat-card-subtitle>Additional charges that will be added to the rent</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="expense-section">
              <div class="expense-buttons">
                <button type="button" mat-stroked-button (click)="addChargeableExpense()">
                  <mat-icon>add</mat-icon>
                  Add New Expense
                </button>
                <button type="button" mat-stroked-button (click)="selectExistingChargeableExpenses()" 
                        [disabled]="!selectedPropertyId()">
                  <mat-icon>list</mat-icon>
                  Select from Existing Expenses
                </button>
              </div>

              @if (chargeableExpenses().length > 0) {
                <table mat-table [dataSource]="chargeableExpenses()" class="expense-table">
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let expense">{{ expense.description }}</td>
                  </ng-container>

                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount</th>
                    <td mat-cell *matCellDef="let expense">{{ formatCurrency(expense.amount) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let expense; let i = index">
                      <button type="button" mat-icon-button (click)="removeChargeableExpense(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="expenseColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: expenseColumns;"></tr>
                </table>

                <div class="expense-total">
                  <strong>Total Chargeable Expenses: {{ formatCurrency(totalChargeableExpenses()) }}</strong>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Deductible Expenses -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Tenant-Paid Expenses</mat-card-title>
            <mat-card-subtitle>Expenses paid by tenant that will be deducted from rent</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="expense-section">
              <div class="expense-buttons">
                <button type="button" mat-stroked-button (click)="addDeductibleExpense()">
                  <mat-icon>add</mat-icon>
                  Add New Expense
                </button>
                <button type="button" mat-stroked-button (click)="selectExistingDeductibleExpenses()" 
                        [disabled]="!selectedPropertyId()">
                  <mat-icon>list</mat-icon>
                  Select from Existing Expenses
                </button>
              </div>

              @if (deductibleExpenses().length > 0) {
                <table mat-table [dataSource]="deductibleExpenses()" class="expense-table">
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Description</th>
                    <td mat-cell *matCellDef="let expense">{{ expense.description }}</td>
                  </ng-container>

                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Amount</th>
                    <td mat-cell *matCellDef="let expense">{{ formatCurrency(expense.amount) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let expense; let i = index">
                      <button type="button" mat-icon-button (click)="removeDeductibleExpense(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="expenseColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: expenseColumns;"></tr>
                </table>

                <div class="expense-total">
                  <strong>Total Deductible Expenses: {{ formatCurrency(totalDeductibleExpenses()) }}</strong>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Invoice Summary -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>Invoice Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-breakdown">
              <div class="summary-line">
                <span>Monthly Rent:</span>
                <span>{{ formatCurrency(invoiceForm.get('monthlyRent')?.value || 0) }}</span>
              </div>
              <div class="summary-line">
                <span>Additional Charges:</span>
                <span>{{ formatCurrency(totalChargeableExpenses()) }}</span>
              </div>
              <div class="summary-line">
                <span>Deductions:</span>
                <span>-{{ formatCurrency(totalDeductibleExpenses()) }}</span>
              </div>
              <hr>
              <div class="summary-line total">
                <span><strong>Net Amount Due:</strong></span>
                <span><strong>{{ formatCurrency(calculateNetAmount()) }}</strong></span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" mat-button routerLink="/invoices">Cancel</button>
          <button type="submit" mat-raised-button color="primary" [disabled]="!invoiceForm.valid">
            {{ isEditMode() ? 'Update Invoice' : 'Create Invoice' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .header h1 {
      margin: 0;
      color: var(--primary-color);
    }

    .form-section {
      margin-bottom: var(--spacing-lg);
    }

    .form-row {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      width: calc(50% - var(--spacing-sm));
    }

    .expense-section {
      margin-top: var(--spacing-md);
    }

    .expense-buttons {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }

    .expense-buttons button {
      flex: 1;
    }

    .expense-table {
      width: 100%;
      margin: var(--spacing-md) 0;
    }

    .expense-total {
      text-align: right;
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: var(--background-secondary);
      border-radius: var(--border-radius-md);
    }

    .summary-breakdown {
      background-color: var(--background-secondary);
      padding: var(--spacing-md);
      border-radius: var(--border-radius-md);
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-sm);
    }

    .summary-line.total {
      margin-top: var(--spacing-md);
      font-size: 1.1em;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
    }

    @media (max-width: 768px) {
      .form-container {
        padding: var(--spacing-md);
      }

      .form-row {
        flex-direction: column;
      }

      .half-width {
        width: 100%;
      }
    }
  `]
})
export class InvoiceFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  protected readonly invoiceService = inject(InvoiceService);
  protected readonly propertyService = inject(PropertyService);

  invoiceForm!: FormGroup;
  isEditMode = signal(false);
  chargeableExpenses = signal<Expense[]>([]);
  deductibleExpenses = signal<Expense[]>([]);
  expenseColumns = ['description', 'amount', 'actions'];

  // Computed property for selected property ID
  selectedPropertyId = () => this.invoiceForm?.get('propertyId')?.value;

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm(): void {
    this.invoiceForm = this.fb.group({
      propertyId: ['', Validators.required],
      tenantName: ['', Validators.required],
      invoiceNumber: [''],
      invoiceDate: [new Date(), Validators.required],
      dueDate: [this.getDefaultDueDate(), Validators.required],
      rentPeriodStart: [this.getDefaultPeriodStart(), Validators.required],
      rentPeriodEnd: [this.getDefaultPeriodEnd(), Validators.required],
      monthlyRent: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private checkEditMode(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      const invoice = this.invoiceService.getInvoiceById(invoiceId);
      if (invoice) {
        this.isEditMode.set(true);
        this.populateForm(invoice);
      }
    } else {
      this.generateInvoiceNumber();
    }
  }

  private populateForm(invoice: Invoice): void {
    this.invoiceForm.patchValue({
      propertyId: invoice.propertyId,
      tenantName: invoice.tenantName,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      rentPeriodStart: invoice.rentPeriodStart,
      rentPeriodEnd: invoice.rentPeriodEnd,
      monthlyRent: invoice.monthlyRent
    });

    this.chargeableExpenses.set([...invoice.chargeableExpenses]);
    this.deductibleExpenses.set([...invoice.deductibleExpenses]);
  }

  private generateInvoiceNumber(): void {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const invoiceCount = this.invoiceService.invoices().length + 1;
    const invoiceNumber = `INV-${year}${month}-${invoiceCount.toString().padStart(4, '0')}`;
    this.invoiceForm.patchValue({ invoiceNumber });
  }

  private getDefaultDueDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }

  private getDefaultPeriodStart(): Date {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  }

  private getDefaultPeriodEnd(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    return date;
  }

  protected onPropertyChange(): void {
    const propertyId = this.invoiceForm.get('propertyId')?.value;
    if (propertyId) {
      const property = this.propertyService.properties().find(p => p.id === propertyId);
      if (property) {
        this.invoiceForm.patchValue({
          tenantName: property.tenantName || 'Tenant',
          monthlyRent: property.monthlyRent
        });
      }
    }
  }

  protected addChargeableExpense(): void {
    const description = prompt('Enter expense description:');
    const amountStr = prompt('Enter expense amount:');
    
    if (description && amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        const expense: Expense = {
          id: this.generateExpenseId(),
          propertyId: this.invoiceForm.get('propertyId')?.value || '',
          amount,
          date: new Date(),
          category: 'other' as any,
          description,
          expenseType: ExpenseType.CHARGEABLE_TO_TENANT,
          chargedToTenant: true
        };
        
        this.chargeableExpenses.update(expenses => [...expenses, expense]);
        this.calculateTotal();
      }
    }
  }

  protected addDeductibleExpense(): void {
    const description = prompt('Enter expense description:');
    const amountStr = prompt('Enter expense amount:');
    
    if (description && amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        const expense: Expense = {
          id: this.generateExpenseId(),
          propertyId: this.invoiceForm.get('propertyId')?.value || '',
          amount,
          date: new Date(),
          category: 'other' as any,
          description,
          expenseType: ExpenseType.TENANT_PAID_MAINTENANCE,
          paidByTenant: true
        };
        
        this.deductibleExpenses.update(expenses => [...expenses, expense]);
        this.calculateTotal();
      }
    }
  }

  protected removeChargeableExpense(index: number): void {
    this.chargeableExpenses.update(expenses => expenses.filter((_, i) => i !== index));
    this.calculateTotal();
  }

  protected selectExistingChargeableExpenses(): void {
    const propertyId = this.selectedPropertyId();
    if (!propertyId) return;

    // Get expenses that can be charged to tenant and haven't been charged yet
    const availableExpenses = this.propertyService.expenses()
      .filter(expense => 
        expense.propertyId === propertyId &&
        (expense.expenseType === ExpenseType.CHARGEABLE_TO_TENANT ||
         expense.expenseType === ExpenseType.TENANT_DAMAGES ||
         expense.expenseType === ExpenseType.TENANT_UTILITIES ||
         expense.expenseType === ExpenseType.TENANT_LATE_FEES) &&
        !expense.invoiceId // Not yet charged
      );

    if (availableExpenses.length === 0) {
      this.snackBar.open('No uncharged expenses available for this property', 'Close', { duration: 3000 });
      return;
    }

    // Simple selection for now - could be enhanced with a dialog later
    // For now, let's just add all available uncharged expenses
    this.chargeableExpenses.update(current => {
      const newExpenses = availableExpenses.filter(available => 
        !current.some(existing => existing.id === available.id)
      );
      return [...current, ...newExpenses];
    });

    if (availableExpenses.length > 0) {
      this.snackBar.open(`Added ${availableExpenses.length} uncharged expense(s)`, 'Close', { duration: 3000 });
      this.calculateTotal();
    }
  }

  protected selectExistingDeductibleExpenses(): void {
    const propertyId = this.selectedPropertyId();
    if (!propertyId) return;

    // Get tenant-paid expenses that haven't been credited yet
    const availableExpenses = this.propertyService.expenses()
      .filter(expense => 
        expense.propertyId === propertyId &&
        (expense.expenseType === ExpenseType.TENANT_PAID_MAINTENANCE ||
         expense.expenseType === ExpenseType.TENANT_PAID_REPAIRS ||
         expense.expenseType === ExpenseType.TENANT_PAID_UTILITIES) &&
        !expense.invoiceId // Not yet credited
      );

    if (availableExpenses.length === 0) {
      this.snackBar.open('No uncredited tenant-paid expenses available for this property', 'Close', { duration: 3000 });
      return;
    }

    // Add all available uncredited tenant-paid expenses
    this.deductibleExpenses.update(current => {
      const newExpenses = availableExpenses.filter(available => 
        !current.some(existing => existing.id === available.id)
      );
      return [...current, ...newExpenses];
    });

    if (availableExpenses.length > 0) {
      this.snackBar.open(`Added ${availableExpenses.length} uncredited tenant-paid expense(s)`, 'Close', { duration: 3000 });
      this.calculateTotal();
    }
  }

  protected removeDeductibleExpense(index: number): void {
    this.deductibleExpenses.update(expenses => expenses.filter((_, i) => i !== index));
    this.calculateTotal();
  }

  protected totalChargeableExpenses(): number {
    return this.chargeableExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  }

  protected totalDeductibleExpenses(): number {
    return this.deductibleExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  }

  protected calculateNetAmount(): number {
    const rent = this.invoiceForm.get('monthlyRent')?.value || 0;
    return rent + this.totalChargeableExpenses() - this.totalDeductibleExpenses();
  }

  protected calculateTotal(): void {
    // This method is called to trigger change detection
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private generateExpenseId(): string {
    return 'exp_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  protected onSubmit(): void {
    if (this.invoiceForm.valid) {
      const formValue = this.invoiceForm.value;
      
      const invoice: Invoice = {
        id: this.isEditMode() ? this.route.snapshot.paramMap.get('id')! : this.generateInvoiceId(),
        propertyId: formValue.propertyId,
        tenantName: formValue.tenantName,
        invoiceNumber: formValue.invoiceNumber,
        invoiceDate: formValue.invoiceDate,
        dueDate: formValue.dueDate,
        monthlyRent: formValue.monthlyRent,
        rentPeriodStart: formValue.rentPeriodStart,
        rentPeriodEnd: formValue.rentPeriodEnd,
        chargeableExpenses: [...this.chargeableExpenses()],
        totalChargeableExpenses: this.totalChargeableExpenses(),
        deductibleExpenses: [...this.deductibleExpenses()],
        totalDeductibleExpenses: this.totalDeductibleExpenses(),
        grossAmount: formValue.monthlyRent + this.totalChargeableExpenses(),
        deductions: this.totalDeductibleExpenses(),
        netAmount: this.calculateNetAmount(),
        status: InvoiceStatus.DRAFT
      };

      this.invoiceService.saveInvoice(invoice);
      
      // Mark expenses as included in this invoice
      this.markExpensesAsCharged(invoice.id);
      
      this.snackBar.open(
        this.isEditMode() ? 'Invoice updated successfully' : 'Invoice created successfully', 
        'Close', 
        { duration: 3000, panelClass: ['success-snackbar'] }
      );
      
      this.router.navigate(['/invoices']);
    }
  }

  private generateInvoiceId(): string {
    return 'inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private markExpensesAsCharged(invoiceId: string): void {
    // Mark chargeable expenses as charged
    this.chargeableExpenses().forEach(expense => {
      if (expense.id) {
        this.propertyService.updateExpense(expense.id, {
          ...expense,
          invoiceId: invoiceId
        });
      }
    });

    // Mark deductible expenses as credited
    this.deductibleExpenses().forEach(expense => {
      if (expense.id) {
        this.propertyService.updateExpense(expense.id, {
          ...expense,
          invoiceId: invoiceId
        });
      }
    });
  }
}

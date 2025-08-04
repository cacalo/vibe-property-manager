import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PropertyService } from '../../services/property.service';
import { Expense, ExpenseCategory, ExpenseType } from '../../models/property.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <div class="expense-form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit Expense Entry' : 'Add Expense Entry' }}</h1>
      </div>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Expense Information</mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode() ? 'Update the expense details below' : 'Record a cost for this property' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
            <!-- Property Selection (only for new entries) -->
            <div class="form-section" *ngIf="!propertyId">
              <h3>Property</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Select Property</mat-label>
                  <mat-select formControlName="propertyId">
                    @for (property of availableProperties(); track property.id) {
                      <mat-option [value]="property.id">
                        {{ property.name }} - {{ property.address }}
                      </mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="expenseForm.get('propertyId')?.hasError('required')">
                    Please select a property
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Expense Details -->
            <div class="form-section">
              <h3>Expense Details</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Expense Category</mat-label>
                  <mat-select formControlName="category">
                    @for (category of expenseCategories; track category.value) {
                      <mat-option [value]="category.value">{{ category.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="expenseForm.get('category')?.hasError('required')">
                    Expense category is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Who Paid This Expense?</mat-label>
                  <mat-select formControlName="paidBy">
                    <mat-option value="landlord">Landlord/Owner (me)</mat-option>
                    <mat-option value="tenant">Tenant</mat-option>
                  </mat-select>
                  <mat-error *ngIf="expenseForm.get('paidBy')?.hasError('required')">
                    Please specify who paid this expense
                  </mat-error>
                  <mat-hint>Choose who actually paid for this expense</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Amount</mat-label>
                  <input matInput type="number" formControlName="amount" 
                         placeholder="0.00" min="0" step="0.01">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="expenseForm.get('amount')?.hasError('required')">
                    Amount is required
                  </mat-error>
                  <mat-error *ngIf="expenseForm.get('amount')?.hasError('min')">
                    Amount must be greater than 0
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Date Incurred</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="expenseForm.get('date')?.hasError('required')">
                    Date is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Vendor/Payee (Optional)</mat-label>
                  <input matInput formControlName="vendor" placeholder="Who was paid">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="3" 
                           placeholder="Describe what this expense was for..."></textarea>
                  <mat-error *ngIf="expenseForm.get('description')?.hasError('required')">
                    Description is required
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Payment Information -->
            <div class="form-section">
              <h3>Payment Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Payment Method (Optional)</mat-label>
                  <mat-select formControlName="paymentMethod">
                    <mat-option value="">Select payment method</mat-option>
                    <mat-option value="cash">Cash</mat-option>
                    <mat-option value="check">Check</mat-option>
                    <mat-option value="bank_transfer">Bank Transfer</mat-option>
                    <mat-option value="credit_card">Credit Card</mat-option>
                    <mat-option value="debit_card">Debit Card</mat-option>
                    <mat-option value="online_payment">Online Payment</mat-option>
                    <mat-option value="other">Other</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Receipt/Invoice Number (Optional)</mat-label>
                  <input matInput formControlName="receiptNumber" 
                         placeholder="Receipt or invoice reference">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Notes (Optional)</mat-label>
                  <textarea matInput formControlName="notes" rows="2" 
                           placeholder="Additional notes about this expense..."></textarea>
                </mat-form-field>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" 
                  [disabled]="!expenseForm.valid || isSubmitting()"
                  (click)="onSubmit()">
            <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
            {{ isSubmitting() ? 'Saving...' : (isEditMode() ? 'Update Expense' : 'Add Expense') }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .expense-form-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      color: #1976d2;
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 1.1em;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      width: calc(50% - 8px);
    }

    mat-card {
      margin-bottom: 24px;
    }

    mat-card-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .expense-form-container {
        padding: 16px;
      }

      .form-row {
        flex-direction: column;
      }

      .half-width {
        width: 100%;
      }

      mat-card-actions {
        flex-direction: column-reverse;
      }

      mat-card-actions button {
        width: 100%;
      }
    }
  `]
})
export class ExpenseFormComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isEditMode = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly availableProperties = this.propertyService.properties;
  
  protected currentExpenseId: string | null = null;
  protected propertyId: string | null = null;

  protected readonly expenseCategories = [
    { value: ExpenseCategory.MAINTENANCE, label: 'Maintenance' },
    { value: ExpenseCategory.REPAIRS, label: 'Repairs' },
    { value: ExpenseCategory.INSURANCE, label: 'Insurance' },
    { value: ExpenseCategory.PROPERTY_TAX, label: 'Property Tax' },
    { value: ExpenseCategory.UTILITIES, label: 'Utilities' },
    { value: ExpenseCategory.PROPERTY_MANAGEMENT, label: 'Property Management' },
    { value: ExpenseCategory.MARKETING, label: 'Marketing' },
    { value: ExpenseCategory.LEGAL_FEES, label: 'Legal Fees' },
    { value: ExpenseCategory.MORTGAGE, label: 'Mortgage Payment' },
    { value: ExpenseCategory.OTHER, label: 'Other Expense' }
  ];

  protected expenseForm: FormGroup;

  constructor() {
    this.expenseForm = this.formBuilder.group({
      propertyId: ['', [Validators.required]],
      category: ['', [Validators.required]],
      paidBy: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), [Validators.required]],
      description: ['', [Validators.required]],
      vendor: [''],
      paymentMethod: [''],
      receiptNumber: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Get property ID from route if accessing from property detail page
    this.propertyId = this.route.snapshot.paramMap.get('propertyId');
    const expenseId = this.route.snapshot.paramMap.get('id');

    // If we have a property ID, pre-fill and disable the property selection
    if (this.propertyId) {
      this.expenseForm.patchValue({ propertyId: this.propertyId });
      this.expenseForm.get('propertyId')?.disable();
    }

    // If we have an expense ID, we're in edit mode
    if (expenseId && expenseId !== 'new') {
      this.currentExpenseId = expenseId;
      this.isEditMode.set(true);
      this.loadExpense(expenseId);
    }
  }

  private loadExpense(id: string): void {
    const expense = this.propertyService.getExpense(id);
    if (expense) {
      this.expenseForm.patchValue({
        propertyId: expense.propertyId,
        category: expense.category,
        paidBy: this.determinePaidBy(expense.expenseType),
        amount: expense.amount,
        date: new Date(expense.date),
        description: expense.description,
        vendor: expense.vendor || '',
        paymentMethod: expense.paymentMethod || '',
        receiptNumber: expense.receiptNumber || '',
        notes: expense.notes || ''
      });
    } else {
      this.snackBar.open('Expense entry not found', 'Close', { duration: 3000 });
      this.goBack();
    }
  }

  private determinePaidBy(expenseType: ExpenseType): string {
    // If it's a tenant-paid expense type, return 'tenant'
    if (expenseType === ExpenseType.TENANT_PAID_MAINTENANCE ||
        expenseType === ExpenseType.TENANT_PAID_REPAIRS ||
        expenseType === ExpenseType.TENANT_PAID_UTILITIES) {
      return 'tenant';
    }
    // Otherwise, assume landlord paid
    return 'landlord';
  }

  protected onSubmit(): void {
    if (this.expenseForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = { ...this.expenseForm.value };
      
      // Re-enable propertyId if it was disabled for form submission
      if (this.propertyId) {
        formValue.propertyId = this.propertyId;
      }

      const expenseData = {
        propertyId: formValue.propertyId,
        category: formValue.category,
        amount: Number(formValue.amount),
        date: formValue.date,
        description: formValue.description,
        vendor: formValue.vendor || undefined,
        paymentMethod: formValue.paymentMethod || undefined,
        receiptNumber: formValue.receiptNumber || undefined,
        notes: formValue.notes || undefined,
        expenseType: this.getExpenseType(formValue.paidBy, formValue.category)
      };

      try {
        if (this.isEditMode() && this.currentExpenseId) {
          this.propertyService.updateExpense(this.currentExpenseId, expenseData);
          this.snackBar.open('Expense updated successfully', 'Close', { duration: 3000 });
        } else {
          this.propertyService.addExpense(expenseData);
          this.snackBar.open('Expense added successfully', 'Close', { duration: 3000 });
        }
        
        this.goBack();
      } catch (error) {
        this.snackBar.open('Error saving expense', 'Close', { duration: 3000 });
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  protected goBack(): void {
    if (this.propertyId) {
      this.router.navigate(['/properties', this.propertyId]);
    } else {
      this.router.navigate(['/expenses']);
    }
  }

  private getExpenseType(paidBy: string, category: ExpenseCategory): ExpenseType {
    // If tenant paid, it's a deductible expense (we'll credit them on invoice)
    if (paidBy === 'tenant') {
      switch (category) {
        case ExpenseCategory.MAINTENANCE:
          return ExpenseType.TENANT_PAID_MAINTENANCE;
        case ExpenseCategory.REPAIRS:
          return ExpenseType.TENANT_PAID_REPAIRS;
        case ExpenseCategory.UTILITIES:
          return ExpenseType.TENANT_PAID_UTILITIES;
        default:
          return ExpenseType.TENANT_PAID_MAINTENANCE; // Default for tenant-paid
      }
    }
    
    // If landlord paid, determine if it's chargeable to tenant or landlord expense
    if (paidBy === 'landlord') {
      // These are typically landlord responsibilities (not chargeable to tenant)
      if (category === ExpenseCategory.PROPERTY_TAX || 
          category === ExpenseCategory.INSURANCE ||
          category === ExpenseCategory.MORTGAGE ||
          category === ExpenseCategory.PROPERTY_MANAGEMENT) {
        switch (category) {
          case ExpenseCategory.PROPERTY_TAX:
            return ExpenseType.LANDLORD_PROPERTY_TAX;
          case ExpenseCategory.INSURANCE:
            return ExpenseType.LANDLORD_INSURANCE;
          case ExpenseCategory.PROPERTY_MANAGEMENT:
            return ExpenseType.LANDLORD_MANAGEMENT;
          default:
            return ExpenseType.LANDLORD_PROPERTY_TAX;
        }
      }
      
      // For other categories paid by landlord, map to appropriate landlord expense type
      switch (category) {
        case ExpenseCategory.MAINTENANCE:
          return ExpenseType.LANDLORD_MAINTENANCE;
        case ExpenseCategory.REPAIRS:
          return ExpenseType.LANDLORD_REPAIRS;
        case ExpenseCategory.UTILITIES:
          return ExpenseType.LANDLORD_UTILITIES;
        default:
          // These could be chargeable to tenant depending on circumstances
          return ExpenseType.CHARGEABLE_TO_TENANT;
      }
    }
    
    // Default fallback
    return ExpenseType.LANDLORD_MAINTENANCE;
  }
}

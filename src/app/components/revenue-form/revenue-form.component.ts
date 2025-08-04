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
import { Revenue, RevenueType } from '../../models/property.model';

@Component({
  selector: 'app-revenue-form',
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
    <div class="revenue-form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit Revenue Entry' : 'Add Revenue Entry' }}</h1>
      </div>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Revenue Information</mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode() ? 'Update the revenue details below' : 'Record income for this property' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="revenueForm" (ngSubmit)="onSubmit()">
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
                  <mat-error *ngIf="revenueForm.get('propertyId')?.hasError('required')">
                    Please select a property
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Revenue Details -->
            <div class="form-section">
              <h3>Revenue Details</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Revenue Type</mat-label>
                  <mat-select formControlName="type">
                    @for (type of revenueTypes; track type.value) {
                      <mat-option [value]="type.value">{{ type.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="revenueForm.get('type')?.hasError('required')">
                    Revenue type is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Amount</mat-label>
                  <input matInput type="number" formControlName="amount" 
                         placeholder="0.00" min="0" step="0.01">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="revenueForm.get('amount')?.hasError('required')">
                    Amount is required
                  </mat-error>
                  <mat-error *ngIf="revenueForm.get('amount')?.hasError('min')">
                    Amount must be greater than 0
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Date Received</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="revenueForm.get('date')?.hasError('required')">
                    Date is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width" *ngIf="showPayerField()">
                  <mat-label>Payer (Optional)</mat-label>
                  <input matInput formControlName="payer" placeholder="Who paid this amount">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description (Optional)</mat-label>
                  <textarea matInput formControlName="description" rows="3" 
                           placeholder="Additional details about this revenue..."></textarea>
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
                    <mat-option value="online_payment">Online Payment</mat-option>
                    <mat-option value="other">Other</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Reference Number (Optional)</mat-label>
                  <input matInput formControlName="referenceNumber" 
                         placeholder="Check number, transaction ID, etc.">
                </mat-form-field>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" 
                  [disabled]="!revenueForm.valid || isSubmitting()"
                  (click)="onSubmit()">
            <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
            {{ isSubmitting() ? 'Saving...' : (isEditMode() ? 'Update Revenue' : 'Add Revenue') }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .revenue-form-container {
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
      .revenue-form-container {
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
export class RevenueFormComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isEditMode = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly availableProperties = this.propertyService.properties;
  
  protected currentRevenueId: string | null = null;
  protected propertyId: string | null = null;

  protected readonly revenueTypes = [
    { value: RevenueType.RENT, label: 'Rent Payment' },
    { value: RevenueType.LATE_FEE, label: 'Late Fee' },
    { value: RevenueType.SECURITY_DEPOSIT, label: 'Security Deposit' },
    { value: RevenueType.PET_FEE, label: 'Pet Fee' },
    { value: RevenueType.OTHER, label: 'Other Income' }
  ];

  protected revenueForm: FormGroup;

  constructor() {
    this.revenueForm = this.formBuilder.group({
      propertyId: ['', [Validators.required]],
      type: ['', [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), [Validators.required]],
      description: [''],
      payer: [''],
      paymentMethod: [''],
      referenceNumber: ['']
    });
  }

  ngOnInit(): void {
    // Get property ID from route if accessing from property detail page
    this.propertyId = this.route.snapshot.paramMap.get('propertyId');
    const revenueId = this.route.snapshot.paramMap.get('id');

    // If we have a property ID, pre-fill and disable the property selection
    if (this.propertyId) {
      this.revenueForm.patchValue({ propertyId: this.propertyId });
      this.revenueForm.get('propertyId')?.disable();
    }

    // If we have a revenue ID, we're in edit mode
    if (revenueId && revenueId !== 'new') {
      this.currentRevenueId = revenueId;
      this.isEditMode.set(true);
      this.loadRevenue(revenueId);
    }
  }

  private loadRevenue(id: string): void {
    const revenue = this.propertyService.getRevenue(id);
    if (revenue) {
      this.revenueForm.patchValue({
        propertyId: revenue.propertyId,
        type: revenue.type,
        amount: revenue.amount,
        date: new Date(revenue.date),
        description: revenue.description || '',
        payer: revenue.payer || '',
        paymentMethod: revenue.paymentMethod || '',
        referenceNumber: revenue.referenceNumber || ''
      });
    } else {
      this.snackBar.open('Revenue entry not found', 'Close', { duration: 3000 });
      this.goBack();
    }
  }

  protected showPayerField(): boolean {
    const type = this.revenueForm.get('type')?.value;
    return type === RevenueType.RENT || type === RevenueType.SECURITY_DEPOSIT;
  }

  protected onSubmit(): void {
    if (this.revenueForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = { ...this.revenueForm.value };
      
      // Re-enable propertyId if it was disabled for form submission
      if (this.propertyId) {
        formValue.propertyId = this.propertyId;
      }

      const revenueData = {
        propertyId: formValue.propertyId,
        type: formValue.type,
        amount: Number(formValue.amount),
        date: formValue.date,
        description: formValue.description || undefined,
        payer: formValue.payer || undefined,
        paymentMethod: formValue.paymentMethod || undefined,
        referenceNumber: formValue.referenceNumber || undefined
      };

      try {
        if (this.isEditMode() && this.currentRevenueId) {
          this.propertyService.updateRevenue(this.currentRevenueId, revenueData);
          this.snackBar.open('Revenue updated successfully', 'Close', { duration: 3000 });
        } else {
          this.propertyService.addRevenue(revenueData);
          this.snackBar.open('Revenue added successfully', 'Close', { duration: 3000 });
        }
        
        this.goBack();
      } catch (error) {
        this.snackBar.open('Error saving revenue', 'Close', { duration: 3000 });
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  protected goBack(): void {
    if (this.propertyId) {
      this.router.navigate(['/properties', this.propertyId]);
    } else {
      this.router.navigate(['/revenues']);
    }
  }
}

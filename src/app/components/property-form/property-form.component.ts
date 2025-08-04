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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PropertyService } from '../../services/property.service';
import { Property, PropertyType } from '../../models/property.model';

@Component({
  selector: 'app-property-form',
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
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  template: `
    <div class="property-form-container">
      <div class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit Property' : 'Add New Property' }}</h1>
      </div>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Property Information</mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode() ? 'Update the property details below' : 'Fill in the details for your new property' }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="propertyForm" (ngSubmit)="onSubmit()">
            <!-- Basic Information -->
            <div class="form-section">
              <h3>Basic Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Property Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g., Sunset Apartments #101">
                  <mat-error *ngIf="propertyForm.get('name')?.hasError('required')">
                    Property name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address</mat-label>
                  <textarea matInput formControlName="address" rows="2" 
                           placeholder="123 Main Street, City, State, ZIP"></textarea>
                  <mat-error *ngIf="propertyForm.get('address')?.hasError('required')">
                    Address is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Property Type</mat-label>
                  <mat-select formControlName="type">
                    @for (type of propertyTypes; track type.value) {
                      <mat-option [value]="type.value">{{ type.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-error *ngIf="propertyForm.get('type')?.hasError('required')">
                    Property type is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Date Acquired</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="dateAcquired">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="propertyForm.get('dateAcquired')?.hasError('required')">
                    Acquisition date is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description (Optional)</mat-label>
                  <textarea matInput formControlName="description" rows="3" 
                           placeholder="Additional details about the property..."></textarea>
                </mat-form-field>
              </div>
            </div>

            <!-- Financial Information -->
            <div class="form-section">
              <h3>Financial Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Purchase Price</mat-label>
                  <input matInput type="number" formControlName="purchasePrice" 
                         placeholder="0" min="0" step="1000">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="propertyForm.get('purchasePrice')?.hasError('required')">
                    Purchase price is required
                  </mat-error>
                  <mat-error *ngIf="propertyForm.get('purchasePrice')?.hasError('min')">
                    Purchase price must be greater than 0
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Monthly Rent</mat-label>
                  <input matInput type="number" formControlName="monthlyRent" 
                         placeholder="0" min="0" step="100">
                  <span matTextPrefix>$</span>
                  <mat-error *ngIf="propertyForm.get('monthlyRent')?.hasError('required')">
                    Monthly rent is required
                  </mat-error>
                  <mat-error *ngIf="propertyForm.get('monthlyRent')?.hasError('min')">
                    Monthly rent must be greater than 0
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Tenant Information -->
            <div class="form-section">
              <h3>Tenant Information (Optional)</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tenant Name</mat-label>
                  <input matInput formControlName="tenantName" placeholder="Current tenant name">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Lease Start Date</mat-label>
                  <input matInput [matDatepicker]="leaseStartPicker" formControlName="leaseStartDate">
                  <mat-datepicker-toggle matIconSuffix [for]="leaseStartPicker"></mat-datepicker-toggle>
                  <mat-datepicker #leaseStartPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Lease End Date</mat-label>
                  <input matInput [matDatepicker]="leaseEndPicker" formControlName="leaseEndDate">
                  <mat-datepicker-toggle matIconSuffix [for]="leaseEndPicker"></mat-datepicker-toggle>
                  <mat-datepicker #leaseEndPicker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>

            <!-- Status -->
            <div class="form-section">
              <h3>Property Status</h3>
              
              <div class="form-row">
                <mat-slide-toggle formControlName="isActive" color="primary">
                  Property is Active
                </mat-slide-toggle>
                <p class="status-description">
                  Active properties are included in financial calculations and reports.
                </p>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button type="button" (click)="goBack()">Cancel</button>
          <button mat-raised-button color="primary" 
                  [disabled]="!propertyForm.valid || isSubmitting()"
                  (click)="onSubmit()">
            <mat-icon>{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
            {{ isSubmitting() ? 'Saving...' : (isEditMode() ? 'Update Property' : 'Add Property') }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .property-form-container {
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

    .status-description {
      margin: 8px 0 0 0;
      color: #666;
      font-size: 0.9em;
    }

    mat-card {
      margin-bottom: 24px;
    }

    mat-card-actions {
      padding: 16px 24px;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .property-form-container {
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
export class PropertyFormComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly isEditMode = signal(false);
  protected readonly isSubmitting = signal(false);
  protected currentPropertyId: string | null = null;

  protected readonly propertyTypes = [
    { value: PropertyType.APARTMENT, label: 'Apartment' },
    { value: PropertyType.HOUSE, label: 'House' },
    { value: PropertyType.CONDO, label: 'Condo' },
    { value: PropertyType.TOWNHOUSE, label: 'Townhouse' },
    { value: PropertyType.STUDIO, label: 'Studio' },
    { value: PropertyType.OTHER, label: 'Other' }
  ];

  protected propertyForm: FormGroup;

  constructor() {
    this.propertyForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      address: ['', [Validators.required]],
      type: ['', [Validators.required]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      monthlyRent: [0, [Validators.required, Validators.min(0)]],
      dateAcquired: ['', [Validators.required]],
      isActive: [true],
      description: [''],
      tenantName: [''],
      leaseStartDate: [''],
      leaseEndDate: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.currentPropertyId = id;
      this.isEditMode.set(true);
      this.loadProperty(id);
    }
  }

  private loadProperty(id: string): void {
    const property = this.propertyService.getProperty(id);
    if (property) {
      this.propertyForm.patchValue({
        name: property.name,
        address: property.address,
        type: property.type,
        purchasePrice: property.purchasePrice,
        monthlyRent: property.monthlyRent,
        dateAcquired: property.dateAcquired,
        isActive: property.isActive,
        description: property.description || '',
        tenantName: property.tenantName || '',
        leaseStartDate: property.leaseStartDate || '',
        leaseEndDate: property.leaseEndDate || ''
      });
    } else {
      this.snackBar.open('Property not found', 'Close', { duration: 3000 });
      this.router.navigate(['/properties']);
    }
  }

  protected onSubmit(): void {
    if (this.propertyForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = this.propertyForm.value;
      const propertyData = {
        name: formValue.name,
        address: formValue.address,
        type: formValue.type,
        purchasePrice: Number(formValue.purchasePrice),
        monthlyRent: Number(formValue.monthlyRent),
        dateAcquired: formValue.dateAcquired,
        isActive: formValue.isActive,
        description: formValue.description || undefined,
        tenantName: formValue.tenantName || undefined,
        leaseStartDate: formValue.leaseStartDate || undefined,
        leaseEndDate: formValue.leaseEndDate || undefined
      };

      try {
        if (this.isEditMode() && this.currentPropertyId) {
          this.propertyService.updateProperty(this.currentPropertyId, propertyData);
          this.snackBar.open('Property updated successfully', 'Close', { duration: 3000 });
        } else {
          this.propertyService.addProperty(propertyData);
          this.snackBar.open('Property added successfully', 'Close', { duration: 3000 });
        }
        
        this.router.navigate(['/properties']);
      } catch (error) {
        this.snackBar.open('Error saving property', 'Close', { duration: 3000 });
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  protected goBack(): void {
    this.router.navigate(['/properties']);
  }
}

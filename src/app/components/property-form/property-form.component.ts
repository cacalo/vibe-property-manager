import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { PropertyService } from '../../services/property.service';
import { GeocodingService } from '../../services/geocoding.service';
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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
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
                           placeholder="123 Main Street, City, State, ZIP"
                           (blur)="onAddressBlur()"></textarea>
                  <mat-icon matIconSuffix 
                           *ngIf="isGeocoding()" 
                           class="geocoding-spinner">
                    <mat-spinner diameter="20"></mat-spinner>
                  </mat-icon>
                  <mat-icon matIconSuffix 
                           *ngIf="!isGeocoding() && lastGeocodingSuccess()" 
                           class="geocoding-success"
                           matTooltip="Coordinates auto-populated">
                    check_circle
                  </mat-icon>
                  <mat-error *ngIf="propertyForm.get('address')?.hasError('required')">
                    Address is required
                  </mat-error>
                  <mat-hint *ngIf="!isGeocoding() && lastGeocodingSuccess()">
                    Coordinates auto-populated from address
                  </mat-hint>
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

            <!-- Map Coordinates (Optional) -->
            <div class="form-section">
              <h3>Map Location</h3>
              <p class="section-description">
                Coordinates are automatically populated when you enter an address. You can also enter them manually.
              </p>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Latitude</mat-label>
                  <input matInput type="number" formControlName="latitude" 
                         placeholder="40.7128" step="any">
                  <mat-hint>Decimal degrees (e.g., 40.7128)</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Longitude</mat-label>
                  <input matInput type="number" formControlName="longitude" 
                         placeholder="-74.0060" step="any">
                  <mat-hint>Decimal degrees (e.g., -74.0060)</mat-hint>
                </mat-form-field>
              </div>
              
              <div class="form-row geocoding-controls">
                <button mat-stroked-button type="button" 
                        (click)="geocodeCurrentAddress()"
                        [disabled]="!propertyForm.get('address')?.value || isGeocoding()">
                  <mat-icon>my_location</mat-icon>
                  @if (isGeocoding()) {
                    Getting coordinates...
                  } @else {
                    Get coordinates from address
                  }
                </button>
                
                <button mat-stroked-button type="button" 
                        (click)="clearCoordinates()"
                        [disabled]="!hasCoordinates()">
                  <mat-icon>clear</mat-icon>
                  Clear coordinates
                </button>
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

    .section-description {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 0.9em;
      line-height: 1.4;
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

    .geocoding-controls {
      justify-content: flex-start;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .geocoding-spinner {
      color: #1976d2;
      
      mat-spinner {
        display: inline-block;
      }
    }

    .geocoding-success {
      color: #4caf50;
    }

    ::ng-deep .success-snackbar {
      background-color: #4caf50 !important;
      color: white !important;
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
export class PropertyFormComponent implements OnInit, OnDestroy {
  private readonly propertyService = inject(PropertyService);
  private readonly geocodingService = inject(GeocodingService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  protected readonly isEditMode = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isGeocoding = signal(false);
  protected readonly lastGeocodingSuccess = signal(false);
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
      leaseEndDate: [''],
      latitude: [null],
      longitude: [null]
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        leaseEndDate: property.leaseEndDate || '',
        latitude: property.latitude || null,
        longitude: property.longitude || null
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
        leaseEndDate: formValue.leaseEndDate || undefined,
        latitude: formValue.latitude ? Number(formValue.latitude) : undefined,
        longitude: formValue.longitude ? Number(formValue.longitude) : undefined
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

  // Geocoding methods
  protected onAddressBlur(): void {
    const address = this.propertyForm.get('address')?.value;
    if (address && address.trim().length > 5 && !this.hasCoordinates()) {
      this.geocodeAddress(address.trim());
    }
  }

  protected geocodeCurrentAddress(): void {
    const address = this.propertyForm.get('address')?.value;
    if (address && address.trim()) {
      this.geocodeAddress(address.trim());
    }
  }

  protected hasCoordinates(): boolean {
    const lat = this.propertyForm.get('latitude')?.value;
    const lng = this.propertyForm.get('longitude')?.value;
    return !!(lat && lng);
  }

  protected clearCoordinates(): void {
    this.propertyForm.patchValue({
      latitude: null,
      longitude: null
    });
    this.lastGeocodingSuccess.set(false);
  }

  private geocodeAddress(address: string): void {
    this.isGeocoding.set(true);
    this.lastGeocodingSuccess.set(false);

    this.geocodingService.geocodeAddress(address)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isGeocoding.set(false);
          if (result) {
            this.propertyForm.patchValue({
              latitude: result.latitude,
              longitude: result.longitude
            });
            this.lastGeocodingSuccess.set(true);
            this.snackBar.open('Coordinates found and populated!', 'Close', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('Could not find coordinates for this address. You can enter them manually.', 'Close', { 
              duration: 5000 
            });
          }
        },
        error: (error) => {
          this.isGeocoding.set(false);
          console.error('Geocoding error:', error);
          this.snackBar.open('Error getting coordinates. Please try again or enter manually.', 'Close', { 
            duration: 5000 
          });
        }
      });
  }
}

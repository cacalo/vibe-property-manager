import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PropertyService } from '../../services/property.service';
import { Property, PropertyType } from '../../models/property.model';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSnackBarModule
  ],
  template: `
    <div class="property-list-container">
      <div class="header">
        <h1>Properties</h1>
        <button mat-raised-button color="primary" routerLink="/properties/new">
          <mat-icon>add</mat-icon>
          Add Property
        </button>
      </div>

      <!-- Search and Filter Section -->
      <mat-expansion-panel class="filter-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>filter_list</mat-icon>
            Search & Filter Properties
          </mat-panel-title>
          <mat-panel-description>
            {{ filteredProperties().length }} of {{ propertyService.properties().length }} properties shown
          </mat-panel-description>
        </mat-expansion-panel-header>

        <form [formGroup]="filterForm" class="filter-form">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search properties</mat-label>
              <input matInput formControlName="searchTerm" placeholder="Search by name or address...">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Property Type</mat-label>
              <mat-select formControlName="propertyType">
                <mat-option value="">All Types</mat-option>
                <mat-option value="apartment">Apartment</mat-option>
                <mat-option value="house">House</mat-option>
                <mat-option value="condo">Condo</mat-option>
                <mat-option value="townhouse">Townhouse</mat-option>
                <mat-option value="studio">Studio</mat-option>
                <mat-option value="other">Other</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All Status</mat-option>
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Min Monthly Rent</mat-label>
              <input matInput type="number" formControlName="minRent" placeholder="0">
              <span matPrefix>$</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Max Monthly Rent</mat-label>
              <input matInput type="number" formControlName="maxRent" placeholder="No limit">
              <span matPrefix>$</span>
            </mat-form-field>

            <div class="filter-actions">
              <button mat-button type="button" (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      </mat-expansion-panel>

      <div class="properties-grid">
        @for (property of filteredProperties(); track property.id) {
          <mat-card class="property-card" [class.inactive]="!property.isActive">
            <mat-card-header>
              <mat-card-title>{{ property.name }}</mat-card-title>
              <mat-card-subtitle>{{ property.address }}</mat-card-subtitle>
              <div class="card-actions">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/properties', property.id]">
                    <mat-icon>visibility</mat-icon>
                    <span>View Details</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/properties', property.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/revenue/new']" [queryParams]="{propertyId: property.id}">
                    <mat-icon>payment</mat-icon>
                    <span>Add Revenue</span>
                  </button>
                  <button mat-menu-item [routerLink]="['/expenses/new']" [queryParams]="{propertyId: property.id}">
                    <mat-icon>receipt</mat-icon>
                    <span>Add Expense</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="togglePropertyStatus(property)" 
                          [class.deactivate]="property.isActive">
                    <mat-icon>{{ property.isActive ? 'pause' : 'play_arrow' }}</mat-icon>
                    <span>{{ property.isActive ? 'Deactivate' : 'Activate' }}</span>
                  </button>
                  <button mat-menu-item (click)="deleteProperty(property)" class="delete-action">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </div>
            </mat-card-header>

            <mat-card-content>
              <div class="property-info">
                <div class="info-row">
                  <mat-chip class="type-chip" [class]="getPropertyTypeClass(property.type)">
                    {{ formatPropertyType(property.type) }}
                  </mat-chip>
                  <mat-chip class="status-chip" [class.active]="property.isActive" [class.inactive]="!property.isActive">
                    {{ property.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </div>

                <div class="financial-summary">
                  <div class="financial-item">
                    <span class="label">Purchase Price:</span>
                    <span class="value">{{ formatCurrency(property.purchasePrice) }}</span>
                  </div>
                  <div class="financial-item">
                    <span class="label">Monthly Rent:</span>
                    <span class="value highlight">{{ formatCurrency(property.monthlyRent) }}</span>
                  </div>
                  @if (property.tenantName) {
                    <div class="financial-item">
                      <span class="label">Tenant:</span>
                      <span class="value">{{ property.tenantName }}</span>
                    </div>
                  }
                  <div class="financial-item">
                    <span class="label">Acquired:</span>
                    <span class="value">{{ formatDate(property.dateAcquired) }}</span>
                  </div>
                </div>

                @if (property.description) {
                  <div class="description">
                    <p>{{ property.description }}</p>
                  </div>
                }
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-button [routerLink]="['/properties', property.id]">
                <mat-icon>visibility</mat-icon>
                View Details
              </button>
              <button mat-button [routerLink]="['/properties', property.id, 'edit']">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
            </mat-card-actions>
          </mat-card>
        } @empty {
          <div class="empty-state">
            <mat-card>
              <mat-card-content>
                <mat-icon>home_work</mat-icon>
                <h2>No Properties Yet</h2>
                <p>Start building your property portfolio by adding your first property.</p>
                <button mat-raised-button color="primary" routerLink="/properties/new">
                  <mat-icon>add</mat-icon>
                  Add Your First Property
                </button>
              </mat-card-content>
            </mat-card>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .property-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header h1 {
      margin: 0;
      color: #1976d2;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 24px;
    }

    .property-card {
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      position: relative;
    }

    .property-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .property-card.inactive {
      opacity: 0.7;
      border-left: 4px solid #f44336;
    }

    .property-card .card-actions {
      margin-left: auto;
    }

    .info-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      align-items: center;
    }

    .type-chip {
      font-size: 12px;
      height: 24px;
    }

    .type-chip.apartment { background-color: #e3f2fd; color: var(--primary-color); }
    .type-chip.house { background-color: var(--success-background); color: #388e3c; }
    .type-chip.condo { background-color: var(--warning-background); color: var(--warning-dark); }
    .type-chip.townhouse { background-color: var(--purple-background); color: var(--purple-dark); }
    .type-chip.studio { background-color: #fce4ec; color: #c2185b; }
    .type-chip.other { background-color: var(--background-secondary); color: #616161; }

    .status-chip {
      font-size: var(--font-size-xs);
      height: 24px;
    }

    .status-chip.active {
      background-color: var(--success-background);
      color: #388e3c;
    }

    .status-chip.inactive {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .financial-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .financial-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .financial-item .label {
      font-weight: 500;
      color: #666;
    }

    .financial-item .value {
      font-weight: bold;
    }

    .financial-item .value.highlight {
      color: #1976d2;
      font-size: 1.1em;
    }

    .description {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    .description p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .empty-state mat-card {
      text-align: center;
      padding: 48px 24px;
      max-width: 400px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      margin: 16px 0 8px 0;
      color: #666;
    }

    .empty-state p {
      color: #999;
      margin-bottom: 24px;
    }

    .delete-action {
      color: #d32f2f;
    }

    .deactivate {
      color: #ff9800;
    }

    @media (max-width: 768px) {
      .property-list-container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .properties-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PropertyListComponent {
  protected readonly propertyService = inject(PropertyService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly filterForm: FormGroup;
  protected readonly filterValues = signal<any>({});

  constructor() {
    this.filterForm = this.formBuilder.group({
      searchTerm: [''],
      propertyType: [''],
      status: [''],
      minRent: [''],
      maxRent: ['']
    });

    // Subscribe to form changes and update the signal
    this.filterForm.valueChanges.subscribe(values => {
      this.filterValues.set(values);
    });

    // Initialize with current form values
    this.filterValues.set(this.filterForm.value);
  }

  protected readonly filteredProperties = computed(() => {
    const properties = this.propertyService.properties();
    const filters = this.filterValues();

    return properties.filter(property => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = property.name.toLowerCase().includes(searchLower);
        const addressMatch = property.address.toLowerCase().includes(searchLower);
        if (!nameMatch && !addressMatch) return false;
      }

      // Property type filter
      if (filters.propertyType && property.type !== filters.propertyType) {
        return false;
      }

      // Status filter
      if (filters.status) {
        const isActive = filters.status === 'active';
        if (property.isActive !== isActive) return false;
      }

      // Rent range filter
      if (filters.minRent && property.monthlyRent < Number(filters.minRent)) {
        return false;
      }

      if (filters.maxRent && property.monthlyRent > Number(filters.maxRent)) {
        return false;
      }

      return true;
    });
  });

  protected clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      propertyType: '',
      status: '',
      minRent: '',
      maxRent: ''
    });
    this.snackBar.open('Filters cleared', 'Close', { duration: 2000 });
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  protected formatPropertyType(type: PropertyType): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  }

  protected getPropertyTypeClass(type: PropertyType): string {
    return type.toLowerCase().replace(/_/g, '-');
  }

  protected togglePropertyStatus(property: Property): void {
    this.propertyService.updateProperty(property.id, {
      isActive: !property.isActive
    });
  }

  protected deleteProperty(property: Property): void {
    if (confirm(`Are you sure you want to delete "${property.name}"? This will also delete all associated revenues and expenses.`)) {
      this.propertyService.deleteProperty(property.id);
    }
  }
}

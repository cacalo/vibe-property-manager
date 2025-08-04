import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PropertyService } from './services/property.service';
import { InvoiceService } from './services/invoice.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    RouterModule,
    MatToolbarModule, 
    MatIconModule, 
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly propertyService = inject(PropertyService);
  protected readonly invoiceService = inject(InvoiceService);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly router = inject(Router);

  protected readonly title = signal('Vibe - Property Rental Tracker');
  protected selectedPropertyId: string | null = null;

  // Computed properties for navigation badges
  protected readonly propertiesCount = computed(() => this.propertyService.properties().length);
  protected readonly activePropertiesCount = computed(() => 
    this.propertyService.properties().filter(p => p.isActive).length
  );
  protected readonly revenuesCount = computed(() => this.propertyService.revenues().length);
  protected readonly expensesCount = computed(() => this.propertyService.expenses().length);
  protected readonly invoicesCount = computed(() => this.invoiceService.invoices().length);
  protected readonly pendingInvoicesCount = computed(() => this.invoiceService.pendingInvoices().length);

  protected loadSampleData(): void {
    try {
      this.propertyService.loadSampleData();
      this.snackBar.open('Sample data loaded successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error loading sample data', 'Close', { duration: 3000 });
    }
  }

  // Quick navigation methods
  protected navigateToAddProperty(): void {
    this.router.navigate(['/properties/new']);
  }

  protected navigateToAddRevenue(): void {
    this.router.navigate(['/revenue/new']);
  }

  protected navigateToAddExpense(): void {
    this.router.navigate(['/expenses/new']);
  }

  protected navigateToAddInvoice(): void {
    this.router.navigate(['/invoices/new']);
  }

  protected navigateToInvoices(): void {
    this.router.navigate(['/invoices']);
  }

  protected navigateToProperty(propertyId: string): void {
    this.router.navigate(['/properties', propertyId]);
  }

  protected navigateToPropertyEdit(propertyId: string): void {
    this.router.navigate(['/properties', propertyId, 'edit']);
  }

  protected navigateToPropertyRevenue(propertyId: string): void {
    this.router.navigate(['/properties', propertyId, 'revenue', 'new']);
  }

  protected navigateToPropertyExpense(propertyId: string): void {
    this.router.navigate(['/properties', propertyId, 'expenses', 'new']);
  }

  protected exportData(): void {
    try {
      const data = {
        properties: this.propertyService.properties(),
        revenues: this.propertyService.revenues(),
        expenses: this.propertyService.expenses(),
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `vibe-property-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.snackBar.open('Data exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error exporting data', 'Close', { duration: 3000 });
    }
  }

  protected clearData(): void {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        this.propertyService.clearAllData();
        this.snackBar.open('All data cleared successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error clearing data', 'Close', { duration: 3000 });
      }
    }
  }
}

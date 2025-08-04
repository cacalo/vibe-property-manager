import { Injectable } from '@angular/core';
import { Property, Revenue, Expense } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  
  exportPropertiesCSV(properties: Property[]): void {
    const headers = [
      'Name',
      'Address', 
      'Type',
      'Purchase Price',
      'Monthly Rent',
      'Date Acquired',
      'Status',
      'Tenant Name',
      'Lease Start',
      'Lease End',
      'Description'
    ];

    const csvData = properties.map(property => [
      this.escapeCSV(property.name),
      this.escapeCSV(property.address),
      this.escapeCSV(property.type),
      property.purchasePrice.toString(),
      property.monthlyRent.toString(),
      this.formatDate(property.dateAcquired),
      property.isActive ? 'Active' : 'Inactive',
      this.escapeCSV(property.tenantName || ''),
      property.leaseStartDate ? this.formatDate(property.leaseStartDate) : '',
      property.leaseEndDate ? this.formatDate(property.leaseEndDate) : '',
      this.escapeCSV(property.description || '')
    ]);

    this.downloadCSV([headers, ...csvData], 'properties');
  }

  exportRevenuesCSV(revenues: Revenue[], properties: Property[]): void {
    const headers = [
      'Property Name',
      'Property Address',
      'Amount',
      'Type',
      'Date',
      'Description',
      'Payer',
      'Payment Method',
      'Reference Number'
    ];

    const propertyMap = new Map(properties.map(p => [p.id, p]));

    const csvData = revenues.map(revenue => {
      const property = propertyMap.get(revenue.propertyId);
      return [
        this.escapeCSV(property?.name || 'Unknown Property'),
        this.escapeCSV(property?.address || ''),
        revenue.amount.toString(),
        this.escapeCSV(revenue.type),
        this.formatDate(revenue.date),
        this.escapeCSV(revenue.description || ''),
        this.escapeCSV(revenue.payer || ''),
        this.escapeCSV(revenue.paymentMethod || ''),
        this.escapeCSV(revenue.referenceNumber || '')
      ];
    });

    this.downloadCSV([headers, ...csvData], 'revenues');
  }

  exportExpensesCSV(expenses: Expense[], properties: Property[]): void {
    const headers = [
      'Property Name',
      'Property Address',
      'Amount',
      'Category',
      'Date',
      'Description',
      'Vendor',
      'Payment Method',
      'Receipt Number',
      'Notes'
    ];

    const propertyMap = new Map(properties.map(p => [p.id, p]));

    const csvData = expenses.map(expense => {
      const property = propertyMap.get(expense.propertyId);
      return [
        this.escapeCSV(property?.name || 'Unknown Property'),
        this.escapeCSV(property?.address || ''),
        expense.amount.toString(),
        this.escapeCSV(expense.category),
        this.formatDate(expense.date),
        this.escapeCSV(expense.description),
        this.escapeCSV(expense.vendor || ''),
        this.escapeCSV(expense.paymentMethod || ''),
        this.escapeCSV(expense.receiptNumber || ''),
        this.escapeCSV(expense.notes || '')
      ];
    });

    this.downloadCSV([headers, ...csvData], 'expenses');
  }

  exportFinancialSummaryCSV(
    properties: Property[],
    revenues: Revenue[],
    expenses: Expense[]
  ): void {
    const headers = [
      'Property Name',
      'Property Type',
      'Purchase Price',
      'Monthly Rent',
      'Total Revenue',
      'Total Expenses',
      'Net Income',
      'ROI (%)',
      'Revenue Transactions',
      'Expense Transactions'
    ];

    const csvData = properties.map(property => {
      const propertyRevenues = revenues.filter(r => r.propertyId === property.id);
      const propertyExpenses = expenses.filter(e => e.propertyId === property.id);
      
      const totalRevenue = propertyRevenues.reduce((sum, r) => sum + r.amount, 0);
      const totalExpenses = propertyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const netIncome = totalRevenue - totalExpenses;
      const roi = property.purchasePrice > 0 ? (netIncome / property.purchasePrice) * 100 : 0;

      return [
        this.escapeCSV(property.name),
        this.escapeCSV(property.type),
        property.purchasePrice.toString(),
        property.monthlyRent.toString(),
        totalRevenue.toString(),
        totalExpenses.toString(),
        netIncome.toString(),
        roi.toFixed(2),
        propertyRevenues.length.toString(),
        propertyExpenses.length.toString()
      ];
    });

    this.downloadCSV([headers, ...csvData], 'financial-summary');
  }

  exportAllDataJSON(data: {
    properties: Property[];
    revenues: Revenue[];
    expenses: Expense[];
  }): void {
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0',
      application: 'Vibe Property Manager'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    this.downloadFile(dataBlob, `vibe-complete-backup-${this.getDateString()}.json`);
  }

  private downloadCSV(data: string[][], filename: string): void {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `vibe-${filename}-${this.getDateString()}.csv`);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = value.replace(/"/g, '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US');
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

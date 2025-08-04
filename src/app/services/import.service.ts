import { Injectable, inject } from '@angular/core';
import { PropertyService } from './property.service';
import { Property, Revenue, Expense, PropertyType, RevenueType, ExpenseCategory } from '../models/property.model';

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private propertyService = inject(PropertyService);

  /**
   * Import properties from CSV content
   */
  async importPropertiesFromCSV(csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      importedCount: 0,
      errors: []
    };

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        result.message = 'CSV file must contain headers and at least one data row';
        return result;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const requiredHeaders = ['name', 'address', 'type', 'monthlyRent'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        result.message = `Missing required headers: ${missingHeaders.join(', ')}`;
        return result;
      }

      let importedCount = 0;
      
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        try {
          const values = this.parseCSVLine(line);
          if (values.length !== headers.length) {
            result.errors.push(`Line ${i + 2}: Column count mismatch`);
            continue;
          }

          const property = this.createPropertyFromCSVData(headers, values);
          if (property) {
            this.propertyService.addProperty(property);
            importedCount++;
          }
        } catch (error) {
          result.errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }

      result.success = importedCount > 0;
      result.importedCount = importedCount;
      result.message = `Successfully imported ${importedCount} properties`;
      
      if (result.errors.length > 0) {
        result.message += ` (${result.errors.length} errors)`;
      }

    } catch (error) {
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  /**
   * Import revenues from CSV content
   */
  async importRevenuesFromCSV(csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      importedCount: 0,
      errors: []
    };

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        result.message = 'CSV file must contain headers and at least one data row';
        return result;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const requiredHeaders = ['propertyId', 'amount', 'type', 'date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        result.message = `Missing required headers: ${missingHeaders.join(', ')}`;
        return result;
      }

      let importedCount = 0;
      
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        try {
          const values = this.parseCSVLine(line);
          if (values.length !== headers.length) {
            result.errors.push(`Line ${i + 2}: Column count mismatch`);
            continue;
          }

          const revenue = this.createRevenueFromCSVData(headers, values);
          if (revenue) {
            this.propertyService.addRevenue(revenue);
            importedCount++;
          }
        } catch (error) {
          result.errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }

      result.success = importedCount > 0;
      result.importedCount = importedCount;
      result.message = `Successfully imported ${importedCount} revenue entries`;
      
      if (result.errors.length > 0) {
        result.message += ` (${result.errors.length} errors)`;
      }

    } catch (error) {
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  /**
   * Import expenses from CSV content
   */
  async importExpensesFromCSV(csvContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      importedCount: 0,
      errors: []
    };

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        result.message = 'CSV file must contain headers and at least one data row';
        return result;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      const requiredHeaders = ['propertyId', 'amount', 'category', 'date'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        result.message = `Missing required headers: ${missingHeaders.join(', ')}`;
        return result;
      }

      let importedCount = 0;
      
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;

        try {
          const values = this.parseCSVLine(line);
          if (values.length !== headers.length) {
            result.errors.push(`Line ${i + 2}: Column count mismatch`);
            continue;
          }

          const expense = this.createExpenseFromCSVData(headers, values);
          if (expense) {
            this.propertyService.addExpense(expense);
            importedCount++;
          }
        } catch (error) {
          result.errors.push(`Line ${i + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }

      result.success = importedCount > 0;
      result.importedCount = importedCount;
      result.message = `Successfully imported ${importedCount} expense entries`;
      
      if (result.errors.length > 0) {
        result.message += ` (${result.errors.length} errors)`;
      }

    } catch (error) {
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  /**
   * Import complete backup from JSON
   */
  async importBackupFromJSON(jsonContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      importedCount: 0,
      errors: []
    };

    try {
      const data = JSON.parse(jsonContent);
      
      if (!data.properties || !Array.isArray(data.properties)) {
        result.message = 'Invalid backup format: missing properties array';
        return result;
      }

      // Validate backup data structure
      if (!data.revenues || !Array.isArray(data.revenues)) {
        result.errors.push('Missing or invalid revenues data');
      }
      
      if (!data.expenses || !Array.isArray(data.expenses)) {
        result.errors.push('Missing or invalid expenses data');
      }

      let totalImported = 0;

      // Import properties
      for (const propertyData of data.properties) {
        try {
          const property = this.validateAndCreateProperty(propertyData);
          this.propertyService.addProperty(property);
          totalImported++;
        } catch (error) {
          result.errors.push(`Property import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Import revenues
      if (data.revenues && Array.isArray(data.revenues)) {
        for (const revenueData of data.revenues) {
          try {
            const revenue = this.validateAndCreateRevenue(revenueData);
            this.propertyService.addRevenue(revenue);
            totalImported++;
          } catch (error) {
            result.errors.push(`Revenue import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const expenseData of data.expenses) {
          try {
            const expense = this.validateAndCreateExpense(expenseData);
            this.propertyService.addExpense(expense);
            totalImported++;
          } catch (error) {
            result.errors.push(`Expense import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      result.success = totalImported > 0;
      result.importedCount = totalImported;
      result.message = `Successfully imported ${totalImported} records from backup`;
      
      if (result.errors.length > 0) {
        result.message += ` (${result.errors.length} errors)`;
      }

    } catch (error) {
      result.message = `Import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`;
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(value => value.replace(/^"|"$/g, ''));
  }

  private createPropertyFromCSVData(headers: string[], values: string[]): Property | null {
    const data: any = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    if (!data.name || !data.address || !data.type || !data.monthlyRent) {
      throw new Error('Missing required property fields');
    }

    const property: Property = {
      id: this.generateId(),
      name: data.name,
      address: data.address,
      type: this.validatePropertyType(data.type),
      purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : 0,
      monthlyRent: parseFloat(data.monthlyRent || data.rent),
      dateAcquired: data.dateAcquired ? new Date(data.dateAcquired) : new Date(),
      isActive: data.isActive !== undefined ? data.isActive === 'true' : true,
      description: data.description || '',
      tenantName: data.tenantName || undefined,
      leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate) : undefined,
      leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : undefined
    };

    return property;
  }

  private createRevenueFromCSVData(headers: string[], values: string[]): Revenue | null {
    const data: any = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    if (!data.propertyId || !data.amount || !data.type || !data.date) {
      throw new Error('Missing required revenue fields');
    }

    const revenue: Revenue = {
      id: this.generateId(),
      propertyId: data.propertyId,
      amount: parseFloat(data.amount),
      type: this.validateRevenueType(data.type),
      date: new Date(data.date),
      description: data.description || '',
      paymentMethod: data.paymentMethod || 'other'
    };

    return revenue;
  }

  private createExpenseFromCSVData(headers: string[], values: string[]): Expense | null {
    const data: any = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    if (!data.propertyId || !data.amount || !data.category || !data.date) {
      throw new Error('Missing required expense fields');
    }

    const expense: Expense = {
      id: this.generateId(),
      propertyId: data.propertyId,
      amount: parseFloat(data.amount),
      category: this.validateExpenseCategory(data.category),
      date: new Date(data.date),
      description: data.description || '',
      vendor: data.vendor || '',
      paymentMethod: data.paymentMethod || 'other'
    };

    return expense;
  }

  private validateAndCreateProperty(data: any): Property {
    if (!data.id || !data.name || !data.address || !data.type || data.monthlyRent === undefined) {
      throw new Error('Invalid property data structure');
    }

    return {
      ...data,
      type: this.validatePropertyType(data.type),
      dateAcquired: new Date(data.dateAcquired),
      leaseStartDate: data.leaseStartDate ? new Date(data.leaseStartDate) : undefined,
      leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : undefined
    };
  }

  private validateAndCreateRevenue(data: any): Revenue {
    if (!data.id || !data.propertyId || data.amount === undefined || !data.type || !data.date) {
      throw new Error('Invalid revenue data structure');
    }

    return {
      ...data,
      type: this.validateRevenueType(data.type),
      date: new Date(data.date)
    };
  }

  private validateAndCreateExpense(data: any): Expense {
    if (!data.id || !data.propertyId || data.amount === undefined || !data.category || !data.date) {
      throw new Error('Invalid expense data structure');
    }

    return {
      ...data,
      category: this.validateExpenseCategory(data.category),
      date: new Date(data.date)
    };
  }

  private validatePropertyType(type: string): PropertyType {
    const validTypes = Object.values(PropertyType);
    const foundType = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
    if (!foundType) {
      throw new Error(`Invalid property type: ${type}`);
    }
    return foundType;
  }

  private validateRevenueType(type: string): RevenueType {
    const validTypes = Object.values(RevenueType);
    const foundType = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
    if (!foundType) {
      throw new Error(`Invalid revenue type: ${type}`);
    }
    return foundType;
  }

  private validateExpenseCategory(category: string): ExpenseCategory {
    const validCategories = Object.values(ExpenseCategory);
    const foundCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
    if (!foundCategory) {
      throw new Error(`Invalid expense category: ${category}`);
    }
    return foundCategory;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

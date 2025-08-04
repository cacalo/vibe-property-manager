import { Injectable, signal, computed } from '@angular/core';
import { Property, Revenue, Expense, PropertyFinancials, PropertyType, RevenueType, ExpenseCategory, ExpenseType } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly STORAGE_KEYS = {
    PROPERTIES: 'vibe_properties',
    REVENUES: 'vibe_revenues',
    EXPENSES: 'vibe_expenses'
  };

  // Signals for reactive data
  private _properties = signal<Property[]>([]);
  private _revenues = signal<Revenue[]>([]);
  private _expenses = signal<Expense[]>([]);

  // Public computed signals
  public properties = this._properties.asReadonly();
  public revenues = this._revenues.asReadonly();
  public expenses = this._expenses.asReadonly();

  // Computed financial summaries
  public totalNetIncome = computed(() => {
    const totalRevenue = this._revenues().reduce((sum, rev) => sum + rev.amount, 0);
    const totalExpenses = this._expenses().reduce((sum, exp) => sum + exp.amount, 0);
    return totalRevenue - totalExpenses;
  });

  public activePropertiesCount = computed(() => 
    this._properties().filter(p => p.isActive).length
  );

  constructor() {
    this.loadDataFromStorage();
  }

  // Property Management
  addProperty(propertyData: Omit<Property, 'id'>): Property {
    const property: Property = {
      ...propertyData,
      id: this.generateId()
    };
    
    this._properties.update(properties => [...properties, property]);
    this.savePropertiesToStorage();
    return property;
  }

  updateProperty(id: string, updates: Partial<Property>): void {
    this._properties.update(properties => 
      properties.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    this.savePropertiesToStorage();
  }

  deleteProperty(id: string): void {
    this._properties.update(properties => properties.filter(p => p.id !== id));
    // Also remove associated revenues and expenses
    this._revenues.update(revenues => revenues.filter(r => r.propertyId !== id));
    this._expenses.update(expenses => expenses.filter(e => e.propertyId !== id));
    
    this.savePropertiesToStorage();
    this.saveRevenuesToStorage();
    this.saveExpensesToStorage();
  }

  getProperty(id: string): Property | undefined {
    return this._properties().find(p => p.id === id);
  }

  // Revenue Management
  addRevenue(revenueData: Omit<Revenue, 'id'>): Revenue {
    const revenue: Revenue = {
      ...revenueData,
      id: this.generateId()
    };
    
    this._revenues.update(revenues => [...revenues, revenue]);
    this.saveRevenuesToStorage();
    return revenue;
  }

  getRevenue(id: string): Revenue | undefined {
    return this._revenues().find(revenue => revenue.id === id);
  }

  updateRevenue(id: string, updates: Partial<Revenue>): void {
    this._revenues.update(revenues => 
      revenues.map(r => r.id === id ? { ...r, ...updates } : r)
    );
    this.saveRevenuesToStorage();
  }

  deleteRevenue(id: string): void {
    this._revenues.update(revenues => revenues.filter(r => r.id !== id));
    this.saveRevenuesToStorage();
  }

  getRevenuesForProperty(propertyId: string): Revenue[] {
    return this._revenues().filter(r => r.propertyId === propertyId);
  }

  // Expense Management
  addExpense(expenseData: Omit<Expense, 'id'>): Expense {
    const expense: Expense = {
      ...expenseData,
      id: this.generateId()
    };
    
    this._expenses.update(expenses => [...expenses, expense]);
    this.saveExpensesToStorage();
    return expense;
  }

  getExpense(id: string): Expense | undefined {
    return this._expenses().find(expense => expense.id === id);
  }

  updateExpense(id: string, updates: Partial<Expense>): void {
    this._expenses.update(expenses => 
      expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    );
    this.saveExpensesToStorage();
  }

  deleteExpense(id: string): void {
    this._expenses.update(expenses => expenses.filter(e => e.id !== id));
    this.saveExpensesToStorage();
  }

  getExpensesForProperty(propertyId: string): Expense[] {
    return this._expenses().filter(e => e.propertyId === propertyId);
  }

  // Convenience methods for map component
  getPropertyRevenues(propertyId: string): Revenue[] {
    return this.getRevenuesForProperty(propertyId);
  }

  getPropertyExpenses(propertyId: string): Expense[] {
    return this.getExpensesForProperty(propertyId);
  }

  // Financial Analytics
  getPropertyFinancials(propertyId: string): PropertyFinancials | null {
    const property = this.getProperty(propertyId);
    if (!property) return null;

    const revenues = this.getRevenuesForProperty(propertyId);
    const expenses = this.getExpensesForProperty(propertyId);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    // Calculate monthly average (assuming data spans multiple months)
    const monthsOwned = this.getMonthsOwned(property.dateAcquired);
    const monthlyNetIncome = monthsOwned > 0 ? netIncome / monthsOwned : 0;

    // Calculate ROI
    const roi = property.purchasePrice > 0 ? (netIncome / property.purchasePrice) * 100 : 0;

    // Simple occupancy rate (could be enhanced with vacancy tracking)
    const occupancyRate = property.isActive && property.tenantName ? 100 : 0;

    return {
      property,
      totalRevenue,
      totalExpenses,
      netIncome,
      monthlyNetIncome,
      occupancyRate,
      roi
    };
  }

  getAllPropertyFinancials(): PropertyFinancials[] {
    return this._properties()
      .map(property => this.getPropertyFinancials(property.id))
      .filter((financials): financials is PropertyFinancials => financials !== null);
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getMonthsOwned(acquisitionDate: Date): number {
    const now = new Date();
    const acquired = new Date(acquisitionDate);
    const diffTime = Math.abs(now.getTime() - acquired.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  }

  // Local Storage Methods
  private loadDataFromStorage(): void {
    try {
      const propertiesJson = localStorage.getItem(this.STORAGE_KEYS.PROPERTIES);
      const revenuesJson = localStorage.getItem(this.STORAGE_KEYS.REVENUES);
      const expensesJson = localStorage.getItem(this.STORAGE_KEYS.EXPENSES);

      if (propertiesJson) {
        const properties = JSON.parse(propertiesJson).map((p: any) => ({
          ...p,
          dateAcquired: new Date(p.dateAcquired),
          leaseStartDate: p.leaseStartDate ? new Date(p.leaseStartDate) : undefined,
          leaseEndDate: p.leaseEndDate ? new Date(p.leaseEndDate) : undefined
        }));
        this._properties.set(properties);
      }

      if (revenuesJson) {
        const revenues = JSON.parse(revenuesJson).map((r: any) => ({
          ...r,
          date: new Date(r.date)
        }));
        this._revenues.set(revenues);
      }

      if (expensesJson) {
        const expenses = JSON.parse(expensesJson).map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }));
        this._expenses.set(expenses);
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }

  private savePropertiesToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PROPERTIES, JSON.stringify(this._properties()));
    } catch (error) {
      console.error('Error saving properties to storage:', error);
    }
  }

  private saveRevenuesToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.REVENUES, JSON.stringify(this._revenues()));
    } catch (error) {
      console.error('Error saving revenues to storage:', error);
    }
  }

  private saveExpensesToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(this._expenses()));
    } catch (error) {
      console.error('Error saving expenses to storage:', error);
    }
  }

  // Data management methods
  clearAllData(): void {
    this._properties.set([]);
    this._revenues.set([]);
    this._expenses.set([]);
    this.savePropertiesToStorage();
    this.saveRevenuesToStorage();
    this.saveExpensesToStorage();
  }

  // Demo Data (for testing)
  loadSampleData(): void {
    if (this._properties().length === 0) {
      // Add sample properties
      const sampleProperty1 = this.addProperty({
        name: 'Sunset Apartments #101',
        address: '123 Sunset Blvd, Los Angeles, CA 90028',
        type: PropertyType.APARTMENT,
        purchasePrice: 250000,
        monthlyRent: 2200,
        dateAcquired: new Date('2023-01-15'),
        isActive: true,
        description: 'Modern 2-bedroom apartment in Hollywood',
        tenantName: 'John Smith',
        leaseStartDate: new Date('2023-02-01'),
        leaseEndDate: new Date('2024-01-31')
      });

      const sampleProperty2 = this.addProperty({
        name: 'Oak Street House',
        address: '456 Oak Street, San Francisco, CA 94102',
        type: PropertyType.HOUSE,
        purchasePrice: 850000,
        monthlyRent: 4500,
        dateAcquired: new Date('2022-06-01'),
        isActive: true,
        description: 'Victorian style 3-bedroom house',
        tenantName: 'Jane Doe',
        leaseStartDate: new Date('2023-03-01'),
        leaseEndDate: new Date('2024-02-29')
      });

      // Add sample revenues
      this.addRevenue({
        propertyId: sampleProperty1.id,
        amount: 2200,
        date: new Date('2023-02-01'),
        type: RevenueType.RENT,
        description: 'February rent'
      });

      this.addRevenue({
        propertyId: sampleProperty1.id,
        amount: 2200,
        date: new Date('2023-03-01'),
        type: RevenueType.RENT,
        description: 'March rent'
      });

      this.addRevenue({
        propertyId: sampleProperty2.id,
        amount: 4500,
        date: new Date('2023-03-01'),
        type: RevenueType.RENT,
        description: 'March rent'
      });

      // Add sample expenses
      this.addExpense({
        propertyId: sampleProperty1.id,
        amount: 150,
        date: new Date('2023-02-15'),
        category: ExpenseCategory.MAINTENANCE,
        description: 'Plumbing repair',
        vendor: 'ABC Plumbing',
        expenseType: ExpenseType.LANDLORD_MAINTENANCE
      });

      this.addExpense({
        propertyId: sampleProperty2.id,
        amount: 200,
        date: new Date('2023-03-10'),
        category: ExpenseCategory.PROPERTY_TAX,
        description: 'Quarterly property tax',
        vendor: 'City Tax Office',
        expenseType: ExpenseType.LANDLORD_PROPERTY_TAX
      });
    }
  }
}

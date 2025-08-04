import { Injectable, signal, computed } from '@angular/core';
import { Invoice, InvoiceStatus, Property, Expense, ExpenseType, ReimbursementStatus } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly STORAGE_KEY = 'vibe_invoices';
  
  // Signal for invoices
  private invoicesSignal = signal<Invoice[]>(this.loadInvoices());
  
  // Public readonly signals
  readonly invoices = this.invoicesSignal.asReadonly();
  
  // Computed signals
  readonly pendingInvoices = computed(() => 
    this.invoices().filter(invoice => 
      invoice.status === InvoiceStatus.SENT || 
      invoice.status === InvoiceStatus.VIEWED ||
      invoice.status === InvoiceStatus.OVERDUE
    )
  );
  
  readonly overdueInvoices = computed(() => 
    this.invoices().filter(invoice => {
      const now = new Date();
      return invoice.status !== InvoiceStatus.PAID && 
             invoice.status !== InvoiceStatus.CANCELLED &&
             new Date(invoice.dueDate) < now;
    })
  );
  
  readonly totalOutstanding = computed(() => 
    this.pendingInvoices().reduce((sum, invoice) => sum + invoice.netAmount, 0)
  );

  constructor() {}

  private loadInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const invoices = JSON.parse(data);
        return invoices.map((invoice: any) => ({
          ...invoice,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.dueDate),
          rentPeriodStart: new Date(invoice.rentPeriodStart),
          rentPeriodEnd: new Date(invoice.rentPeriodEnd),
          paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
          chargeableExpenses: invoice.chargeableExpenses?.map((exp: any) => ({
            ...exp,
            date: new Date(exp.date)
          })) || [],
          deductibleExpenses: invoice.deductibleExpenses?.map((exp: any) => ({
            ...exp,
            date: new Date(exp.date)
          })) || []
        }));
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
    return [];
  }

  private saveInvoices(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.invoicesSignal()));
    } catch (error) {
      console.error('Error saving invoices:', error);
    }
  }

  generateInvoice(
    property: Property, 
    rentPeriodStart: Date, 
    rentPeriodEnd: Date,
    chargeableExpenses: Expense[] = [],
    deductibleExpenses: Expense[] = []
  ): Invoice {
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

    const totalChargeableExpenses = chargeableExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalDeductibleExpenses = deductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const grossAmount = property.monthlyRent + totalChargeableExpenses;
    const netAmount = grossAmount - totalDeductibleExpenses;

    const invoice: Invoice = {
      id: this.generateId(),
      propertyId: property.id,
      tenantName: property.tenantName || 'Tenant',
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate,
      dueDate,
      monthlyRent: property.monthlyRent,
      rentPeriodStart,
      rentPeriodEnd,
      chargeableExpenses: [...chargeableExpenses],
      totalChargeableExpenses,
      deductibleExpenses: [...deductibleExpenses],
      totalDeductibleExpenses,
      grossAmount,
      deductions: totalDeductibleExpenses,
      netAmount,
      status: InvoiceStatus.DRAFT
    };

    return invoice;
  }

  saveInvoice(invoice: Invoice): void {
    const invoices = [...this.invoicesSignal()];
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice };
    } else {
      invoices.push({ ...invoice });
    }
    
    this.invoicesSignal.set(invoices);
    this.saveInvoices();
  }

  getInvoicesByProperty(propertyId: string): Invoice[] {
    return this.invoices().filter(invoice => invoice.propertyId === propertyId);
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(invoice => invoice.id === id);
  }

  updateInvoiceStatus(invoiceId: string, status: InvoiceStatus, paidDate?: Date): void {
    const invoices = [...this.invoicesSignal()];
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
      invoice.status = status;
      if (status === InvoiceStatus.PAID && paidDate) {
        invoice.paidDate = paidDate;
      }
      
      this.invoicesSignal.set(invoices);
      this.saveInvoices();
    }
  }

  deleteInvoice(invoiceId: string): void {
    const invoices = this.invoicesSignal().filter(invoice => invoice.id !== invoiceId);
    this.invoicesSignal.set(invoices);
    this.saveInvoices();
  }

  getChargeableExpenses(propertyId: string, startDate: Date, endDate: Date): Expense[] {
    // This would typically get expenses from the ExpenseService
    // For now, returning empty array - will integrate with ExpenseService
    return [];
  }

  getDeductibleExpenses(propertyId: string, startDate: Date, endDate: Date): Expense[] {
    // This would typically get expenses from the ExpenseService
    // For now, returning empty array - will integrate with ExpenseService  
    return [];
  }

  markExpensesAsInvoiced(expenseIds: string[], invoiceId: string): void {
    // This would update expenses to mark them as invoiced
    // Will integrate with ExpenseService
  }

  private generateId(): string {
    return 'inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const invoiceCount = this.invoices().length + 1;
    return `INV-${year}${month}-${invoiceCount.toString().padStart(4, '0')}`;
  }

  // Sample data loader
  loadSampleInvoices(): void {
    const sampleInvoices: Invoice[] = [
      {
        id: 'inv_sample1',
        propertyId: 'prop_sample1',
        tenantName: 'John Smith',
        invoiceNumber: 'INV-202501-0001',
        invoiceDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-31'),
        monthlyRent: 2500,
        rentPeriodStart: new Date('2025-01-01'),
        rentPeriodEnd: new Date('2025-01-31'),
        chargeableExpenses: [],
        totalChargeableExpenses: 0,
        deductibleExpenses: [],
        totalDeductibleExpenses: 0,
        grossAmount: 2500,
        deductions: 0,
        netAmount: 2500,
        status: InvoiceStatus.PAID,
        paidDate: new Date('2025-01-15')
      },
      {
        id: 'inv_sample2',
        propertyId: 'prop_sample2',
        tenantName: 'Sarah Johnson',
        invoiceNumber: 'INV-202502-0002',
        invoiceDate: new Date('2025-02-01'),
        dueDate: new Date('2025-03-03'),
        monthlyRent: 1800,
        rentPeriodStart: new Date('2025-02-01'),
        rentPeriodEnd: new Date('2025-02-28'),
        chargeableExpenses: [],
        totalChargeableExpenses: 150,
        deductibleExpenses: [],
        totalDeductibleExpenses: 0,
        grossAmount: 1950,
        deductions: 0,
        netAmount: 1950,
        status: InvoiceStatus.SENT
      }
    ];

    this.invoicesSignal.set(sampleInvoices);
    this.saveInvoices();
  }
}

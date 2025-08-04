export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  purchasePrice: number;
  monthlyRent: number;
  dateAcquired: Date;
  isActive: boolean;
  description?: string;
  tenantName?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  // Map coordinates
  latitude?: number;
  longitude?: number;
}

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  STUDIO = 'studio',
  OTHER = 'other'
}

export interface Revenue {
  id: string;
  propertyId: string;
  amount: number;
  date: Date;
  type: RevenueType;
  description?: string;
  payer?: string;
  paymentMethod?: string;
  referenceNumber?: string;
}

export enum RevenueType {
  RENT = 'rent',
  LATE_FEE = 'late_fee',
  SECURITY_DEPOSIT = 'security_deposit',
  PET_FEE = 'pet_fee',
  OTHER = 'other'
}

export interface Expense {
  id: string;
  propertyId: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  description: string;
  vendor?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
  isRecurring?: boolean;
  // Invoice-related fields
  expenseType: ExpenseType;
  chargedToTenant?: boolean;
  paidByTenant?: boolean;
  invoiceId?: string;
  reimbursementStatus?: ReimbursementStatus;
}

export enum ExpenseType {
  // Standard landlord expenses
  LANDLORD_MAINTENANCE = 'landlord_maintenance',
  LANDLORD_REPAIRS = 'landlord_repairs',
  LANDLORD_INSURANCE = 'landlord_insurance',
  LANDLORD_PROPERTY_TAX = 'landlord_property_tax',
  LANDLORD_UTILITIES = 'landlord_utilities',
  LANDLORD_MANAGEMENT = 'landlord_management',
  
  // Expenses to be charged to tenant
  CHARGEABLE_TO_TENANT = 'chargeable_to_tenant',
  TENANT_DAMAGES = 'tenant_damages',
  TENANT_UTILITIES = 'tenant_utilities',
  TENANT_LATE_FEES = 'tenant_late_fees',
  
  // Expenses paid by tenant (to be deducted from rent)
  TENANT_PAID_MAINTENANCE = 'tenant_paid_maintenance',
  TENANT_PAID_REPAIRS = 'tenant_paid_repairs',
  TENANT_PAID_UTILITIES = 'tenant_paid_utilities',
  
  OTHER = 'other'
}

export enum ReimbursementStatus {
  PENDING = 'pending',
  CHARGED = 'charged',
  PAID = 'paid',
  DEDUCTED = 'deducted',
  DISPUTED = 'disputed'
}

export enum ExpenseCategory {
  MAINTENANCE = 'maintenance',
  REPAIRS = 'repairs',
  INSURANCE = 'insurance',
  PROPERTY_TAX = 'property_tax',
  UTILITIES = 'utilities',
  PROPERTY_MANAGEMENT = 'property_management',
  MARKETING = 'marketing',
  LEGAL_FEES = 'legal_fees',
  MORTGAGE = 'mortgage',
  OTHER = 'other'
}

export interface PropertyFinancials {
  property: Property;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  monthlyNetIncome: number;
  occupancyRate: number;
  roi: number; // Return on Investment percentage
}

export interface Invoice {
  id: string;
  propertyId: string;
  tenantName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  
  // Rent information
  monthlyRent: number;
  rentPeriodStart: Date;
  rentPeriodEnd: Date;
  
  // Expenses to charge tenant
  chargeableExpenses: Expense[];
  totalChargeableExpenses: number;
  
  // Expenses paid by tenant (to deduct)
  deductibleExpenses: Expense[];
  totalDeductibleExpenses: number;
  
  // Calculations
  grossAmount: number; // rent + chargeable expenses
  deductions: number; // tenant-paid expenses
  netAmount: number; // final amount due
  
  // Status
  status: InvoiceStatus;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

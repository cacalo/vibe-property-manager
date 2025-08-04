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

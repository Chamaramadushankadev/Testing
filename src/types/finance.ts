export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: Date;
  clientId?: string;
  projectId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  paymentTerms: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    nextIssueDate: Date;
  };
  paymentLinks: {
    stripe?: string;
    paypal?: string;
    wise?: string;
  };
  viewedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface FinanceClient {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  phone?: string;
  currency: string;
  taxId?: string;
  paymentTerms: number; // days
  isRecurring: boolean;
  totalRevenue: number;
  totalProfit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceProject {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  currency: string;
  totalRevenue: number;
  totalExpenses: number;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxSettings {
  id: string;
  region: string;
  taxType: 'self-employment' | 'vat' | 'gst' | 'income';
  rate: number;
  quarterlyDates: Date[];
  annualDeadline: Date;
  isActive: boolean;
}

export interface FinanceSettings {
  id: string;
  defaultCurrency: string;
  taxSettings: TaxSettings[];
  invoiceBranding: {
    logo?: string;
    primaryColor: string;
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    companyPhone?: string;
    footer?: string;
  };
  paymentMethods: {
    stripe?: {
      enabled: boolean;
      publicKey: string;
    };
    paypal?: {
      enabled: boolean;
      clientId: string;
    };
    wise?: {
      enabled: boolean;
      apiKey: string;
    };
  };
  notifications: {
    invoiceReminders: boolean;
    taxDeadlines: boolean;
    budgetAlerts: boolean;
    paymentReceived: boolean;
  };
}

export interface FinanceDashboard {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  upcomingInvoices: Invoice[];
  overdueInvoices: Invoice[];
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }[];
  topClients: {
    clientId: string;
    clientName: string;
    revenue: number;
    profit: number;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface TaxEstimate {
  period: 'quarterly' | 'annual';
  year: number;
  quarter?: number;
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  taxRate: number;
  dueDate: Date;
  breakdown: {
    taxType: string;
    amount: number;
    rate: number;
  }[];
}
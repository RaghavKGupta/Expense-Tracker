export type AssetCategory = 
  | 'Cash & Bank Accounts'
  | 'Investments'
  | 'Real Estate'
  | 'Vehicles'
  | 'Personal Property'
  | 'Retirement Accounts'
  | 'Other Assets';

export type LiabilityCategory = 
  | 'Credit Cards'
  | 'Student Loans'
  | 'Mortgage'
  | 'Auto Loans'
  | 'Personal Loans'
  | 'Other Debts';

export type SubscriptionFrequency = 
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  currentValue: number;
  purchasePrice?: number;
  purchaseDate?: string;
  description?: string;
  lastUpdated: string;
  isTracked: boolean; // Whether to track value changes over time
  valuationHistory: AssetValuation[];
}

export interface AssetValuation {
  date: string;
  value: number;
  note?: string;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  currentBalance: number;
  originalAmount?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string; // Day of month (1-31) or specific date
  startDate: string;
  maturityDate?: string; // For loans with fixed terms
  description?: string;
  lastUpdated: string;
  paymentHistory: LiabilityPayment[];
}

export interface LiabilityPayment {
  date: string;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  note?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  startDate: string;
  endDate?: string; // Optional end date
  category: string; // Maps to ExpenseCategory
  description?: string;
  isActive: boolean;
  lastBilled?: string;
  nextBilling: string;
  autoGenerate: boolean; // Whether to automatically create expenses
  createdAt: string;
  billingHistory: SubscriptionBilling[];
}

export interface SubscriptionBilling {
  date: string;
  amount: number;
  expenseId?: string; // Link to generated expense
  status: 'pending' | 'billed' | 'failed';
}

export interface NetWorthSnapshot {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetBreakdown: Record<AssetCategory, number>;
  liabilityBreakdown: Record<LiabilityCategory, number>;
  monthlyChange?: {
    assets: number;
    liabilities: number;
    netWorth: number;
    percentage: number;
  };
}

export interface LoanPayoffProjection {
  liabilityId: string;
  monthsRemaining: number;
  totalInterestRemaining: number;
  payoffDate: string;
  monthlyBreakdown: {
    month: string;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }[];
  extraPaymentScenarios: {
    extraAmount: number;
    monthsSaved: number;
    interestSaved: number;
  }[];
}

export interface FinancialSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome?: number;
  monthlyExpenses: number;
  monthlySubscriptions: number;
  cashFlow: number;
  debtToIncomeRatio?: number;
  emergencyFundMonths?: number;
  upcomingBills: {
    subscription: Subscription;
    dueDate: string;
    amount: number;
  }[];
  loanPayoffs: LoanPayoffProjection[];
}
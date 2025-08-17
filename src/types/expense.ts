export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory | string;
  description: string;
  date: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export type ExpenseCategory = 
  | 'Food'
  | 'Groceries'
  | 'Dining Out'
  | 'Transportation'
  | 'Gas/Fuel'
  | 'Public Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Clothing'
  | 'Electronics'
  | 'Bills'
  | 'Rent/Mortgage'
  | 'Utilities'
  | 'Internet/Phone'
  | 'Insurance'
  | 'Healthcare'
  | 'Education'
  | 'Travel'
  | 'Fitness/Sports'
  | 'Personal Care'
  | 'Gifts'
  | 'Charity'
  | 'Business'
  | 'Other';

export interface CustomCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export type IncomeCategory = 
  | 'Salary'
  | 'Freelance'
  | 'Investment'
  | 'Rental'
  | 'Business'
  | 'Gift'
  | 'Bonus'
  | 'Other';

export interface Income {
  id: string;
  amount: number;
  category: IncomeCategory | string;
  description: string;
  date: string; // ISO date string
  isRecurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface IncomeFormData {
  amount: string;
  category: IncomeCategory;
  description: string;
  date: string;
  isRecurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface ExpenseFilters {
  category?: ExpenseCategory | 'All';
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface ExpenseSummary {
  totalSpending: number;
  monthlySpending: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  topCategory: {
    category: ExpenseCategory;
    amount: number;
  };
  averageDailySpending: number;
  expenseCount: number;
  totalIncome?: number;
  monthlyIncome?: number;
  netCashFlow?: number;
  incomeBreakdown?: Record<IncomeCategory, number>;
  incomeCount?: number;
}

export interface ExpenseFormData {
  amount: string;
  category: ExpenseCategory;
  description: string;
  date: string;
}
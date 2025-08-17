import { ExpenseCategory } from './expense';

export interface Budget {
  id: string;
  category: ExpenseCategory | 'Total';
  limit: number;
  period: 'monthly' | 'weekly' | 'daily';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus {
  category: ExpenseCategory | 'Total';
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean; // 80% of limit
}
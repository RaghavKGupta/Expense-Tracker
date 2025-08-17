import { ExpenseCategory, IncomeCategory } from './expense';

export interface MonthlyData {
  month: string; // YYYY-MM format
  monthName: string; // "January 2024"
  total: number; // Total expenses
  totalIncome: number; // Total income
  netCashFlow: number; // Income - Expenses
  categoryBreakdown: Record<ExpenseCategory, number>;
  incomeBreakdown: Record<IncomeCategory, number>;
  expenseCount: number;
  incomeCount: number;
  averagePerDay: number;
  topCategory: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  };
  topIncomeSource: {
    category: IncomeCategory;
    amount: number;
    percentage: number;
  };
  changeFromPrevious?: {
    amount: number;
    percentage: number;
    incomeChange: number;
    netFlowChange: number;
  };
}

export interface AnnualData {
  year: number;
  total: number; // Total expenses
  totalIncome: number; // Total income
  netCashFlow: number; // Income - Expenses
  monthlyData: MonthlyData[];
  categoryTotals: Record<ExpenseCategory, number>;
  incomeTotals: Record<IncomeCategory, number>;
  averageMonthly: number;
  averageMonthlyIncome: number;
  highestMonth: {
    month: string;
    amount: number;
  };
  lowestMonth: {
    month: string;
    amount: number;
  };
  bestIncomeMonth: {
    month: string;
    amount: number;
  };
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
    incomeDirection: 'increasing' | 'decreasing' | 'stable';
    incomePercentage: number;
  };
}

export interface SpendingPattern {
  id: string;
  type: 'recurring' | 'seasonal' | 'anomaly' | 'trend';
  category: ExpenseCategory;
  description: string;
  confidence: number; // 0-1
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  averageAmount: number;
  lastOccurrence: string;
  nextPredicted?: string;
}

export interface SpendingSuggestion {
  id: string;
  type: 'save_money' | 'budget_optimization' | 'category_warning' | 'goal_progress' | 'habit_change';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  potentialSavings?: number;
  actionRequired: string;
  category?: ExpenseCategory;
  priority: number; // 1-10
}

export interface SpendingGoal {
  id: string;
  title: string;
  type: 'save_amount' | 'reduce_category' | 'total_limit' | 'custom';
  targetAmount: number;
  currentAmount: number;
  category?: ExpenseCategory;
  deadline: string;
  createdAt: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  progress: number; // 0-100
}

export interface PredictiveAnalysis {
  nextMonthEstimate: number;
  confidence: number;
  factors: string[];
  yearEndProjection: number;
  categoryForecasts: Record<ExpenseCategory, number>;
  savingsOpportunities: {
    category: ExpenseCategory;
    currentMonthly: number;
    optimizedMonthly: number;
    potentialSavings: number;
  }[];
}
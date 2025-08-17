import { Budget, BudgetStatus } from '@/types/budget';
import { Expense, ExpenseCategory } from '@/types/expense';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const BUDGET_STORAGE_KEY = 'expense-tracker-budgets';

export const budgetStorage = {
  getBudgets: (): Budget[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(BUDGET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading budgets from localStorage:', error);
      return [];
    }
  },

  saveBudgets: (budgets: Budget[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error('Error saving budgets to localStorage:', error);
    }
  },

  addBudget: (budget: Budget): void => {
    const budgets = budgetStorage.getBudgets();
    const existingIndex = budgets.findIndex(b => b.category === budget.category && b.period === budget.period);
    
    if (existingIndex !== -1) {
      budgets[existingIndex] = budget;
    } else {
      budgets.push(budget);
    }
    
    budgetStorage.saveBudgets(budgets);
  },

  deleteBudget: (id: string): void => {
    const budgets = budgetStorage.getBudgets();
    const filteredBudgets = budgets.filter(budget => budget.id !== id);
    budgetStorage.saveBudgets(filteredBudgets);
  }
};

export function calculateBudgetStatus(
  expenses: Expense[], 
  budgets: Budget[]
): BudgetStatus[] {
  const now = new Date();
  
  return budgets.map(budget => {
    let periodStart: Date;
    let periodEnd: Date;
    
    switch (budget.period) {
      case 'monthly':
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
      case 'weekly':
        periodStart = startOfWeek(now);
        periodEnd = endOfWeek(now);
        break;
      case 'daily':
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
        break;
    }
    
    const relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInPeriod = isWithinInterval(expenseDate, { start: periodStart, end: periodEnd });
      
      if (budget.category === 'Total') {
        return isInPeriod;
      }
      
      return isInPeriod && expense.category === budget.category;
    });
    
    const spent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = Math.max(0, budget.limit - spent);
    const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    
    return {
      category: budget.category,
      limit: budget.limit,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget.limit,
      isNearLimit: percentage >= 80 && percentage < 100
    };
  });
}
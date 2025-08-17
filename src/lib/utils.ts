import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Expense, ExpenseSummary, ExpenseCategory, Income, IncomeCategory } from '@/types/expense';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { parseLocalDate } from './dateUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string): string {
  return format(parseLocalDate(date), 'MMM dd, yyyy');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function calculateExpenseSummary(expenses: Expense[], incomes: Income[] = []): ExpenseSummary {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = parseLocalDate(expense.date);
    return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
  });
  
  const monthlySpending = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryBreakdown = expenses.reduce((breakdown, expense) => {
    breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    return breakdown;
  }, {} as Record<ExpenseCategory, number>);

  const topCategory = Object.entries(categoryBreakdown).reduce(
    (top, [category, amount]) => 
      amount > top.amount 
        ? { category: category as ExpenseCategory, amount } 
        : top,
    { category: 'Other' as ExpenseCategory, amount: 0 }
  );

  const daysInMonth = now.getDate();
  const averageDailySpending = monthlySpending / daysInMonth;

  // Income calculations
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  
  const monthlyIncomes = incomes.filter(income => {
    const incomeDate = parseLocalDate(income.date);
    return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
  });
  
  const monthlyIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
  
  const incomeBreakdown = incomes.reduce((breakdown, income) => {
    breakdown[income.category as IncomeCategory] = (breakdown[income.category as IncomeCategory] || 0) + income.amount;
    return breakdown;
  }, {} as Record<IncomeCategory, number>);

  const netCashFlow = monthlyIncome - monthlySpending;

  return {
    totalSpending,
    monthlySpending,
    categoryBreakdown,
    topCategory,
    averageDailySpending,
    expenseCount: expenses.length,
    totalIncome,
    monthlyIncome,
    netCashFlow,
    incomeBreakdown,
    incomeCount: incomes.length
  };
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Category', 'Description', 'Amount'];
  const csvContent = [
    headers.join(','),
    ...expenses.map(expense => [
      expense.date,
      expense.category,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.amount.toString()
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
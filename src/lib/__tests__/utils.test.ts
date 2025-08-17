import { formatCurrency, calculateExpenseSummary } from '../utils';
import { Expense, Income } from '@/types/expense';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(1.1)).toBe('$1.10');
      expect(formatCurrency(1.999)).toBe('$2.00');
    });
  });

  describe('calculateExpenseSummary', () => {
    const mockExpenses: Expense[] = [
      {
        id: '1',
        amount: 100,
        category: 'Food',
        description: 'Groceries',
        date: new Date().toISOString().split('T')[0], // Today
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        amount: 50,
        category: 'Transportation',
        description: 'Gas',
        date: new Date().toISOString().split('T')[0], // Today
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        amount: 200,
        category: 'Food',
        description: 'Restaurant',
        date: '2023-01-01', // Old date
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    const mockIncomes: Income[] = [
      {
        id: '1',
        amount: 5000,
        category: 'Salary',
        description: 'Monthly salary',
        date: new Date().toISOString().split('T')[0], // Today
        isRecurring: true,
        frequency: 'monthly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        amount: 1000,
        category: 'Freelance',
        description: 'Project payment',
        date: '2023-01-01', // Old date
        isRecurring: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    ];

    it('should calculate basic expense summary without income', () => {
      const summary = calculateExpenseSummary(mockExpenses);

      expect(summary.totalSpending).toBe(350);
      expect(summary.monthlySpending).toBe(150); // Only current month expenses
      expect(summary.expenseCount).toBe(3);
      expect(summary.categoryBreakdown.Food).toBe(300);
      expect(summary.categoryBreakdown.Transportation).toBe(50);
      expect(summary.topCategory.category).toBe('Food');
      expect(summary.topCategory.amount).toBe(300);
    });

    it('should calculate summary with income data', () => {
      const summary = calculateExpenseSummary(mockExpenses, mockIncomes);

      expect(summary.totalSpending).toBe(350);
      expect(summary.monthlySpending).toBe(150);
      expect(summary.totalIncome).toBe(6000);
      expect(summary.monthlyIncome).toBe(5000); // Only current month income
      expect(summary.netCashFlow).toBe(4850); // 5000 - 150
      expect(summary.incomeCount).toBe(2);
      expect(summary.incomeBreakdown?.Salary).toBe(5000);
      expect(summary.incomeBreakdown?.Freelance).toBe(1000);
    });

    it('should handle empty arrays', () => {
      const summary = calculateExpenseSummary([], []);

      expect(summary.totalSpending).toBe(0);
      expect(summary.monthlySpending).toBe(0);
      expect(summary.expenseCount).toBe(0);
      expect(summary.totalIncome).toBe(0);
      expect(summary.monthlyIncome).toBe(0);
      expect(summary.netCashFlow).toBe(0);
      expect(summary.incomeCount).toBe(0);
    });

    it('should calculate average daily spending correctly', () => {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const summary = calculateExpenseSummary(mockExpenses);

      expect(summary.averageDailySpending).toBe(150 / dayOfMonth);
    });

    it('should handle expenses without income', () => {
      const summary = calculateExpenseSummary(mockExpenses);

      expect(summary.totalIncome).toBeUndefined();
      expect(summary.monthlyIncome).toBeUndefined();
      expect(summary.netCashFlow).toBeUndefined();
      expect(summary.incomeBreakdown).toBeUndefined();
      expect(summary.incomeCount).toBeUndefined();
    });

    it('should handle different expense categories', () => {
      const diverseExpenses: Expense[] = [
        {
          id: '1',
          amount: 100,
          category: 'Bills',
          description: 'Electricity',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          amount: 150,
          category: 'Entertainment',
          description: 'Movies',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const summary = calculateExpenseSummary(diverseExpenses);

      expect(summary.categoryBreakdown.Bills).toBe(100);
      expect(summary.categoryBreakdown.Entertainment).toBe(150);
      expect(summary.topCategory.category).toBe('Entertainment');
      expect(summary.topCategory.amount).toBe(150);
    });
  });
});
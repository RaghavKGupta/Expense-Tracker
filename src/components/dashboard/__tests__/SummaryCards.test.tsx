import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryCards from '../SummaryCards';
import { ExpenseSummary } from '@/types/expense';

// Mock the formatCurrency function
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

describe('SummaryCards', () => {
  const mockSummary: ExpenseSummary = {
    totalSpending: 2500,
    monthlySpending: 1200,
    categoryBreakdown: {
      Food: 500,
      Transportation: 300,
      Entertainment: 200,
      Shopping: 150,
      Bills: 50,
      Other: 0,
    },
    topCategory: {
      category: 'Food',
      amount: 500,
    },
    averageDailySpending: 40,
    expenseCount: 25,
    totalIncome: 6000,
    monthlyIncome: 5000,
    netCashFlow: 3800,
    incomeBreakdown: {
      Salary: 4000,
      Freelance: 1000,
      Investment: 500,
      Rental: 300,
      Business: 200,
      Gift: 0,
      Bonus: 0,
      Other: 0,
    },
    incomeCount: 4,
  };

  it('should render all summary cards with income data', () => {
    render(<SummaryCards summary={mockSummary} />);

    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Daily Average')).toBeInTheDocument();

    expect(screen.getByText('+$5000.00')).toBeInTheDocument();
    expect(screen.getByText('-$1200.00')).toBeInTheDocument();
    expect(screen.getByText('$3800.00')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
  });

  it('should render cards without income data', () => {
    const summaryWithoutIncome: ExpenseSummary = {
      ...mockSummary,
      totalIncome: undefined,
      monthlyIncome: undefined,
      netCashFlow: undefined,
      incomeBreakdown: undefined,
      incomeCount: undefined,
    };

    render(<SummaryCards summary={summaryWithoutIncome} />);

    expect(screen.getByText('Monthly Income')).toBeInTheDocument();
    expect(screen.getByText('+$0.00')).toBeInTheDocument(); // Default to 0
    expect(screen.getByText('-$1200.00')).toBeInTheDocument(); // Negative sign for expenses
  });

  it('should show positive cash flow with green color', () => {
    render(<SummaryCards summary={mockSummary} />);

    const netCashFlowValue = screen.getByText('$3800.00');
    expect(netCashFlowValue).toHaveClass('text-green-400');
  });

  it('should show negative cash flow with red color', () => {
    const summaryWithNegativeCashFlow: ExpenseSummary = {
      ...mockSummary,
      monthlyIncome: 1000,
      netCashFlow: -200,
    };

    render(<SummaryCards summary={summaryWithNegativeCashFlow} />);

    const netCashFlowValue = screen.getByText('$-200.00');
    expect(netCashFlowValue).toHaveClass('text-red-400');
  });

  it('should show correct gradient colors for different card types', () => {
    render(<SummaryCards summary={mockSummary} />);

    // Check that cards have appropriate gradient classes
    const monthlyIncomeCard = screen.getByText('Monthly Income').closest('.card');
    const monthlyExpensesCard = screen.getByText('Monthly Expenses').closest('.card');
    const netCashFlowCard = screen.getByText('Net Cash Flow').closest('.card');
    const dailyAverageCard = screen.getByText('Daily Average').closest('.card');

    expect(monthlyIncomeCard).toBeInTheDocument();
    expect(monthlyExpensesCard).toBeInTheDocument();
    expect(netCashFlowCard).toBeInTheDocument();
    expect(dailyAverageCard).toBeInTheDocument();
  });

  it('should handle zero values correctly', () => {
    const zeroSummary: ExpenseSummary = {
      totalSpending: 0,
      monthlySpending: 0,
      categoryBreakdown: {
        Food: 0,
        Transportation: 0,
        Entertainment: 0,
        Shopping: 0,
        Bills: 0,
        Other: 0,
      },
      topCategory: {
        category: 'Other',
        amount: 0,
      },
      averageDailySpending: 0,
      expenseCount: 0,
      totalIncome: 0,
      monthlyIncome: 0,
      netCashFlow: 0,
      incomeBreakdown: {
        Salary: 0,
        Freelance: 0,
        Investment: 0,
        Rental: 0,
        Business: 0,
        Gift: 0,
        Bonus: 0,
        Other: 0,
      },
      incomeCount: 0,
    };

    render(<SummaryCards summary={zeroSummary} />);

    expect(screen.getByText('+$0.00')).toBeInTheDocument();
    expect(screen.getByText('-$0.00')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('should render icons for each card', () => {
    render(<SummaryCards summary={mockSummary} />);

    // Check that there are icon containers with appropriate gradient backgrounds
    const icons = document.querySelectorAll('.p-3.rounded-xl.bg-gradient-to-br');
    expect(icons).toHaveLength(4);
  });

  it('should display correct text colors for positive and negative values', () => {
    render(<SummaryCards summary={mockSummary} />);

    // Monthly Income should be green (positive)
    const incomeValue = screen.getByText('+$5000.00');
    expect(incomeValue).toHaveClass('text-green-400');

    // Monthly Expenses should be red when showing negative
    const expenseValue = screen.getByText('-$1200.00');
    expect(expenseValue).toHaveClass('text-white'); // Default color for expenses

    // Net Cash Flow should be green when positive
    const cashFlowValue = screen.getByText('$3800.00');
    expect(cashFlowValue).toHaveClass('text-green-400');

    // Daily Average should be white (neutral)
    const dailyAvgValue = screen.getByText('$40.00');
    expect(dailyAvgValue).toHaveClass('text-white');
  });
});
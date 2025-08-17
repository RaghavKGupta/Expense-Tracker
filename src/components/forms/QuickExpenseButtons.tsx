'use client';

import { ExpenseCategory } from '@/types/expense';
import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';
import { formatCurrency } from '@/lib/utils';

interface QuickExpense {
  description: string;
  amount: number;
  category: ExpenseCategory;
}

interface QuickExpenseButtonsProps {
  onQuickExpense: (expense: QuickExpense) => void;
}

const quickExpenses: QuickExpense[] = [
  { description: 'Coffee', amount: 5, category: 'Food' },
  { description: 'Lunch', amount: 15, category: 'Food' },
  { description: 'Gas', amount: 40, category: 'Transportation' },
  { description: 'Movie', amount: 12, category: 'Entertainment' },
  { description: 'Groceries', amount: 80, category: 'Food' },
  { description: 'Uber', amount: 25, category: 'Transportation' },
];

export default function QuickExpenseButtons({ onQuickExpense }: QuickExpenseButtonsProps) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Add</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {quickExpenses.map((expense, index) => {
          const Icon = getCategoryIcon(expense.category);
          const colors = getCategoryColor(expense.category);
          
          return (
            <button
              key={index}
              onClick={() => onQuickExpense(expense)}
              className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${colors.light} hover:border-opacity-50`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{expense.description}</span>
                <span className="text-xs opacity-80">{formatCurrency(expense.amount)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
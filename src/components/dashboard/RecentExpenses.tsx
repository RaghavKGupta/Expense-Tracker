import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCategoryColor, getCategoryIcon } from '@/lib/categoryIcons';
import { Clock } from 'lucide-react';

interface RecentExpensesProps {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: RecentExpensesProps) {
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);


  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-white">Recent Expenses</h3>
      </div>
      
      {recentExpenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentExpenses.map((expense) => {
            const Icon = getCategoryIcon(expense.category);
            const colors = getCategoryColor(expense.category);
            
            return (
              <div
                key={expense.id}
                className="flex items-center gap-4 p-4 bg-slate-700 bg-opacity-30 rounded-lg hover:bg-slate-700 hover:bg-opacity-50 transition-colors duration-200"
              >
                <div className={`p-2 rounded-lg ${colors.bg} bg-opacity-20`}>
                  <Icon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {expense.category}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {formatDate(expense.date)}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-sm font-semibold text-white">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
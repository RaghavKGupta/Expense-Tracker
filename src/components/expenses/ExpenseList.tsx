'use client';

import { useState, useMemo } from 'react';
import { Expense, ExpenseFilters } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit2, Trash2, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExpenseFiltersComponent from './ExpenseFilters';
import { exportToCSV } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  bulkMode?: boolean;
  selectedExpenses?: Set<string>;
  onSelectExpense?: (id: string) => void;
}

export default function ExpenseList({ 
  expenses, 
  onEdit, 
  onDelete, 
  bulkMode = false,
  selectedExpenses = new Set(),
  onSelectExpense 
}: ExpenseListProps) {
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (filters.category && filters.category !== 'All' && expense.category !== filters.category) {
        return false;
      }

      if (filters.searchTerm && !expense.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      if (filters.startDate && expense.date < filters.startDate) {
        return false;
      }

      if (filters.endDate && expense.date > filters.endDate) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filters]);

  const handleExport = () => {
    exportToCSV(filteredExpenses);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Food: 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30',
      Transportation: 'bg-blue-500 bg-opacity-20 text-blue-400 border border-blue-500 border-opacity-30',
      Entertainment: 'bg-purple-500 bg-opacity-20 text-purple-400 border border-purple-500 border-opacity-30',
      Shopping: 'bg-pink-500 bg-opacity-20 text-pink-400 border border-pink-500 border-opacity-30',
      Bills: 'bg-orange-500 bg-opacity-20 text-orange-400 border border-orange-500 border-opacity-30',
      Other: 'bg-slate-500 bg-opacity-20 text-slate-400 border border-slate-500 border-opacity-30',
    };
    return colors[category as keyof typeof colors] || colors.Other;
  };

  return (
    <div className="space-y-6">
      <ExpenseFiltersComponent filters={filters} onFiltersChange={setFilters} />
      
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">
            Expenses ({filteredExpenses.length})
          </h2>
          {filteredExpenses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400">No expenses found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/30">
                <tr>
                  {bulkMode && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Select
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Amount
                  </th>
                  {!bulkMode && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className={`hover:bg-slate-700 hover:bg-opacity-30 transition-colors duration-200 ${
                    selectedExpenses.has(expense.id) ? 'bg-blue-900 bg-opacity-30' : ''
                  }`}>
                    {bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.has(expense.id)}
                          onChange={() => onSelectExpense?.(expense.id)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      <div className="max-w-xs truncate" title={expense.description}>
                        {expense.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {formatCurrency(expense.amount)}
                    </td>
                    {!bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(expense)}
                            className="p-1 h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500 hover:bg-opacity-10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(expense.id)}
                            className="p-1 h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500 hover:bg-opacity-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
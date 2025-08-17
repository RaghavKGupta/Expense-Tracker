'use client';

import { useEffect, useState } from 'react';
import { Expense } from '@/types/expense';
import { csvStorage } from '@/lib/csvStorage';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseForm from '@/components/forms/ExpenseForm';
import Button from '@/components/ui/Button';
import { Receipt, X, Edit, Trash2, Calendar, Tag, List } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/utils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'month' | 'category'>('list');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const loadedExpenses = csvStorage.getExpenses();
    setExpenses(loadedExpenses);
    setIsLoading(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      csvStorage.deleteExpense(id);
      loadExpenses();
    }
  };

  const handleEditSuccess = () => {
    setEditingExpense(null);
    loadExpenses();
  };

  const handleEditCancel = () => {
    setEditingExpense(null);
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedExpenses.size} expense(s)?`)) {
      selectedExpenses.forEach(expenseId => {
        csvStorage.deleteExpense(expenseId);
      });
      setSelectedExpenses(new Set());
      setBulkMode(false);
      loadExpenses();
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(exp => exp.id)));
    }
  };

  // Group expenses by month
  const groupByMonth = (expenses: Expense[]) => {
    const groups = expenses.reduce((acc, expense) => {
      const monthKey = format(parseLocalDate(expense.date), 'yyyy-MM');
      const monthName = format(parseLocalDate(expense.date), 'MMMM yyyy');
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthName,
          expenses: [],
          total: 0
        };
      }
      
      acc[monthKey].expenses.push(expense);
      acc[monthKey].total += expense.amount;
      return acc;
    }, {} as Record<string, { monthName: string; expenses: Expense[]; total: number }>);

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, group]) => ({ key, ...group }));
  };

  // Group expenses by category
  const groupByCategory = (expenses: Expense[]) => {
    const groups = expenses.reduce((acc, expense) => {
      const category = expense.category;
      
      if (!acc[category]) {
        acc[category] = {
          categoryName: category,
          expenses: [],
          total: 0
        };
      }
      
      acc[category].expenses.push(expense);
      acc[category].total += expense.amount;
      return acc;
    }, {} as Record<string, { categoryName: string; expenses: Expense[]; total: number }>);

    return Object.entries(groups)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([key, group]) => ({ key, ...group }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-slate-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                All Expenses
              </h1>
              <p className="text-slate-400 text-lg">
                View, filter, and manage your expense records
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!bulkMode ? (
              <Button
                onClick={() => setBulkMode(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Bulk Delete
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {selectedExpenses.size === expenses.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="danger"
                  disabled={selectedExpenses.size === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete ({selectedExpenses.size})
                </Button>
                <Button
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedExpenses(new Set());
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* View Mode Controls */}
        <div className="flex items-center gap-4 mt-6 p-4 bg-slate-800 bg-opacity-50 rounded-lg">
          <span className="text-sm font-medium text-slate-300">View by:</span>
          <div className="flex space-x-1 bg-slate-700 p-1 rounded-lg">
            {[
              { key: 'list', label: 'List', icon: List },
              { key: 'month', label: 'Month', icon: Calendar },
              { key: 'category', label: 'Category', icon: Tag }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as 'list' | 'month' | 'category')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Edit Expense</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditCancel}
                  className="p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <ExpenseForm
                expense={editingExpense}
                onSuccess={handleEditSuccess}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Render based on view mode */}
      {viewMode === 'list' && (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          bulkMode={bulkMode}
          selectedExpenses={selectedExpenses}
          onSelectExpense={handleSelectExpense}
        />
      )}

      {viewMode === 'month' && (
        <div className="space-y-6">
          {groupByMonth(expenses).map((group) => (
            <div key={group.key} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{group.monthName}</h3>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{formatCurrency(group.total)}</p>
                  <p className="text-sm text-slate-400">{group.expenses.length} expenses</p>
                </div>
              </div>
              <ExpenseList
                expenses={group.expenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                bulkMode={bulkMode}
                selectedExpenses={selectedExpenses}
                onSelectExpense={handleSelectExpense}
              />
            </div>
          ))}
        </div>
      )}

      {viewMode === 'category' && (
        <div className="space-y-6">
          {groupByCategory(expenses).map((group) => (
            <div key={group.key} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{group.categoryName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{formatCurrency(group.total)}</p>
                  <p className="text-sm text-slate-400">{group.expenses.length} expenses</p>
                </div>
              </div>
              <ExpenseList
                expenses={group.expenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                bulkMode={bulkMode}
                selectedExpenses={selectedExpenses}
                onSelectExpense={handleSelectExpense}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
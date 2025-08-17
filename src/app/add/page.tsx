'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import QuickExpenseButtons from '@/components/forms/QuickExpenseButtons';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function AddExpensePage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    router.push('/expenses');
  };

  const handleQuickExpense = (quickExpense: any) => {
    const now = new Date().toISOString();
    const expense = {
      id: generateId(),
      amount: quickExpense.amount,
      category: quickExpense.category,
      description: quickExpense.description,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: now,
      updatedAt: now,
    };
    
    storage.addExpense(expense);
    router.push('/expenses');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Add New Expense
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          Record a new expense to track your spending
        </p>
      </div>

      <div className="space-y-6">
        <QuickExpenseButtons onQuickExpense={handleQuickExpense} />
        
        <div className="card p-8 shadow-xl">
          <ExpenseForm key={refreshKey} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
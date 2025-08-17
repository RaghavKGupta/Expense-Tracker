'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Expense, Income } from '@/types/expense';
import { csvStorage } from '@/lib/csvStorage';
import { db } from '@/lib/supabase/database';
import { calculateExpenseSummary } from '@/lib/utils';
import SummaryCards from '@/components/dashboard/SummaryCards';
import CategoryChart from '@/components/dashboard/CategoryChart';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import BudgetOverview from '@/components/dashboard/BudgetOverview';
import SpendingInsights from '@/components/dashboard/SpendingInsights';
import IncomeVsExpensesChart from '@/components/dashboard/IncomeVsExpensesChart';
import FinancialHealthScore from '@/components/dashboard/FinancialHealthScore';
import SpendingVelocity from '@/components/dashboard/SpendingVelocity';
import SmartBudgetAlerts from '@/components/dashboard/SmartBudgetAlerts';
import FutureProjections from '@/components/dashboard/FutureProjections';
import CashInHand from '@/components/dashboard/CashInHand';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Button from '@/components/ui/Button';
import DataImporter from '@/components/utils/DataImporter';
import DataMigration from '@/components/migration/DataMigration';
import { Plus, Receipt, BarChart3, DollarSign } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useKeyboardShortcuts();

  const loadData = async () => {
    try {
      // Try to load from database first
      const [loadedExpenses, loadedIncomes] = await Promise.all([
        db.getExpenses(),
        db.getIncomes()
      ]);
      setExpenses(loadedExpenses);
      setIncomes(loadedIncomes);
    } catch (error) {
      console.error('Error loading from database, falling back to CSV:', error);
      // Fallback to CSV storage
      const loadedExpenses = csvStorage.getExpenses();
      const loadedIncomes = csvStorage.getIncome();
      setExpenses(loadedExpenses);
      setIncomes(loadedIncomes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add effect to reload data when component mounts or when storage might have changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      loadData();
    };

    // Listen for custom events that indicate data changes
    window.addEventListener('expenseAdded', handleStorageChange);
    window.addEventListener('expenseUpdated', handleStorageChange);
    window.addEventListener('expenseDeleted', handleStorageChange);
    window.addEventListener('incomeAdded', handleStorageChange);
    window.addEventListener('incomeUpdated', handleStorageChange);
    window.addEventListener('incomeDeleted', handleStorageChange);
    
    return () => {
      window.removeEventListener('expenseAdded', handleStorageChange);
      window.removeEventListener('expenseUpdated', handleStorageChange);
      window.removeEventListener('expenseDeleted', handleStorageChange);
      window.removeEventListener('incomeAdded', handleStorageChange);
      window.removeEventListener('incomeUpdated', handleStorageChange);
      window.removeEventListener('incomeDeleted', handleStorageChange);
    };
  }, []);

  const summary = calculateExpenseSummary(expenses, incomes);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold gradient-text">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Track your spending and manage your expenses
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/add')}
              className="flex items-center gap-2"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Expense
            </Button>
            <Button
              onClick={() => router.push('/income')}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <DollarSign className="h-5 w-5" />
              Add Income
            </Button>
            <Button
              onClick={() => router.push('/expenses')}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <Receipt className="h-5 w-5" />
              View All
            </Button>
            <Button
              onClick={() => router.push('/analytics')}
              variant="outline"
              className="flex items-center gap-2"
              size="lg"
            >
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="slide-up">
          <SummaryCards summary={summary} />
        </div>

        {/* Quick Actions Section */}
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/add')}
                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Add Expense</span>
              </button>
              <button
                onClick={() => router.push('/income')}
                className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/25"
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Add Income</span>
              </button>
              <button
                onClick={() => router.push('/expenses')}
                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                <Receipt className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">View Expenses</span>
              </button>
              <button
                onClick={() => router.push('/analytics')}
                className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/25"
              >
                <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Show data migration component */}
        <div className="slide-up" style={{ animationDelay: '0.15s' }}>
          <DataMigration />
        </div>

        {/* Show data importer if no expenses exist */}
        {expenses.length === 0 && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <DataImporter />
          </div>
        )}
        
        {/* Smart Insights Section - Only show if we have data */}
        {expenses.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="slide-in-left">
                <FinancialHealthScore expenses={expenses} incomes={incomes} />
              </div>
              <div className="slide-in-right">
                <SmartBudgetAlerts expenses={expenses} incomes={incomes} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="slide-in-left">
                <SpendingVelocity expenses={expenses} />
              </div>
              <div className="slide-in-right">
                <FutureProjections expenses={expenses} incomes={incomes} />
              </div>
            </div>
          </>
        )}
        
        <div className="grid grid-cols-1 gap-8">
          <div className="slide-in-left">
            <IncomeVsExpensesChart summary={summary} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 scale-in">
            <CategoryChart summary={summary} />
          </div>
          <div className="space-y-6">
            <div className="scale-in" style={{ animationDelay: '0.2s' }}>
              <CashInHand expenses={expenses} incomes={incomes} />
            </div>
            <div className="scale-in" style={{ animationDelay: '0.25s' }}>
              <BudgetOverview expenses={expenses} />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bounce-in">
            <RecentExpenses expenses={expenses} />
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <SpendingInsights expenses={expenses} />
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button
          onClick={() => router.push('/add')}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-110"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

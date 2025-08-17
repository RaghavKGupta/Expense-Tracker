'use client';

import { useState, useEffect } from 'react';
import { Budget, BudgetStatus } from '@/types/budget';
import { Expense } from '@/types/expense';
import { budgetStorage, calculateBudgetStatus } from '@/lib/budget';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Plus, Target } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BudgetOverviewProps {
  expenses: Expense[];
}

export default function BudgetOverview({ expenses }: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [showAddBudget, setShowAddBudget] = useState(false);

  useEffect(() => {
    const loadedBudgets = budgetStorage.getBudgets();
    setBudgets(loadedBudgets);
    
    if (loadedBudgets.length > 0) {
      const statuses = calculateBudgetStatus(expenses, loadedBudgets);
      setBudgetStatuses(statuses);
    }
  }, [expenses]);

  const overBudgetCount = budgetStatuses.filter(status => status.isOverBudget).length;
  const nearLimitCount = budgetStatuses.filter(status => status.isNearLimit).length;

  if (budgets.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-white">Budget Tracking</h3>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddBudget(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Set Budget
          </Button>
        </div>
        <div className="text-center py-6">
          <p className="text-slate-400 mb-2">No budgets set</p>
          <p className="text-sm text-slate-500">Set budgets to track your spending limits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Budget Status</h3>
        </div>
        <div className="flex items-center gap-2">
          {(overBudgetCount > 0 || nearLimitCount > 0) && (
            <div className="flex items-center gap-1 text-sm">
              {overBudgetCount > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {overBudgetCount}
                </span>
              )}
              {nearLimitCount > 0 && (
                <span className="flex items-center gap-1 text-orange-400">
                  <TrendingUp className="h-3 w-3" />
                  {nearLimitCount}
                </span>
              )}
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddBudget(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {budgetStatuses.map((status) => (
          <div
            key={`${status.category}-budget`}
            className="relative"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-300">
                {status.category} Budget
              </span>
              <span className="text-sm text-slate-400">
                {formatCurrency(status.spent)} / {formatCurrency(status.limit)}
              </span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  status.isOverBudget
                    ? 'bg-red-500'
                    : status.isNearLimit
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(100, status.percentage)}%`,
                }}
              />
              {status.isOverBudget && (
                <div
                  className="h-2 bg-red-500 bg-opacity-30 rounded-full -mt-2"
                  style={{
                    width: `${status.percentage}%`,
                  }}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500">
                {status.remaining > 0 
                  ? `${formatCurrency(status.remaining)} left`
                  : `${formatCurrency(Math.abs(status.remaining))} over`}
              </span>
              <span className={`text-xs font-medium ${
                status.isOverBudget
                  ? 'text-red-400'
                  : status.isNearLimit
                  ? 'text-orange-400'
                  : 'text-green-400'
              }`}>
                {Math.round(status.percentage)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
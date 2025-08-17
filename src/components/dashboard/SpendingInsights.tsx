'use client';

import { useMemo } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { subDays, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';

interface SpendingInsightsProps {
  expenses: Expense[];
}

interface Insight {
  type: 'trend' | 'warning' | 'achievement' | 'tip';
  icon: React.ElementType;
  title: string;
  description: string;
  value?: string;
  color: string;
}

export default function SpendingInsights({ expenses }: SpendingInsightsProps) {
  const insights = useMemo(() => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const last7Days = subDays(now, 7);
    const last14Days = subDays(now, 14);
    const last30Days = subDays(now, 30);

    // Recent expenses (last 7 days)
    const recentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { 
        start: startOfDay(last7Days), 
        end: endOfDay(now) 
      });
    });

    // Previous week expenses (8-14 days ago)
    const previousWeekExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { 
        start: startOfDay(last14Days), 
        end: endOfDay(last7Days) 
      });
    });

    const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousTotal = previousWeekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const insights: Insight[] = [];

    // Spending trend
    if (previousTotal > 0) {
      const change = ((recentTotal - previousTotal) / previousTotal) * 100;
      if (Math.abs(change) > 5) {
        insights.push({
          type: change > 0 ? 'warning' : 'achievement',
          icon: change > 0 ? TrendingUp : TrendingDown,
          title: `Spending ${change > 0 ? 'increased' : 'decreased'}`,
          description: `${Math.abs(change).toFixed(1)}% compared to last week`,
          value: formatCurrency(recentTotal),
          color: change > 0 ? 'text-red-400' : 'text-green-400'
        });
      }
    }

    // Most expensive day
    const dailyTotals = expenses.reduce((acc, expense) => {
      const day = expense.date;
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const [maxDay, maxAmount] = Object.entries(dailyTotals)
      .reduce((max, [day, amount]) => amount > max[1] ? [day, amount] : max, ['', 0]);

    if (maxAmount > 0) {
      insights.push({
        type: 'tip',
        icon: Calendar,
        title: 'Highest spending day',
        description: `${format(new Date(maxDay), 'MMM dd')} - ${formatCurrency(maxAmount)}`,
        color: 'text-orange-400'
      });
    }

    // Frequent categories
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .reduce((max, [cat, amount]) => amount > max[1] ? [cat, amount] : max, ['', 0]);

    if (topCategory[1] > 0) {
      const percentage = ((topCategory[1] / recentTotal) * 100).toFixed(0);
      insights.push({
        type: 'trend',
        icon: Target,
        title: `${topCategory[0]} dominates`,
        description: `${percentage}% of your recent spending`,
        value: formatCurrency(topCategory[1]),
        color: 'text-blue-400'
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  }, [expenses]);

  if (insights.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Spending Insights</h3>
        <div className="text-center py-6">
          <p className="text-slate-400">Add more expenses to see insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Spending Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${insight.color} bg-opacity-20`}>
                <Icon className={`h-4 w-4 ${insight.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {insight.title}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {insight.description}
                </p>
                {insight.value && (
                  <p className={`text-sm font-semibold mt-1 ${insight.color}`}>
                    {insight.value}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
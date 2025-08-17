'use client';

import { useMemo } from 'react';
import { Expense, Income } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingUp, Target, Zap, CheckCircle, Bell } from 'lucide-react';

interface SmartBudgetAlertsProps {
  expenses: Expense[];
  incomes: Income[];
}

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  icon: React.ElementType;
  title: string;
  message: string;
  action?: string;
  priority: number;
  amount?: number;
}

export default function SmartBudgetAlerts({ expenses, incomes }: SmartBudgetAlertsProps) {
  const alerts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDate = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDate;
    
    // Current month data
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const currentMonthIncomes = incomes.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
    });
    
    // Previous month data for comparison
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
    });
    
    const lastMonthIncomes = incomes.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === lastMonth && incDate.getFullYear() === lastMonthYear;
    });
    
    const currentSpending = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const lastMonthSpending = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate daily burn rate
    const dailyBurnRate = currentSpending / currentDate;
    const projectedMonthlySpending = dailyBurnRate * daysInMonth;
    
    // Category analysis
    const categorySpending = currentMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const lastMonthCategorySpending = lastMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const alerts: Alert[] = [];
    
    // 1. Spending velocity alert
    if (projectedMonthlySpending > lastMonthSpending * 1.2) {
      alerts.push({
        id: 'spending-velocity',
        type: 'warning',
        icon: TrendingUp,
        title: 'High Spending Velocity',
        message: `At current rate, you'll spend ${formatCurrency(projectedMonthlySpending)} this month (${((projectedMonthlySpending - lastMonthSpending) / lastMonthSpending * 100).toFixed(0)}% more than last month)`,
        action: 'Review daily expenses and find areas to cut back',
        priority: 9,
        amount: projectedMonthlySpending - lastMonthSpending
      });
    }
    
    // 2. Cash flow alert
    if (currentIncome > 0 && (currentSpending / currentIncome) > 0.8) {
      alerts.push({
        id: 'cash-flow',
        type: 'danger',
        icon: AlertTriangle,
        title: 'High Expense Ratio',
        message: `You've spent ${((currentSpending / currentIncome) * 100).toFixed(0)}% of your monthly income`,
        action: 'Consider reducing non-essential expenses',
        priority: 10,
        amount: currentSpending
      });
    }
    
    // 3. Category spike alerts
    Object.entries(categorySpending).forEach(([category, amount]) => {
      const lastMonthAmount = lastMonthCategorySpending[category] || 0;
      if (lastMonthAmount > 0 && amount > lastMonthAmount * 1.5) {
        alerts.push({
          id: `category-spike-${category}`,
          type: 'warning',
          icon: Target,
          title: `${category} Spending Spike`,
          message: `${formatCurrency(amount)} spent on ${category} (${((amount - lastMonthAmount) / lastMonthAmount * 100).toFixed(0)}% increase)`,
          action: `Review ${category.toLowerCase()} expenses for unnecessary items`,
          priority: 7,
          amount: amount - lastMonthAmount
        });
      }
    });
    
    // 4. End of month projection
    if (daysRemaining <= 7 && projectedMonthlySpending > currentIncome * 1.1) {
      alerts.push({
        id: 'month-end-warning',
        type: 'danger',
        icon: Bell,
        title: 'Month-End Budget Risk',
        message: `${daysRemaining} days left, projected to overspend by ${formatCurrency(projectedMonthlySpending - currentIncome)}`,
        action: 'Limit spending for the rest of the month',
        priority: 10,
        amount: projectedMonthlySpending - currentIncome
      });
    }
    
    // 5. Positive alerts
    if (currentIncome > 0 && (currentSpending / currentIncome) < 0.7 && currentDate > 15) {
      alerts.push({
        id: 'good-control',
        type: 'success',
        icon: CheckCircle,
        title: 'Great Spending Control',
        message: `You've only spent ${((currentSpending / currentIncome) * 100).toFixed(0)}% of your income this month`,
        action: 'Consider increasing savings or investments',
        priority: 3,
        amount: currentIncome - currentSpending
      });
    }
    
    // 6. Savings opportunity
    if (lastMonthSpending > 0 && currentSpending < lastMonthSpending * 0.8) {
      alerts.push({
        id: 'savings-opportunity',
        type: 'success',
        icon: Target,
        title: 'Savings Opportunity',
        message: `You're spending ${formatCurrency(lastMonthSpending - currentSpending)} less than last month`,
        action: 'Transfer the difference to savings',
        priority: 5,
        amount: lastMonthSpending - currentSpending
      });
    }
    
    // 7. Large expense alert
    const largeExpenses = currentMonthExpenses.filter(exp => exp.amount > (currentIncome * 0.1));
    if (largeExpenses.length > 0) {
      const totalLarge = largeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      alerts.push({
        id: 'large-expenses',
        type: 'info',
        icon: Zap,
        title: 'Large Expenses Detected',
        message: `${largeExpenses.length} expenses over ${formatCurrency(currentIncome * 0.1)} totaling ${formatCurrency(totalLarge)}`,
        action: 'Review if these were planned purchases',
        priority: 6,
        amount: totalLarge
      });
    }
    
    return alerts.sort((a, b) => b.priority - a.priority).slice(0, 4);
  }, [expenses, incomes]);
  
  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger': return 'border-red-500 bg-red-500 bg-opacity-10 text-red-400';
      case 'warning': return 'border-orange-500 bg-orange-500 bg-opacity-10 text-orange-400';
      case 'success': return 'border-green-500 bg-green-500 bg-opacity-10 text-green-400';
      default: return 'border-blue-500 bg-blue-500 bg-opacity-10 text-blue-400';
    }
  };
  
  const getIconColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger': return 'text-red-400';
      case 'warning': return 'text-orange-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };
  
  if (alerts.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Smart Budget Alerts</h3>
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-medium">All Good!</p>
          <p className="text-slate-400 text-sm">No budget alerts at this time</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Smart Budget Alerts</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">{alerts.length} alerts</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${getIconColor(alert.type)} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white text-sm">{alert.title}</h4>
                    {alert.amount && (
                      <span className={`text-xs font-semibold ${getIconColor(alert.type)}`}>
                        {alert.type === 'success' ? '+' : ''}{formatCurrency(Math.abs(alert.amount))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                  {alert.action && (
                    <p className="text-xs text-slate-400 italic">{alert.action}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
'use client';

import { useMemo } from 'react';
import { Expense, Income } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Shield, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface FinancialHealthScoreProps {
  expenses: Expense[];
  incomes: Income[];
}

interface HealthMetric {
  name: string;
  score: number;
  weight: number;
  icon: React.ElementType;
  description: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function FinancialHealthScore({ expenses, incomes }: FinancialHealthScoreProps) {
  const healthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month data
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const currentMonthIncomes = incomes.filter(inc => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
    });
    
    const monthlyExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyIncome = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    
    // Calculate metrics
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const expenseToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    
    // Income stability (recurring vs one-time)
    const recurringIncome = currentMonthIncomes.filter(inc => inc.isRecurring).reduce((sum, inc) => sum + inc.amount, 0);
    const incomeStability = monthlyIncome > 0 ? (recurringIncome / monthlyIncome) * 100 : 0;
    
    // Expense diversity (avoid over-concentration in one category)
    const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCategorySpending = Math.max(...Object.values(categoryTotals), 0);
    const expenseDiversity = monthlyExpenses > 0 ? 100 - ((maxCategorySpending / monthlyExpenses) * 100) : 100;
    
    // Calculate health metrics
    const metrics: HealthMetric[] = [
      {
        name: 'Savings Rate',
        score: Math.min(100, Math.max(0, savingsRate * 5)), // Scale to 0-100
        weight: 0.3,
        icon: Target,
        description: `${savingsRate.toFixed(1)}% of income saved`,
        status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate >= 5 ? 'fair' : 'poor'
      },
      {
        name: 'Spending Control',
        score: Math.max(0, 100 - expenseToIncomeRatio),
        weight: 0.25,
        icon: Shield,
        description: `${expenseToIncomeRatio.toFixed(1)}% of income spent`,
        status: expenseToIncomeRatio <= 70 ? 'excellent' : expenseToIncomeRatio <= 85 ? 'good' : expenseToIncomeRatio <= 95 ? 'fair' : 'poor'
      },
      {
        name: 'Income Stability',
        score: incomeStability,
        weight: 0.25,
        icon: CheckCircle,
        description: `${incomeStability.toFixed(1)}% recurring income`,
        status: incomeStability >= 80 ? 'excellent' : incomeStability >= 60 ? 'good' : incomeStability >= 40 ? 'fair' : 'poor'
      },
      {
        name: 'Expense Balance',
        score: expenseDiversity,
        weight: 0.2,
        icon: TrendingUp,
        description: 'Diversified spending across categories',
        status: expenseDiversity >= 70 ? 'excellent' : expenseDiversity >= 60 ? 'good' : expenseDiversity >= 50 ? 'fair' : 'poor'
      }
    ];
    
    // Calculate overall score
    const overallScore = metrics.reduce((sum, metric) => sum + (metric.score * metric.weight), 0);
    
    return {
      overallScore,
      metrics,
      monthlyIncome,
      monthlyExpenses,
      savings: monthlyIncome - monthlyExpenses
    };
  }, [expenses, incomes]);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-yellow-400" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Financial Health Score</h3>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(healthData.overallScore)}`}>
            {Math.round(healthData.overallScore)}
          </div>
          <div className="text-sm text-slate-400">
            {getScoreLabel(healthData.overallScore)}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              healthData.overallScore >= 80 ? 'bg-green-500' :
              healthData.overallScore >= 60 ? 'bg-yellow-500' :
              healthData.overallScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthData.overallScore}%` }}
          />
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <div className="text-xs text-slate-400">Income</div>
          <div className="text-sm font-semibold text-green-400">
            {formatCurrency(healthData.monthlyIncome)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Expenses</div>
          <div className="text-sm font-semibold text-red-400">
            {formatCurrency(healthData.monthlyExpenses)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Savings</div>
          <div className={`text-sm font-semibold ${healthData.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(healthData.savings)}
          </div>
        </div>
      </div>
      
      {/* Detailed Metrics */}
      <div className="space-y-3">
        {healthData.metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Icon className="h-4 w-4 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{metric.name}</span>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div className="text-xs text-slate-500">{metric.description}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${getScoreColor(metric.score)}`}>
                {Math.round(metric.score)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
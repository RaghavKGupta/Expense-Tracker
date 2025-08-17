'use client';

import { useMemo } from 'react';
import { Expense, Income } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Calendar, DollarSign, Target } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, addMonths } from 'date-fns';

interface CashInHandProps {
  expenses: Expense[];
  incomes: Income[];
}

export default function CashInHand({ expenses, incomes }: CashInHandProps) {
  const cashData = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const lastMonth = subMonths(currentMonth, 1);
    const nextMonth = addMonths(currentMonth, 1);
    
    // Calculate current month data
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { 
        start: startOfMonth(currentMonth), 
        end: endOfMonth(currentMonth) 
      });
    });
    
    const currentMonthIncomes = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return isWithinInterval(incomeDate, { 
        start: startOfMonth(currentMonth), 
        end: endOfMonth(currentMonth) 
      });
    });
    
    // Calculate last month data
    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { 
        start: startOfMonth(lastMonth), 
        end: endOfMonth(lastMonth) 
      });
    });
    
    const lastMonthIncomes = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return isWithinInterval(incomeDate, { 
        start: startOfMonth(lastMonth), 
        end: endOfMonth(lastMonth) 
      });
    });
    
    // Calculate totals
    const currentMonthExpenseTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentMonthIncomeTotal = currentMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const lastMonthExpenseTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthIncomeTotal = lastMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    
    // Calculate net cash flow
    const currentNetFlow = currentMonthIncomeTotal - currentMonthExpenseTotal;
    const lastNetFlow = lastMonthIncomeTotal - lastMonthExpenseTotal;
    
    // Calculate cumulative cash (simplified calculation)
    // This would ideally come from a starting balance + all historical flows
    const cumulativeCash = incomes.reduce((sum, inc) => sum + inc.amount, 0) - 
                          expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate daily burn rate and runway
    const currentDate = now.getDate();
    const daysIntoMonth = currentDate;
    const dailyBurnRate = currentMonthExpenseTotal / daysIntoMonth;
    const daysRemainingInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - currentDate;
    const projectedEndOfMonthCash = cumulativeCash - (dailyBurnRate * daysRemainingInMonth);
    
    // Calculate runway (how long money will last at current burn rate)
    const runway = dailyBurnRate > 0 ? Math.floor(cumulativeCash / dailyBurnRate) : Infinity;
    
    // Analyze cash flow trend
    const flowChange = lastNetFlow !== 0 ? ((currentNetFlow - lastNetFlow) / Math.abs(lastNetFlow)) * 100 : 0;
    
    return {
      currentCash: cumulativeCash,
      currentNetFlow,
      lastNetFlow,
      flowChange,
      dailyBurnRate,
      projectedEndOfMonthCash,
      runway,
      currentMonthIncome: currentMonthIncomeTotal,
      currentMonthExpenses: currentMonthExpenseTotal,
      isPositive: cumulativeCash > 0,
      isFlowPositive: currentNetFlow > 0
    };
  }, [expenses, incomes]);
  
  const getFlowColor = (flow: number) => {
    if (flow > 0) return 'text-green-400';
    if (flow < 0) return 'text-red-400';
    return 'text-slate-400';
  };
  
  const getFlowIcon = (flow: number) => {
    if (flow > 0) return TrendingUp;
    if (flow < 0) return TrendingDown;
    return DollarSign;
  };
  
  const FlowIcon = getFlowIcon(cashData.flowChange);
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${cashData.isPositive ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'}`}>
            <Wallet className={`h-6 w-6 ${cashData.isPositive ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Cash in Hand</h3>
            <p className="text-sm text-slate-400">Current available balance</p>
          </div>
        </div>
      </div>
      
      {/* Main Cash Balance */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${getFlowColor(cashData.currentCash)}`}>
          {formatCurrency(cashData.currentCash)}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm">
          <FlowIcon className={`h-4 w-4 ${getFlowColor(cashData.flowChange)}`} />
          <span className={getFlowColor(cashData.flowChange)}>
            {cashData.flowChange > 0 ? '+' : ''}{cashData.flowChange.toFixed(1)}% from last month
          </span>
        </div>
      </div>
      
      {/* Cash Flow Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">This Month Flow</div>
          <div className={`text-lg font-semibold ${getFlowColor(cashData.currentNetFlow)}`}>
            {formatCurrency(cashData.currentNetFlow)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-1">Daily Burn Rate</div>
          <div className="text-lg font-semibold text-orange-400">
            {formatCurrency(cashData.dailyBurnRate)}
          </div>
        </div>
      </div>
      
      {/* Income vs Expenses This Month */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Income</span>
          </div>
          <span className="text-sm font-semibold text-green-400">
            {formatCurrency(cashData.currentMonthIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-slate-300">Expenses</span>
          </div>
          <span className="text-sm font-semibold text-red-400">
            {formatCurrency(cashData.currentMonthExpenses)}
          </span>
        </div>
        
        {/* Progress bar showing expense vs income ratio */}
        <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (cashData.currentMonthExpenses / Math.max(cashData.currentMonthIncome, 1)) * 100)}%` 
            }}
          />
        </div>
      </div>
      
      {/* Insights */}
      <div className="space-y-3">
        {/* Runway */}
        <div className="flex items-start gap-3 p-3 bg-slate-800 bg-opacity-50 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">
              <strong>Runway:</strong> {' '}
              {cashData.runway === Infinity 
                ? 'Infinite (positive cash flow)' 
                : cashData.runway > 365 
                ? `${Math.floor(cashData.runway / 365)} years` 
                : `${cashData.runway} days`
              } at current spending rate
            </p>
          </div>
        </div>
        
        {/* End of month projection */}
        <div className="flex items-start gap-3 p-3 bg-slate-800 bg-opacity-50 rounded-lg">
          <Target className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">
              <strong>Month-end projection:</strong> {formatCurrency(cashData.projectedEndOfMonthCash)}
              {cashData.projectedEndOfMonthCash < 0 && (
                <span className="text-red-400"> (⚠️ Potential deficit)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Cash flow status */}
        {cashData.currentNetFlow < 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
            <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-300">
                <strong>Negative cash flow:</strong> Consider reducing expenses or increasing income
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
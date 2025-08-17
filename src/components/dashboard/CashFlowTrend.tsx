'use client';

import { Expense, Income } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { parseLocalDate } from '@/lib/dateUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface CashFlowTrendProps {
  expenses: Expense[];
  incomes: Income[];
}

export default function CashFlowTrend({ expenses, incomes }: CashFlowTrendProps) {
  const getMonthlyData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseLocalDate(expense.date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      });
      
      const monthIncomes = incomes.filter(income => {
        const incomeDate = parseLocalDate(income.date);
        return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
      });
      
      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = monthIncomes.reduce((sum, income) => sum + income.amount, 0);
      
      data.push({
        month: format(monthDate, 'MMM'),
        income: totalIncome,
        expenses: totalExpenses,
        netFlow: totalIncome - totalExpenses
      });
    }
    
    return data;
  };

  const data = getMonthlyData();

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center mb-1">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-semibold ml-2" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">6-Month Cash Flow Trend</h3>
        <p className="text-slate-400 text-sm">Track your financial patterns over time</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="netFlow" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Net Flow"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Avg Income</p>
          <p className="text-sm font-semibold text-green-400">
            {formatCurrency(data.reduce((sum, d) => sum + d.income, 0) / data.length)}
          </p>
        </div>
        <div>
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Avg Expenses</p>
          <p className="text-sm font-semibold text-red-400">
            {formatCurrency(data.reduce((sum, d) => sum + d.expenses, 0) / data.length)}
          </p>
        </div>
        <div>
          <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Avg Net Flow</p>
          <p className="text-sm font-semibold text-blue-400">
            {formatCurrency(data.reduce((sum, d) => sum + d.netFlow, 0) / data.length)}
          </p>
        </div>
      </div>
    </div>
  );
}
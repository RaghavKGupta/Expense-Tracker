'use client';

import { ExpenseSummary } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface IncomeVsExpensesChartProps {
  summary: ExpenseSummary;
}

export default function IncomeVsExpensesChart({ summary }: IncomeVsExpensesChartProps) {
  const data = [
    {
      name: 'Income',
      amount: summary.monthlyIncome || 0,
      color: '#10b981'
    },
    {
      name: 'Expenses',
      amount: summary.monthlySpending,
      color: '#ef4444'
    },
    {
      name: 'Net Flow',
      amount: summary.netCashFlow || -summary.monthlySpending,
      color: (summary.netCashFlow || -summary.monthlySpending) >= 0 ? '#3b82f6' : '#f59e0b'
    }
  ];

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 font-medium">{label}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            {value >= 0 ? '+' : ''}{formatCurrency(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Income vs Expenses</h3>
        <p className="text-slate-400 text-sm">Monthly comparison of your financial flow</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={customTooltip} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={80}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }}></div>
            <p className="text-xs text-slate-400 mb-1">{item.name}</p>
            <p className="text-sm font-semibold text-white">
              {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
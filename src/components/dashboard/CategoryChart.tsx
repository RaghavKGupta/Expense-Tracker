'use client';

import { ExpenseSummary } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CategoryChartProps {
  summary: ExpenseSummary;
}

const COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#6B7280',
  '#EF4444', '#F97316', '#84CC16', '#06B6D4', '#8B5CF6', '#EC4899'
];

const getCategoryColor = (index: number) => COLORS[index % COLORS.length];

export default function CategoryChart({ summary }: CategoryChartProps) {
  const data = Object.entries(summary.categoryBreakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount], index) => ({
      name: category.length > 15 ? category.substring(0, 12) + '...' : category,
      fullName: category,
      value: amount,
      color: getCategoryColor(index),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">No expenses to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Spending by Category</h3>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chart */}
        <div className="flex-1 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name, props) => [
                  formatCurrency(value), 
                  props.payload?.fullName || name
                ]}
                labelStyle={{ color: '#e2e8f0' }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="lg:w-48 space-y-2">
          {data.slice(0, 6).map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300 truncate" title={entry.fullName}>
                  {entry.name}
                </span>
              </div>
              <span className="text-white font-medium flex-shrink-0 ml-2">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          {data.length > 6 && (
            <div className="text-xs text-slate-400 mt-2">
              +{data.length - 6} more categories
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
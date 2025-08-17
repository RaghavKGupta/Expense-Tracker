'use client';

import { useMemo } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Zap, Calendar } from 'lucide-react';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, isWithinInterval } from 'date-fns';

interface SpendingVelocityProps {
  expenses: Expense[];
}

interface VelocityData {
  date: string;
  daily: number;
  cumulative: number;
  weeklyAverage: number;
}

export default function SpendingVelocity({ expenses }: SpendingVelocityProps) {
  const velocityData = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, 29); // Last 30 days
    
    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: now });
    
    const velocityPoints: VelocityData[] = [];
    let cumulative = 0;
    
    days.forEach((day, index) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      // Daily expenses
      const dailyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, { start: dayStart, end: dayEnd });
      });
      
      const dailyTotal = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      cumulative += dailyTotal;
      
      // Calculate weekly average (last 7 days including current day)
      const weekStart = Math.max(0, index - 6);
      const weekData = velocityPoints.slice(weekStart);
      const weeklyTotal = weekData.reduce((sum, point) => sum + point.daily, 0) + dailyTotal;
      const weeklyAverage = weeklyTotal / (weekData.length + 1);
      
      velocityPoints.push({
        date: format(day, 'MMM dd'),
        daily: dailyTotal,
        cumulative,
        weeklyAverage
      });
    });
    
    // Calculate insights
    const last7Days = velocityPoints.slice(-7);
    const previous7Days = velocityPoints.slice(-14, -7);
    
    const recentAverage = last7Days.reduce((sum, point) => sum + point.daily, 0) / 7;
    const previousAverage = previous7Days.reduce((sum, point) => sum + point.daily, 0) / 7;
    const velocityChange = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0;
    
    // Predict when current month budget might be exhausted
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= currentMonthStart;
    }).reduce((sum, exp) => sum + exp.amount, 0);
    
    const daysIntoMonth = now.getDate();
    const avgDailySpending = monthlyExpenses / daysIntoMonth;
    const projectedMonthlySpending = avgDailySpending * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    return {
      data: velocityPoints.slice(-14), // Show last 2 weeks
      recentAverage,
      velocityChange,
      projectedMonthlySpending,
      highestDay: velocityPoints.reduce((max, point) => point.daily > max.daily ? point : max, velocityPoints[0]),
      totalSpent: cumulative
    };
  }, [expenses]);
  
  const getVelocityStatus = (change: number) => {
    if (change > 15) return { color: 'text-red-400', icon: TrendingUp, label: 'Accelerating' };
    if (change > 5) return { color: 'text-orange-400', icon: TrendingUp, label: 'Increasing' };
    if (change < -15) return { color: 'text-green-400', icon: TrendingDown, label: 'Slowing' };
    if (change < -5) return { color: 'text-green-400', icon: TrendingDown, label: 'Decreasing' };
    return { color: 'text-blue-400', icon: Zap, label: 'Steady' };
  };
  
  const status = getVelocityStatus(velocityData.velocityChange);
  const StatusIcon = status.icon;
  
  if (velocityData.data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Spending Velocity</h3>
        <div className="text-center py-6">
          <p className="text-slate-400">No recent expenses to analyze</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Spending Velocity</h3>
        <div className={`flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xs text-slate-400">Daily Average</div>
          <div className="text-sm font-semibold text-white">
            {formatCurrency(velocityData.recentAverage)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Change</div>
          <div className={`text-sm font-semibold ${status.color}`}>
            {velocityData.velocityChange > 0 ? '+' : ''}{velocityData.velocityChange.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Highest Day</div>
          <div className="text-sm font-semibold text-orange-400">
            {formatCurrency(velocityData.highestDay?.daily || 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Month Proj.</div>
          <div className="text-sm font-semibold text-purple-400">
            {formatCurrency(velocityData.projectedMonthlySpending)}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={velocityData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'daily' ? 'Daily Spending' : 'Weekly Average'
              ]}
            />
            <Line
              type="monotone"
              dataKey="daily"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="weeklyAverage"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insight */}
      <div className="flex items-start gap-3 p-3 bg-slate-800 bg-opacity-50 rounded-lg">
        <Calendar className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300">
            {velocityData.velocityChange > 10 
              ? `Your spending is accelerating. At this rate, you'll spend ${formatCurrency(velocityData.projectedMonthlySpending)} this month.`
              : velocityData.velocityChange < -10
              ? `Great job slowing down spending! You're on track for ${formatCurrency(velocityData.projectedMonthlySpending)} this month.`
              : `Your spending velocity is steady at ${formatCurrency(velocityData.recentAverage)} per day.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
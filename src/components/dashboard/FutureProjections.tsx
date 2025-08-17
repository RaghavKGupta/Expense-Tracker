'use client';

import { useMemo } from 'react';
import { Expense, Income } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Calendar, Target, Sparkles } from 'lucide-react';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface FutureProjectionsProps {
  expenses: Expense[];
  incomes: Income[];
}

interface ProjectionData {
  month: string;
  historical: number;
  projected: number;
  income: number;
  savings: number;
  isProjected: boolean;
}

export default function FutureProjections({ expenses, incomes }: FutureProjectionsProps) {
  const projectionData = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    
    // Generate last 6 months + next 6 months
    const months = [];
    for (let i = -6; i <= 6; i++) {
      months.push(addMonths(currentMonth, i));
    }
    
    const data: ProjectionData[] = [];
    let trendFactors: number[] = [];
    
    months.forEach((month, index) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const isProjected = month > currentMonth;
      
      if (!isProjected) {
        // Historical data
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
        });
        
        const monthIncomes = incomes.filter(income => {
          const incomeDate = new Date(income.date);
          return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
        });
        
        const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
        
        data.push({
          month: format(month, 'MMM yyyy'),
          historical: totalExpenses,
          projected: 0,
          income: totalIncome,
          savings: totalIncome - totalExpenses,
          isProjected: false
        });
        
        // Store trend factors for projection
        if (data.length >= 2) {
          const prevExpenses = data[data.length - 2].historical;
          if (prevExpenses > 0) {
            trendFactors.push(totalExpenses / prevExpenses);
          }
        }
      } else {
        // Projected data
        const lastHistoricalExpenses = data[data.length - 1]?.historical || 0;
        const lastHistoricalIncome = data[data.length - 1]?.income || 0;
        
        // Calculate trend-based projection
        const avgTrendFactor = trendFactors.length > 0 
          ? trendFactors.slice(-3).reduce((sum, factor) => sum + factor, 0) / Math.min(3, trendFactors.length)
          : 1;
        
        // Apply seasonal adjustment (spending typically higher in December, lower in January)
        const monthNumber = month.getMonth();
        let seasonalFactor = 1;
        if (monthNumber === 11) seasonalFactor = 1.15; // December
        else if (monthNumber === 0) seasonalFactor = 0.85; // January
        else if (monthNumber === 5 || monthNumber === 6) seasonalFactor = 1.1; // Summer months
        
        // Use historical average instead of recurring calculation to avoid double-counting
        // since the CSV already has all historical income entries
        const finalProjectedIncome = lastHistoricalIncome;
        
        const projectedExpenses = lastHistoricalExpenses * avgTrendFactor * seasonalFactor;
        
        data.push({
          month: format(month, 'MMM yyyy'),
          historical: 0,
          projected: projectedExpenses,
          income: finalProjectedIncome || lastHistoricalIncome,
          savings: (finalProjectedIncome || lastHistoricalIncome) - projectedExpenses,
          isProjected: true
        });
      }
    });
    
    // Calculate insights
    const historicalData = data.filter(d => !d.isProjected);
    const projectedData = data.filter(d => d.isProjected);
    
    const avgHistoricalExpenses = historicalData.reduce((sum, d) => sum + d.historical, 0) / historicalData.length;
    const avgProjectedExpenses = projectedData.reduce((sum, d) => sum + d.projected, 0) / projectedData.length;
    const projectedChange = avgHistoricalExpenses > 0 ? ((avgProjectedExpenses - avgHistoricalExpenses) / avgHistoricalExpenses) * 100 : 0;
    
    const totalProjectedSavings = projectedData.reduce((sum, d) => sum + Math.max(0, d.savings), 0);
    const totalProjectedDeficit = projectedData.reduce((sum, d) => sum + Math.min(0, d.savings), 0);
    
    return {
      data,
      avgHistoricalExpenses,
      avgProjectedExpenses,
      projectedChange,
      totalProjectedSavings,
      totalProjectedDeficit,
      nextMonthProjection: projectedData[0]
    };
  }, [expenses, incomes]);
  
  const getTrendColor = (change: number) => {
    if (change > 10) return 'text-red-400';
    if (change > 0) return 'text-orange-400';
    if (change < -10) return 'text-green-400';
    return 'text-blue-400';
  };
  
  const getTrendIcon = (change: number) => {
    if (Math.abs(change) < 5) return Calendar;
    return change > 0 ? TrendingUp : Target;
  };
  
  const TrendIcon = getTrendIcon(projectionData.projectedChange);
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Future Projections</h3>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-xs text-slate-400">AI Forecast</span>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xs text-slate-400">Next Month</div>
          <div className="text-sm font-semibold text-purple-400">
            {formatCurrency(projectionData.nextMonthProjection?.projected || 0)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Trend</div>
          <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${getTrendColor(projectionData.projectedChange)}`}>
            <TrendIcon className="h-3 w-3" />
            {projectionData.projectedChange > 0 ? '+' : ''}{projectionData.projectedChange.toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">6-Month Savings</div>
          <div className="text-sm font-semibold text-green-400">
            {formatCurrency(projectionData.totalProjectedSavings)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400">Risk</div>
          <div className="text-sm font-semibold text-red-400">
            {formatCurrency(Math.abs(projectionData.totalProjectedDeficit))}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${value/1000}k`}
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
                name === 'historical' ? 'Historical' : 
                name === 'projected' ? 'Projected' : 
                name === 'income' ? 'Income' : 'Savings'
              ]}
            />
            
            {/* Current month reference line */}
            <ReferenceLine 
              x={projectionData.data.find(d => !d.isProjected && d.historical > 0)?.month || ''} 
              stroke="#6B7280" 
              strokeDasharray="2 2" 
            />
            
            {/* Historical expenses */}
            <Area
              type="monotone"
              dataKey="historical"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.3}
            />
            
            {/* Projected expenses */}
            <Area
              type="monotone"
              dataKey="projected"
              stackId="1"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.3}
              strokeDasharray="5 5"
            />
            
            {/* Income line */}
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10B981"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Insights */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-slate-800 bg-opacity-50 rounded-lg">
          <TrendIcon className={`h-4 w-4 ${getTrendColor(projectionData.projectedChange)} mt-0.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300">
              {projectionData.projectedChange > 10 
                ? `Spending trend is increasing. Expected to spend ${((projectionData.projectedChange)).toFixed(0)}% more in coming months.`
                : projectionData.projectedChange < -10
                ? `Spending is trending down. You could save ${formatCurrency(Math.abs(projectionData.totalProjectedSavings))} over 6 months.`
                : `Spending is stable. Projected monthly average: ${formatCurrency(projectionData.avgProjectedExpenses)}.`
              }
            </p>
          </div>
        </div>
        
        {projectionData.totalProjectedDeficit < -500 && (
          <div className="flex items-start gap-3 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
            <Target className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-300">
                <strong>Budget Risk:</strong> Projected deficit of {formatCurrency(Math.abs(projectionData.totalProjectedDeficit))} over 6 months. Consider increasing income or reducing expenses.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
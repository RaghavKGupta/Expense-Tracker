'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Expense, Income } from '@/types/expense';
import { MonthlyData, AnnualData, SpendingPattern, SpendingSuggestion } from '@/types/analytics';
import { db } from '@/lib/supabase/database';
import { parseLocalDate } from '@/lib/dateUtils';
import { 
  generateMonthlyAnalytics, 
  generateAnnualAnalytics, 
  detectSpendingPatterns,
  generateSpendingSuggestions,
  generatePredictiveAnalysis
} from '@/lib/analytics';
import PremiumReports from '@/components/features/PremiumReports';
import BulkRecurringGenerator from '@/components/features/BulkRecurringGenerator';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Lightbulb,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function AnalyticsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [annualData, setAnnualData] = useState<AnnualData | null>(null);
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [suggestions, setSuggestions] = useState<SpendingSuggestion[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual' | 'insights' | 'reports'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [loadedExpenses, loadedIncomes] = await Promise.all([
        db.getExpenses(),
        db.getIncomes()
      ]);
      
      setExpenses(loadedExpenses);
      setIncomes(loadedIncomes);
      
      const monthly = generateMonthlyAnalytics(loadedExpenses, loadedIncomes, selectedYear);
      const annual = generateAnnualAnalytics(loadedExpenses, loadedIncomes, selectedYear);
      const detectedPatterns = detectSpendingPatterns(loadedExpenses);
      const generatedSuggestions = generateSpendingSuggestions(loadedExpenses, monthly, detectedPatterns);
      
      setMonthlyData(monthly);
      setAnnualData(annual);
      setPatterns(detectedPatterns);
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [selectedYear, loadData]);

  // Add effect to reload data when component mounts or when storage might have changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      loadData();
    };

    // Listen for custom events that indicate data changes
    window.addEventListener('expenseAdded', handleStorageChange);
    window.addEventListener('expenseUpdated', handleStorageChange);
    window.addEventListener('expenseDeleted', handleStorageChange);
    window.addEventListener('incomeAdded', handleStorageChange);
    window.addEventListener('incomeUpdated', handleStorageChange);
    window.addEventListener('incomeDeleted', handleStorageChange);
    
    return () => {
      window.removeEventListener('expenseAdded', handleStorageChange);
      window.removeEventListener('expenseUpdated', handleStorageChange);
      window.removeEventListener('expenseDeleted', handleStorageChange);
      window.removeEventListener('incomeAdded', handleStorageChange);
      window.removeEventListener('incomeUpdated', handleStorageChange);
      window.removeEventListener('incomeDeleted', handleStorageChange);
    };
  }, [loadData]);

  const availableYears = Array.from(
    new Set(expenses.map(exp => parseLocalDate(exp.date).getFullYear()))
  ).sort((a, b) => b - a);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg w-fit">
          {[
            { key: 'monthly', label: 'Monthly View', icon: Calendar },
            { key: 'annual', label: 'Annual Overview', icon: BarChart3 },
            { key: 'insights', label: 'Smart Insights', icon: Lightbulb },
            { key: 'reports', label: 'Premium Reports', icon: FileText }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key as 'monthly' | 'annual' | 'insights' | 'reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'monthly' && (
        <MonthlyView monthlyData={monthlyData} />
      )}
      
      {viewMode === 'annual' && annualData && (
        <AnnualView annualData={annualData} />
      )}
      
      {viewMode === 'insights' && (
        <InsightsView 
          patterns={patterns} 
          suggestions={suggestions}
          monthlyData={monthlyData}
          onDataReload={loadData}
        />
      )}
      
      {viewMode === 'reports' && (
        <ReportsView 
          expenses={expenses}
          monthlyData={monthlyData}
        />
      )}
    </div>
  );
}

function ReportsView({ 
  expenses, 
  monthlyData 
}: { 
  expenses: Expense[];
  monthlyData: MonthlyData[];
}) {
  const predictiveAnalysis = generatePredictiveAnalysis(expenses, monthlyData);
  
  return (
    <div className="space-y-8">
      {/* Predictive Analysis */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Predictive Analysis</h3>
            <p className="text-sm text-slate-400">AI-powered spending forecasts</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
            <h4 className="font-medium text-slate-300 mb-2">Next Month Estimate</h4>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(predictiveAnalysis.nextMonthEstimate)}
            </p>
            <p className="text-sm text-slate-400">
              {Math.round(predictiveAnalysis.confidence * 100)}% confidence
            </p>
          </div>
          
          <div className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
            <h4 className="font-medium text-slate-300 mb-2">Year-End Projection</h4>
            <p className="text-2xl font-bold text-white mb-1">
              {formatCurrency(predictiveAnalysis.yearEndProjection)}
            </p>
            <p className="text-sm text-slate-400">
              Based on current trends
            </p>
          </div>
          
          <div className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
            <h4 className="font-medium text-slate-300 mb-2">Key Factors</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              {predictiveAnalysis.factors.map((factor, index) => (
                <li key={index}>• {factor}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Category Forecasts */}
        <div className="mt-6">
          <h4 className="font-medium text-slate-300 mb-4">Category Forecasts (Next Month)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(predictiveAnalysis.categoryForecasts)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-slate-600 bg-opacity-30 rounded-lg">
                  <span className="text-sm font-medium text-slate-300">{category}</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
      
      {/* Premium Reports */}
      <PremiumReports expenses={expenses} monthlyData={monthlyData} />
    </div>
  );
}

function MonthlyView({ monthlyData }: { monthlyData: MonthlyData[] }) {
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'expenses'>('date');
  
  const sortedMonthlyData = useMemo(() => {
    const sorted = [...monthlyData];
    switch (sortBy) {
      case 'amount':
        return sorted.sort((a, b) => b.total - a.total);
      case 'expenses':
        return sorted.sort((a, b) => b.expenseCount - a.expenseCount);
      default:
        return sorted; // Keep original date order
    }
  }, [monthlyData, sortBy]);

  return (
    <div className="space-y-8">
      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">Sort by:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'date' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'amount' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Highest Amount
          </button>
          <button
            onClick={() => setSortBy('expenses')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              sortBy === 'expenses' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Most Expenses
          </button>
        </div>
      </div>
      
      {/* Monthly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMonthlyData.map((month) => (
          <div key={month.month} className="card p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{month.monthName}</h3>
              {month.changeFromPrevious && (
                <div className={`flex items-center gap-1 text-sm ${
                  month.changeFromPrevious.percentage > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {month.changeFromPrevious.percentage > 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : month.changeFromPrevious.percentage < 0 ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(month.changeFromPrevious.percentage))}%
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(month.total)}
                </p>
                <p className="text-sm text-slate-400">
                  {month.expenseCount} expenses
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-400">Daily Average</p>
                <p className="text-lg font-medium text-slate-300">
                  {formatCurrency(month.averagePerDay)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-slate-400">Top Category</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    {month.topCategory.category}
                  </span>
                  <span className="text-sm text-slate-400">
                    {Math.round(month.topCategory.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${month.topCategory.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnualView({ annualData }: { annualData: AnnualData }) {
  return (
    <div className="space-y-8">
      {/* Annual Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total {annualData.year}</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(annualData.total)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
              <Calendar className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Average</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(annualData.averageMonthly)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 bg-opacity-20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Highest Month</p>
              <p className="text-lg font-bold text-white">
                {annualData.highestMonth.month}
              </p>
              <p className="text-sm text-slate-400">
                {formatCurrency(annualData.highestMonth.amount)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              annualData.trends.direction === 'increasing' ? 'bg-red-500 bg-opacity-20' :
              annualData.trends.direction === 'decreasing' ? 'bg-green-500 bg-opacity-20' :
              'bg-slate-500 bg-opacity-20'
            }`}>
              {annualData.trends.direction === 'increasing' ? (
                <TrendingUp className={`h-6 w-6 ${
                  annualData.trends.direction === 'increasing' ? 'text-red-400' : 'text-green-400'
                }`} />
              ) : annualData.trends.direction === 'decreasing' ? (
                <TrendingDown className="h-6 w-6 text-green-400" />
              ) : (
                <Minus className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400">Year Trend</p>
              <p className="text-lg font-bold text-white capitalize">
                {annualData.trends.direction}
              </p>
              <p className="text-sm text-slate-400">
                {Math.round(annualData.trends.percentage)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Category Breakdown {annualData.year}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(annualData.categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => {
              const percentage = (amount / annualData.total) * 100;
              return (
                <div key={category} className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-300">{category}</span>
                    <span className="text-sm text-slate-400">{Math.round(percentage)}%</span>
                  </div>
                  <p className="text-lg font-bold text-white mb-2">
                    {formatCurrency(amount)}
                  </p>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function InsightsView({ 
  patterns, 
  suggestions, 
  onDataReload
}: { 
  patterns: SpendingPattern[]; 
  suggestions: SpendingSuggestion[];
  monthlyData: MonthlyData[];
  onDataReload: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Smart Suggestions */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Personalized Recommendations</h3>
        </div>
        
        {suggestions.length === 0 ? (
          <p className="text-slate-400">No specific recommendations at this time. Keep tracking expenses for personalized insights!</p>
        ) : (
          <div className="space-y-4">
            {suggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border-l-4 ${
                  suggestion.impact === 'high' ? 'border-red-500 bg-red-500 bg-opacity-10' :
                  suggestion.impact === 'medium' ? 'border-orange-500 bg-orange-500 bg-opacity-10' :
                  'border-blue-500 bg-blue-500 bg-opacity-10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-slate-300 mb-2">{suggestion.description}</p>
                    <p className="text-xs text-slate-400">{suggestion.actionRequired}</p>
                  </div>
                  {suggestion.potentialSavings && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">
                        Save {formatCurrency(suggestion.potentialSavings)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Patterns */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="h-6 w-6 text-orange-400" />
          <h3 className="text-xl font-semibold text-white">Detected Patterns</h3>
        </div>
        
        {patterns.length === 0 ? (
          <p className="text-slate-400">No significant patterns detected yet. More data will improve pattern recognition.</p>
        ) : (
          <div className="space-y-4">
            {patterns.slice(0, 6).map((pattern) => (
              <div key={pattern.id} className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    pattern.type === 'recurring' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                    pattern.type === 'anomaly' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                    'bg-purple-500 bg-opacity-20 text-purple-400'
                  }`}>
                    {pattern.type}
                  </span>
                  <span className="text-sm text-slate-400">
                    {Math.round(pattern.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{pattern.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>Category: {pattern.category}</span>
                  <span>Amount: {formatCurrency(pattern.averageAmount)}</span>
                  <span>Frequency: {pattern.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Recurring Generator */}
      <BulkRecurringGenerator 
        onComplete={() => {
          onDataReload(); // Reload data after generation
        }}
      />
    </div>
  );
}
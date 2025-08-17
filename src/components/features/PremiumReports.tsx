'use client';

import { useState } from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { MonthlyData } from '@/types/analytics';
import { formatCurrency } from '@/lib/utils';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface PremiumReportsProps {
  expenses: Expense[];
  monthlyData: MonthlyData[];
}

interface ReportConfig {
  type: 'detailed' | 'summary' | 'trends' | 'categories';
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  categories: ExpenseCategory[];
  groupBy: 'day' | 'week' | 'month' | 'category';
}

export default function PremiumReports({ expenses, monthlyData }: PremiumReportsProps) {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    type: 'detailed',
    format: 'csv',
    dateRange: {
      start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    categories: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'],
    groupBy: 'month'
  });

  const reportTypes = [
    { value: 'detailed', label: 'Detailed Expense Report', icon: FileText },
    { value: 'summary', label: 'Executive Summary', icon: BarChart3 },
    { value: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { value: 'categories', label: 'Category Breakdown', icon: PieChart }
  ];

  const generateReport = () => {
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      const start = startOfDay(parseISO(config.dateRange.start));
      const end = endOfDay(parseISO(config.dateRange.end));
      
      return isWithinInterval(expenseDate, { start, end }) &&
             config.categories.includes(expense.category as any);
    });

    switch (config.type) {
      case 'detailed':
        generateDetailedReport(filteredExpenses);
        break;
      case 'summary':
        generateSummaryReport(filteredExpenses);
        break;
      case 'trends':
        generateTrendsReport(filteredExpenses);
        break;
      case 'categories':
        generateCategoriesReport(filteredExpenses);
        break;
    }
    
    setShowModal(false);
  };

  const generateDetailedReport = (data: Expense[]) => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Running Total'];
    let runningTotal = 0;
    
    const rows = data
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(expense => {
        runningTotal += expense.amount;
        return [
          format(parseISO(expense.date), 'yyyy-MM-dd'),
          expense.description,
          expense.category,
          expense.amount.toFixed(2),
          runningTotal.toFixed(2)
        ];
      });

    downloadCSV([headers, ...rows], 'detailed-expense-report');
  };

  const generateSummaryReport = (data: Expense[]) => {
    const total = data.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = data.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    const summary = [
      ['EXECUTIVE SUMMARY'],
      ['Report Period', `${config.dateRange.start} to ${config.dateRange.end}`],
      [''],
      ['OVERVIEW'],
      ['Total Expenses', formatCurrency(total)],
      ['Number of Transactions', data.length.toString()],
      ['Average per Transaction', formatCurrency(total / data.length)],
      [''],
      ['TOP CATEGORIES'],
      ...topCategories.map(([cat, amount]) => [
        cat, 
        formatCurrency(amount), 
        `${Math.round((amount / total) * 100)}%`
      ])
    ];

    downloadCSV(summary, 'executive-summary');
  };

  const generateTrendsReport = (data: Expense[]) => {
    const monthlyTotals = data.reduce((acc, exp) => {
      const month = format(parseISO(exp.date), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const trends = Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount], index, arr) => {
        const prevAmount = index > 0 ? arr[index - 1][1] : amount;
        const change = prevAmount > 0 ? ((amount - prevAmount) / prevAmount) * 100 : 0;
        
        return [
          month,
          amount.toFixed(2),
          index > 0 ? change.toFixed(1) + '%' : 'N/A'
        ];
      });

    const headers = ['Month', 'Total Spent', 'Change from Previous'];
    downloadCSV([headers, ...trends], 'trends-report');
  };

  const generateCategoriesReport = (data: Expense[]) => {
    const categoryData = config.categories.map(category => {
      const categoryExpenses = data.filter(exp => exp.category === category);
      const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const count = categoryExpenses.length;
      const average = count > 0 ? total / count : 0;
      const percentage = data.length > 0 ? (count / data.length) * 100 : 0;

      return [
        category,
        formatCurrency(total),
        count.toString(),
        formatCurrency(average),
        percentage.toFixed(1) + '%'
      ];
    });

    const headers = ['Category', 'Total Amount', 'Transaction Count', 'Average per Transaction', '% of Total'];
    downloadCSV([headers, ...categoryData], 'categories-breakdown');
  };

  const downloadCSV = (data: (string | number)[][], filename: string) => {
    const csvContent = data.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500 bg-opacity-20 rounded-xl">
            <FileText className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Premium Reports</h3>
            <p className="text-sm text-slate-400">Advanced analytics and custom exports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setConfig(prev => ({ ...prev, type: value as any }));
                setShowModal(true);
              }}
              className="p-4 bg-slate-700 bg-opacity-30 rounded-lg hover:bg-slate-700 hover:bg-opacity-50 transition-all duration-200 text-left group"
            >
              <Icon className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-medium text-white mb-1">{label}</h4>
              <p className="text-xs text-slate-400">
                {value === 'detailed' && 'Complete transaction history'}
                {value === 'summary' && 'High-level overview'}
                {value === 'trends' && 'Time-based analysis'}
                {value === 'categories' && 'Category insights'}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-20">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-300 mb-1">Pro Tip</h4>
              <p className="text-sm text-blue-200">
                Use detailed reports for tax preparation, summary reports for budget reviews, 
                and trend analysis to identify spending patterns over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Configure Report</h2>
              <p className="text-sm text-slate-400 mt-1">
                {reportTypes.find(t => t.value === config.type)?.label}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>

              <Select
                label="Export Format"
                value={config.format}
                onChange={(e) => setConfig(prev => ({ ...prev, format: e.target.value as any }))}
                options={[
                  { value: 'csv', label: 'CSV (Spreadsheet)' },
                  { value: 'pdf', label: 'PDF (Coming Soon)' },
                  { value: 'excel', label: 'Excel (Coming Soon)' }
                ]}
              />

              {config.type === 'trends' && (
                <Select
                  label="Group By"
                  value={config.groupBy}
                  onChange={(e) => setConfig(prev => ({ ...prev, groupBy: e.target.value as any }))}
                  options={[
                    { value: 'day', label: 'Daily' },
                    { value: 'week', label: 'Weekly' },
                    { value: 'month', label: 'Monthly' }
                  ]}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Include Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'].map(category => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.categories.includes(category as ExpenseCategory)}
                        onChange={(e) => {
                          const updatedCategories = e.target.checked
                            ? [...config.categories, category as ExpenseCategory]
                            : config.categories.filter(c => c !== category);
                          setConfig(prev => ({ ...prev, categories: updatedCategories }));
                        }}
                        className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <Button onClick={generateReport} className="flex-1 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
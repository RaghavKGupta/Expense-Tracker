'use client';

import { useEffect, useState } from 'react';
import { Asset, Liability, Subscription, FinancialSummary } from '@/types/financial';
import { Expense } from '@/types/expense';
import { financialStorage } from '@/lib/financialStorage';
import { storage } from '@/lib/storage';
import { 
  calculateNetWorth, 
  calculateMonthlyRecurringTotal,
  getUpcomingSubscriptions,
  calculateLoanPayoff,
  projectCashFlow
} from '@/lib/financialCalculations';
import { recurringExpenseService } from '@/lib/recurringExpenseService';
import { formatCurrency } from '@/lib/utils';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Calendar,
  Target,
  AlertTriangle,
  Plus,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  Clock,
  Building2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import Link from 'next/link';

export default function FinancePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
    
    // Load saved monthly income
    const savedIncome = localStorage.getItem('monthly-income');
    if (savedIncome) {
      setMonthlyIncome(parseFloat(savedIncome));
    }
  }, []);

  const loadFinancialData = () => {
    const loadedAssets = financialStorage.getAssets();
    const loadedLiabilities = financialStorage.getLiabilities();
    const loadedSubscriptions = financialStorage.getSubscriptions();
    const loadedExpenses = storage.getExpenses();
    
    setAssets(loadedAssets);
    setLiabilities(loadedLiabilities);
    setSubscriptions(loadedSubscriptions);
    setExpenses(loadedExpenses);
    setIsLoading(false);
  };

  const handleIncomeChange = (newIncome: number) => {
    setMonthlyIncome(newIncome);
    localStorage.setItem('monthly-income', newIncome.toString());
  };

  const generateUpcomingExpenses = () => {
    const generated = recurringExpenseService.manuallyGenerateUpcoming(7);
    if (generated > 0) {
      alert(`Generated ${generated} upcoming subscription expenses!`);
      loadFinancialData(); // Refresh data
    } else {
      alert('No new subscription expenses to generate.');
    }
  };

  // Calculate financial summary
  const netWorthCalc = calculateNetWorth(assets, liabilities);
  const monthlySubscriptions = calculateMonthlyRecurringTotal(subscriptions.filter(s => s.isActive));
  
  // Calculate monthly expenses (current month)
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const currentMonthExpenses = expenses
    .filter(exp => {
      const expDate = parseISO(exp.date);
      return expDate >= monthStart && expDate <= monthEnd;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const upcomingBills = getUpcomingSubscriptions(subscriptions, 30);
  const loanPayoffs = liabilities
    .map(liability => calculateLoanPayoff(liability))
    .filter(payoff => payoff !== null);

  const cashFlowProjection = monthlyIncome > 0 
    ? projectCashFlow(monthlyIncome, currentMonthExpenses, subscriptions, liabilities)
    : null;

  const financialSummary: FinancialSummary = {
    netWorth: netWorthCalc.netWorth,
    totalAssets: netWorthCalc.totalAssets,
    totalLiabilities: netWorthCalc.totalLiabilities,
    monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
    monthlyExpenses: currentMonthExpenses,
    monthlySubscriptions,
    cashFlow: monthlyIncome - currentMonthExpenses - monthlySubscriptions,
    debtToIncomeRatio: cashFlowProjection?.debtToIncomeRatio,
    emergencyFundMonths: cashFlowProjection 
      ? netWorthCalc.totalAssets / (currentMonthExpenses + monthlySubscriptions) 
      : undefined,
    upcomingBills: upcomingBills.slice(0, 5).map(sub => ({
      subscription: sub,
      dueDate: sub.nextBilling,
      amount: sub.amount
    })),
    loanPayoffs: loanPayoffs as any[]
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Complete picture of your financial health
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={generateUpcomingExpenses}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Clock className="h-5 w-5" />
            Generate Due
          </Button>
        </div>
      </div>

      {/* Quick Setup for New Users */}
      {assets.length === 0 && liabilities.length === 0 && subscriptions.length === 0 && (
        <div className="card p-8 mb-8 border-blue-500 border-opacity-50">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Financial Tracking</h3>
            <p className="text-slate-400 mb-6">Get started by adding your financial information</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/assets">
                <Button className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Assets
                </Button>
              </Link>
              <Link href="/liabilities">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Debts
                </Button>
              </Link>
              <Link href="/subscriptions">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subscriptions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Income Input */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Monthly Income</h3>
            <p className="text-sm text-slate-400">Enter your monthly income for cash flow analysis</p>
          </div>
          <div className="w-48">
            <Input
              type="number"
              step="0.01"
              value={monthlyIncome.toString()}
              onChange={(e) => handleIncomeChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              financialSummary.netWorth >= 0 
                ? 'bg-green-500 bg-opacity-20' 
                : 'bg-red-500 bg-opacity-20'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                financialSummary.netWorth >= 0 ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Net Worth</p>
              <p className={`text-2xl font-bold ${
                financialSummary.netWorth >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(financialSummary.netWorth)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              financialSummary.cashFlow >= 0 
                ? 'bg-green-500 bg-opacity-20' 
                : 'bg-red-500 bg-opacity-20'
            }`}>
              {financialSummary.cashFlow >= 0 ? (
                <ArrowUp className="h-6 w-6 text-green-400" />
              ) : (
                <ArrowDown className="h-6 w-6 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Cash Flow</p>
              <p className={`text-2xl font-bold ${
                financialSummary.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(financialSummary.cashFlow)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <Wallet className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(financialSummary.totalAssets)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
              <CreditCard className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Debt</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(financialSummary.totalLiabilities)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500 bg-opacity-20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Monthly Cash Flow</h3>
              <p className="text-sm text-slate-400">Income vs Expenses breakdown</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyIncome > 0 && (
              <div className="flex justify-between items-center p-3 bg-green-500 bg-opacity-10 rounded-lg">
                <span className="text-green-300">Monthly Income</span>
                <span className="font-bold text-green-400">{formatCurrency(monthlyIncome)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center p-3 bg-red-500 bg-opacity-10 rounded-lg">
              <span className="text-red-300">Monthly Expenses</span>
              <span className="font-bold text-red-400">{formatCurrency(financialSummary.monthlyExpenses)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-500 bg-opacity-10 rounded-lg">
              <span className="text-orange-300">Subscriptions</span>
              <span className="font-bold text-orange-400">{formatCurrency(financialSummary.monthlySubscriptions)}</span>
            </div>
            
            {cashFlowProjection && (
              <div className="flex justify-between items-center p-3 bg-blue-500 bg-opacity-10 rounded-lg">
                <span className="text-blue-300">Debt Payments</span>
                <span className="font-bold text-blue-400">{formatCurrency(cashFlowProjection.monthlyDebtPayments)}</span>
              </div>
            )}
            
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              financialSummary.cashFlow >= 0 
                ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' 
                : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30'
            }`}>
              <span className={`font-semibold ${
                financialSummary.cashFlow >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                Net Cash Flow
              </span>
              <span className={`font-bold text-lg ${
                financialSummary.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(financialSummary.cashFlow)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Health Indicators */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
              <Target className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Financial Health</h3>
              <p className="text-sm text-slate-400">Key health indicators</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {financialSummary.debtToIncomeRatio !== undefined && (
              <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Debt-to-Income Ratio</span>
                  <span className={`font-bold ${
                    financialSummary.debtToIncomeRatio <= 36 ? 'text-green-400' :
                    financialSummary.debtToIncomeRatio <= 50 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {financialSummary.debtToIncomeRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      financialSummary.debtToIncomeRatio <= 36 ? 'bg-green-500' :
                      financialSummary.debtToIncomeRatio <= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, financialSummary.debtToIncomeRatio)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {financialSummary.debtToIncomeRatio <= 36 ? 'Excellent' :
                   financialSummary.debtToIncomeRatio <= 50 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            )}
            
            {financialSummary.emergencyFundMonths !== undefined && (
              <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Emergency Fund</span>
                  <span className={`font-bold ${
                    financialSummary.emergencyFundMonths >= 6 ? 'text-green-400' :
                    financialSummary.emergencyFundMonths >= 3 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {financialSummary.emergencyFundMonths.toFixed(1)} months
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      financialSummary.emergencyFundMonths >= 6 ? 'bg-green-500' :
                      financialSummary.emergencyFundMonths >= 3 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (financialSummary.emergencyFundMonths / 6) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: 6 months of expenses
                </p>
              </div>
            )}
            
            <div className="p-3 bg-slate-700 bg-opacity-30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Active Subscriptions</span>
                <span className="font-bold text-white">{subscriptions.filter(s => s.isActive).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bills & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Upcoming Bills */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-xl">
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Upcoming Bills</h3>
                <p className="text-sm text-slate-400">Next 30 days</p>
              </div>
            </div>
            <Link href="/subscriptions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {financialSummary.upcomingBills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No upcoming bills</p>
            </div>
          ) : (
            <div className="space-y-3">
              {financialSummary.upcomingBills.map((bill) => {
                const daysUntil = differenceInDays(parseISO(bill.dueDate), new Date());
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil <= 3 && daysUntil >= 0;
                
                return (
                  <div
                    key={bill.subscription.id}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      isOverdue ? 'bg-red-500 bg-opacity-20' :
                      isDueSoon ? 'bg-orange-500 bg-opacity-20' : 'bg-slate-700 bg-opacity-30'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-white">{bill.subscription.name}</p>
                      <p className={`text-sm ${
                        isOverdue ? 'text-red-400' :
                        isDueSoon ? 'text-orange-400' : 'text-slate-400'
                      }`}>
                        {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                         daysUntil === 0 ? 'Due today' :
                         daysUntil === 1 ? 'Due tomorrow' :
                         `${daysUntil} days away`}
                      </p>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(bill.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <PieChart className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
              <p className="text-sm text-slate-400">Manage your finances</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Link href="/networth">
              <Button variant="outline" className="w-full text-left">
                Net Worth
              </Button>
            </Link>
            <Link href="/goals">
              <Button variant="outline" className="w-full text-left">
                Goals
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full text-left">
                Analytics
              </Button>
            </Link>
            <Link href="/add">
              <Button className="w-full text-left">
                Add Expense
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Loan Payoff Summary */}
      {financialSummary.loanPayoffs.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Debt Payoff Timeline</h3>
              <p className="text-sm text-slate-400">Loan payoff projections</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialSummary.loanPayoffs.slice(0, 6).map((payoff) => {
              const liability = liabilities.find(l => l.id === payoff.liabilityId);
              if (!liability) return null;
              
              return (
                <div key={payoff.liabilityId} className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">{liability.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payoff Date:</span>
                      <span className="text-white">{format(new Date(payoff.payoffDate), 'MMM yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Months Left:</span>
                      <span className="text-white">{payoff.monthsRemaining}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Interest Remaining:</span>
                      <span className="text-red-300">{formatCurrency(payoff.totalInterestRemaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <Link href="/liabilities">
              <Button variant="outline">View All Debt Details</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
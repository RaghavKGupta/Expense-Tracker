import { ExpenseSummary } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Calendar, BarChart3, TrendingDown, Wallet } from 'lucide-react';

interface SummaryCardsProps {
  summary: ExpenseSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const hasIncomeData = summary.monthlyIncome !== undefined;
  
  const cards = [
    {
      title: 'Monthly Income',
      value: formatCurrency(summary.monthlyIncome || 0),
      icon: TrendingUp,
      gradient: 'from-green-500 to-green-600',
      shadowColor: 'shadow-green-500/25',
      isPositive: true,
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(summary.monthlySpending),
      icon: TrendingDown,
      gradient: 'from-red-500 to-red-600',
      shadowColor: 'shadow-red-500/25',
      isPositive: false,
    },
    {
      title: 'Net Cash Flow',
      value: formatCurrency(summary.netCashFlow || -summary.monthlySpending),
      icon: Wallet,
      gradient: (summary.netCashFlow || -summary.monthlySpending) >= 0 
        ? 'from-blue-500 to-blue-600' 
        : 'from-orange-500 to-orange-600',
      shadowColor: (summary.netCashFlow || -summary.monthlySpending) >= 0 
        ? 'shadow-blue-500/25' 
        : 'shadow-orange-500/25',
      isPositive: (summary.netCashFlow || -summary.monthlySpending) >= 0,
    },
    {
      title: 'Daily Average',
      value: formatCurrency(summary.averageDailySpending),
      icon: Calendar,
      gradient: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-500/25',
      isPositive: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="card card-hover p-6 group"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">{card.title}</p>
                <p className={`text-2xl font-bold ${card.isPositive ? 'text-green-400' : card.title === 'Net Cash Flow' && !card.isPositive ? 'text-red-400' : 'text-white'}`}>
                  {card.title === 'Monthly Income' && '+'}
                  {card.title === 'Monthly Expenses' && '-'}
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
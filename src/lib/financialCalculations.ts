import { Asset, Liability, Subscription, NetWorthSnapshot, LoanPayoffProjection, AssetCategory, LiabilityCategory } from '@/types/financial';
import { Expense } from '@/types/expense';
import { addMonths, addWeeks, addDays, addYears, isBefore, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { parseLocalDate, formatLocalDate, getTodayString, addWeeksFormatted, addMonthsFormatted, addYearsFormatted } from './dateUtils';

export function calculateNetWorth(assets: Asset[], liabilities: Liability[]): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetBreakdown: Record<AssetCategory, number>;
  liabilityBreakdown: Record<LiabilityCategory, number>;
} {
  const totalAssets = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.currentBalance, 0);
  
  const assetBreakdown = assets.reduce((breakdown, asset) => {
    breakdown[asset.category] = (breakdown[asset.category] || 0) + asset.currentValue;
    return breakdown;
  }, {} as Record<AssetCategory, number>);
  
  const liabilityBreakdown = liabilities.reduce((breakdown, liability) => {
    breakdown[liability.category] = (breakdown[liability.category] || 0) + liability.currentBalance;
    return breakdown;
  }, {} as Record<LiabilityCategory, number>);

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assetBreakdown,
    liabilityBreakdown
  };
}

export function generateNetWorthSnapshot(
  assets: Asset[], 
  liabilities: Liability[], 
  previousSnapshot?: NetWorthSnapshot
): NetWorthSnapshot {
  const calculation = calculateNetWorth(assets, liabilities);
  const today = getTodayString();
  
  let monthlyChange;
  if (previousSnapshot) {
    const assetChange = calculation.totalAssets - previousSnapshot.totalAssets;
    const liabilityChange = calculation.totalLiabilities - previousSnapshot.totalLiabilities;
    const netWorthChange = calculation.netWorth - previousSnapshot.netWorth;
    const percentage = previousSnapshot.netWorth !== 0 
      ? (netWorthChange / Math.abs(previousSnapshot.netWorth)) * 100 
      : 0;
    
    monthlyChange = {
      assets: assetChange,
      liabilities: liabilityChange,
      netWorth: netWorthChange,
      percentage
    };
  }

  return {
    date: today,
    totalAssets: calculation.totalAssets,
    totalLiabilities: calculation.totalLiabilities,
    netWorth: calculation.netWorth,
    assetBreakdown: calculation.assetBreakdown,
    liabilityBreakdown: calculation.liabilityBreakdown,
    monthlyChange
  };
}

export function calculateLoanPayoff(liability: Liability): LoanPayoffProjection | null {
  if (!liability.minimumPayment || !liability.interestRate || liability.currentBalance <= 0) {
    return null;
  }

  const monthlyRate = liability.interestRate / 100 / 12;
  const balance = liability.currentBalance;
  const payment = liability.minimumPayment;
  
  // Check if payment is sufficient to pay off the loan
  if (payment <= balance * monthlyRate) {
    // Payment doesn't cover interest, loan will never be paid off
    return null;
  }

  const monthlyBreakdown = [];
  let remainingBalance = balance;
  let totalInterest = 0;
  let month = 0;
  const currentDate = new Date();

  while (remainingBalance > 0.01 && month < 600) { // Max 50 years
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(payment - interestPayment, remainingBalance);
    remainingBalance -= principalPayment;
    totalInterest += interestPayment;
    month++;

    monthlyBreakdown.push({
      month: format(addMonths(currentDate, month), 'yyyy-MM'),
      payment: payment,
      principal: principalPayment,
      interest: interestPayment,
      remainingBalance: Math.max(0, remainingBalance)
    });
  }

  // Calculate extra payment scenarios
  const extraPaymentScenarios = [50, 100, 200, 500].map(extraAmount => {
    const newPayment = payment + extraAmount;
    let tempBalance = balance;
    let tempMonths = 0;
    let tempInterest = 0;

    while (tempBalance > 0.01 && tempMonths < 600) {
      const interest = tempBalance * monthlyRate;
      const principal = Math.min(newPayment - interest, tempBalance);
      tempBalance -= principal;
      tempInterest += interest;
      tempMonths++;
    }

    return {
      extraAmount,
      monthsSaved: month - tempMonths,
      interestSaved: totalInterest - tempInterest
    };
  });

  return {
    liabilityId: liability.id,
    monthsRemaining: month,
    totalInterestRemaining: totalInterest,
    payoffDate: format(addMonths(currentDate, month), 'yyyy-MM-dd'),
    monthlyBreakdown,
    extraPaymentScenarios
  };
}

export function calculateNextBillingDate(subscription: Subscription): string {
  const lastBilling = subscription.lastBilled || subscription.startDate;

  switch (subscription.frequency) {
    case 'weekly':
      return addWeeksFormatted(lastBilling, 1);
    case 'biweekly':
      return addWeeksFormatted(lastBilling, 2);
    case 'monthly':
      return addMonthsFormatted(lastBilling, 1);
    case 'quarterly':
      return addMonthsFormatted(lastBilling, 3);
    case 'yearly':
      return addYearsFormatted(lastBilling, 1);
    default:
      return addMonthsFormatted(lastBilling, 1);
  }
}

export function getUpcomingSubscriptions(
  subscriptions: Subscription[], 
  daysAhead: number = 30
): Subscription[] {
  const cutoffDate = addDays(new Date(), daysAhead);
  
  return subscriptions
    .filter(sub => sub.isActive)
    .filter(sub => {
      const nextBilling = parseISO(sub.nextBilling);
      return isBefore(nextBilling, cutoffDate);
    })
    .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());
}

export function generateRecurringExpenses(
  subscriptions: Subscription[], 
  existingExpenses: Expense[],
  targetMonth?: string
): Expense[] {
  const month = targetMonth || format(new Date(), 'yyyy-MM');
  const monthStart = startOfMonth(parseISO(`${month}-01`));
  const monthEnd = endOfMonth(parseISO(`${month}-01`));
  
  const newExpenses: Expense[] = [];

  subscriptions
    .filter(sub => sub.isActive && sub.autoGenerate)
    .forEach(subscription => {
      // Check if subscription should bill in this month
      const nextBilling = parseISO(subscription.nextBilling);
      
      if (nextBilling >= monthStart && nextBilling <= monthEnd) {
        // Check if expense already exists for this billing period
        const billingDateString = formatLocalDate(nextBilling);
        const existingExpense = existingExpenses.find(exp => 
          exp.date === billingDateString &&
          exp.description.includes(subscription.name) &&
          exp.amount === subscription.amount
        );

        if (!existingExpense) {
          newExpenses.push({
            id: `sub-${subscription.id}-${billingDateString}`,
            description: `${subscription.name} (Subscription)`,
            amount: subscription.amount,
            category: subscription.category as any,
            date: billingDateString,
            createdAt: new Date().toISOString(),
            isRecurring: true,
            subscriptionId: subscription.id
          });
        }
      }
    });

  return newExpenses;
}

export function calculateMonthlyRecurringTotal(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      switch (sub.frequency) {
        case 'weekly':
          return total + (sub.amount * 52 / 12); // Weekly to monthly
        case 'monthly':
          return total + sub.amount;
        case 'quarterly':
          return total + (sub.amount / 3); // Quarterly to monthly
        case 'yearly':
          return total + (sub.amount / 12); // Yearly to monthly
        default:
          return total;
      }
    }, 0);
}

export function projectCashFlow(
  monthlyIncome: number,
  monthlyExpenses: number,
  subscriptions: Subscription[],
  liabilities: Liability[]
): {
  monthlyCashFlow: number;
  monthlyDebtPayments: number;
  monthlySubscriptions: number;
  emergencyFundRecommendation: number;
  debtToIncomeRatio: number;
} {
  const monthlySubscriptions = calculateMonthlyRecurringTotal(subscriptions);
  const monthlyDebtPayments = liabilities
    .reduce((total, liability) => total + (liability.minimumPayment || 0), 0);
  
  const totalMonthlyExpenses = monthlyExpenses + monthlySubscriptions + monthlyDebtPayments;
  const monthlyCashFlow = monthlyIncome - totalMonthlyExpenses;
  
  return {
    monthlyCashFlow,
    monthlyDebtPayments,
    monthlySubscriptions,
    emergencyFundRecommendation: totalMonthlyExpenses * 6, // 6 months emergency fund
    debtToIncomeRatio: monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0
  };
}
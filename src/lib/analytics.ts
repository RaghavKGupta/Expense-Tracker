import { Expense, ExpenseCategory, Income, IncomeCategory } from '@/types/expense';
import { 
  MonthlyData, 
  AnnualData, 
  SpendingPattern, 
  SpendingSuggestion, 
  PredictiveAnalysis 
} from '@/types/analytics';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths,
  isWithinInterval,
  startOfYear,
  endOfYear,
  differenceInDays,
  addMonths,
  parseISO
} from 'date-fns';
import { parseLocalDate } from './dateUtils';

export function generateMonthlyAnalytics(expenses: Expense[], incomes: Income[], year?: number): MonthlyData[] {
  const targetYear = year || new Date().getFullYear();
  const yearStart = startOfYear(new Date(targetYear, 0, 1));
  const yearEnd = endOfYear(new Date(targetYear, 11, 31));
  
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  
  return months.map((monthDate, index) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthName = format(monthDate, 'MMMM yyyy');
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = parseLocalDate(expense.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });

    const monthIncomes = incomes.filter(income => {
      const incomeDate = parseLocalDate(income.date);
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    });
    
    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const netCashFlow = totalIncome - total;
    const expenseCount = monthExpenses.length;
    const incomeCount = monthIncomes.length;
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const averagePerDay = total / daysInMonth;
    
    // Category breakdown
    const categoryBreakdown = monthExpenses.reduce((breakdown, expense) => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
      return breakdown;
    }, {} as Record<ExpenseCategory, number>);

    // Income breakdown
    const incomeBreakdown = monthIncomes.reduce((breakdown, income) => {
      breakdown[income.category] = (breakdown[income.category] || 0) + income.amount;
      return breakdown;
    }, {} as Record<IncomeCategory, number>);
    
    // Top category
    const topCategoryEntry = Object.entries(categoryBreakdown).reduce(
      (max, [cat, amount]) => amount > max[1] ? [cat, amount] : max,
      ['Other', 0]
    );
    
    const topCategory = {
      category: topCategoryEntry[0] as ExpenseCategory,
      amount: topCategoryEntry[1],
      percentage: total > 0 ? (topCategoryEntry[1] / total) * 100 : 0
    };

    // Top income source
    const topIncomeEntry = Object.entries(incomeBreakdown).reduce(
      (max, [cat, amount]) => amount > max[1] ? [cat, amount] : max,
      ['Other', 0]
    );
    
    const topIncomeSource = {
      category: topIncomeEntry[0] as IncomeCategory,
      amount: topIncomeEntry[1],
      percentage: totalIncome > 0 ? (topIncomeEntry[1] / totalIncome) * 100 : 0
    };
    
    // Previous month comparison
    let changeFromPrevious: MonthlyData['changeFromPrevious'];
    if (index > 0) {
      const prevMonthStart = startOfMonth(subMonths(monthDate, 1));
      const prevMonthEnd = endOfMonth(subMonths(monthDate, 1));
      
      const prevMonthExpenses = expenses.filter(expense => {
        const expenseDate = parseLocalDate(expense.date);
        return isWithinInterval(expenseDate, { start: prevMonthStart, end: prevMonthEnd });
      });
      
      const prevMonthIncomes = incomes.filter(income => {
        const incomeDate = parseLocalDate(income.date);
        return isWithinInterval(incomeDate, { start: prevMonthStart, end: prevMonthEnd });
      });
      
      const prevTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const prevTotalIncome = prevMonthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
      const prevNetFlow = prevTotalIncome - prevTotal;
      
      if (prevTotal > 0 || prevTotalIncome > 0) {
        const amountChange = total - prevTotal;
        const percentageChange = prevTotal > 0 ? (amountChange / prevTotal) * 100 : 0;
        const incomeChange = totalIncome - prevTotalIncome;
        const netFlowChange = netCashFlow - prevNetFlow;
        
        changeFromPrevious = {
          amount: amountChange,
          percentage: percentageChange,
          incomeChange,
          netFlowChange
        };
      }
    }
    
    return {
      month: monthKey,
      monthName,
      total,
      totalIncome,
      netCashFlow,
      categoryBreakdown,
      incomeBreakdown,
      expenseCount,
      incomeCount,
      averagePerDay,
      topCategory,
      topIncomeSource,
      changeFromPrevious
    };
  });
}

export function generateAnnualAnalytics(expenses: Expense[], incomes: Income[], year: number): AnnualData {
  const monthlyData = generateMonthlyAnalytics(expenses, incomes, year);
  const total = monthlyData.reduce((sum, month) => sum + month.total, 0);
  const totalIncome = monthlyData.reduce((sum, month) => sum + month.totalIncome, 0);
  const netCashFlow = totalIncome - total;
  
  // Category totals for the year
  const categoryTotals = monthlyData.reduce((totals, month) => {
    Object.entries(month.categoryBreakdown).forEach(([category, amount]) => {
      totals[category as ExpenseCategory] = (totals[category as ExpenseCategory] || 0) + amount;
    });
    return totals;
  }, {} as Record<ExpenseCategory, number>);

  // Income totals for the year
  const incomeTotals = monthlyData.reduce((totals, month) => {
    Object.entries(month.incomeBreakdown).forEach(([category, amount]) => {
      totals[category as IncomeCategory] = (totals[category as IncomeCategory] || 0) + amount;
    });
    return totals;
  }, {} as Record<IncomeCategory, number>);
  
  const averageMonthly = total / 12;
  const averageMonthlyIncome = totalIncome / 12;
  
  // Find highest and lowest months for expenses
  const sortedExpenseMonths = [...monthlyData].sort((a, b) => b.total - a.total);
  const highestMonth = { month: sortedExpenseMonths[0].monthName, amount: sortedExpenseMonths[0].total };
  const lowestMonth = { month: sortedExpenseMonths[sortedExpenseMonths.length - 1].monthName, amount: sortedExpenseMonths[sortedExpenseMonths.length - 1].total };
  
  // Find best income month
  const sortedIncomeMonths = [...monthlyData].sort((a, b) => b.totalIncome - a.totalIncome);
  const bestIncomeMonth = { month: sortedIncomeMonths[0].monthName, amount: sortedIncomeMonths[0].totalIncome };
  
  // Calculate expense trends
  const firstHalf = monthlyData.slice(0, 6).reduce((sum, m) => sum + m.total, 0) / 6;
  const secondHalf = monthlyData.slice(6, 12).reduce((sum, m) => sum + m.total, 0) / 6;
  const trendPercentage = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(trendPercentage) > 5) {
    direction = trendPercentage > 0 ? 'increasing' : 'decreasing';
  }
  
  // Calculate income trends
  const firstHalfIncome = monthlyData.slice(0, 6).reduce((sum, m) => sum + m.totalIncome, 0) / 6;
  const secondHalfIncome = monthlyData.slice(6, 12).reduce((sum, m) => sum + m.totalIncome, 0) / 6;
  const incomeTrendPercentage = firstHalfIncome > 0 ? ((secondHalfIncome - firstHalfIncome) / firstHalfIncome) * 100 : 0;
  
  let incomeDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (Math.abs(incomeTrendPercentage) > 5) {
    incomeDirection = incomeTrendPercentage > 0 ? 'increasing' : 'decreasing';
  }
  
  return {
    year,
    total,
    totalIncome,
    netCashFlow,
    monthlyData,
    categoryTotals,
    incomeTotals,
    averageMonthly,
    averageMonthlyIncome,
    highestMonth,
    lowestMonth,
    bestIncomeMonth,
    trends: {
      direction,
      percentage: Math.abs(trendPercentage),
      incomeDirection,
      incomePercentage: Math.abs(incomeTrendPercentage)
    }
  };
}

export function detectSpendingPatterns(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  
  // Group expenses by category and analyze frequency
  const categoryGroups = expenses.reduce((groups, expense) => {
    if (!groups[expense.category]) groups[expense.category] = [];
    groups[expense.category].push(expense);
    return groups;
  }, {} as Record<ExpenseCategory, Expense[]>);
  
  Object.entries(categoryGroups).forEach(([category, categoryExpenses]) => {
    const sortedExpenses = categoryExpenses.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Detect recurring expenses (similar amounts at regular intervals)
    const recurringExpenses = findRecurringExpenses(sortedExpenses);
    recurringExpenses.forEach(pattern => patterns.push(pattern));
    
    // Detect spending spikes (anomalies)
    const anomalies = findSpendingAnomalies(sortedExpenses, category as ExpenseCategory);
    anomalies.forEach(anomaly => patterns.push(anomaly));
  });
  
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function findRecurringExpenses(expenses: Expense[]): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];
  
  // Group by similar amounts (within 10% range)
  const amountGroups: { [key: string]: Expense[] } = {};
  
  expenses.forEach(expense => {
    const roundedAmount = Math.round(expense.amount / 5) * 5; // Group by $5 ranges
    const key = `${roundedAmount}-${expense.category}`;
    if (!amountGroups[key]) amountGroups[key] = [];
    amountGroups[key].push(expense);
  });
  
  Object.values(amountGroups).forEach(group => {
    if (group.length >= 3) { // At least 3 occurrences
      const averageAmount = group.reduce((sum, exp) => sum + exp.amount, 0) / group.length;
      const dates = group.map(exp => new Date(exp.date));
      const intervals = [];
      
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = differenceInDays(dates[i], dates[i - 1]);
        intervals.push(daysDiff);
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      
      // If intervals are consistent (low variance), it's likely a recurring pattern
      if (intervalVariance < (avgInterval * 0.3)) {
        let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
        if (avgInterval <= 2) frequency = 'daily';
        else if (avgInterval <= 10) frequency = 'weekly';
        else if (avgInterval <= 40) frequency = 'monthly';
        else frequency = 'yearly';
        
        patterns.push({
          id: `recurring-${group[0].category}-${averageAmount}`,
          type: 'recurring',
          category: group[0].category,
          description: `Regular ${group[0].category.toLowerCase()} expense of ~${formatCurrency(averageAmount)}`,
          confidence: Math.min(0.9, 0.3 + (group.length * 0.1)),
          frequency,
          averageAmount,
          lastOccurrence: group[group.length - 1].date,
          nextPredicted: format(addMonths(new Date(group[group.length - 1].date), 1), 'yyyy-MM-dd')
        });
      }
    }
  });
  
  return patterns;
}

function findSpendingAnomalies(expenses: Expense[], category: ExpenseCategory): SpendingPattern[] {
  if (expenses.length < 5) return [];
  
  const amounts = expenses.map(exp => exp.amount);
  const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  const anomalies: SpendingPattern[] = [];
  
  expenses.forEach(expense => {
    const zScore = Math.abs(expense.amount - average) / stdDev;
    if (zScore > 2) { // More than 2 standard deviations from mean
      anomalies.push({
        id: `anomaly-${expense.id}`,
        type: 'anomaly',
        category,
        description: `Unusual ${category.toLowerCase()} expense: ${formatCurrency(expense.amount)} (${Math.round(zScore * 100)}% above normal)`,
        confidence: Math.min(0.95, zScore / 3),
        frequency: 'monthly', // Default
        averageAmount: expense.amount,
        lastOccurrence: expense.date
      });
    }
  });
  
  return anomalies;
}

export function generateSpendingSuggestions(
  expenses: Expense[], 
  monthlyData: MonthlyData[], 
  patterns: SpendingPattern[]
): SpendingSuggestion[] {
  const suggestions: SpendingSuggestion[] = [];
  
  // Analyze current month vs previous months
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonths = monthlyData.slice(-3, -1); // Last 2 months before current
  
  if (previousMonths.length > 0) {
    const avgPrevious = previousMonths.reduce((sum, month) => sum + month.total, 0) / previousMonths.length;
    
    // High spending alert
    if (currentMonth.total > avgPrevious * 1.2) {
      suggestions.push({
        id: 'high-spending-alert',
        type: 'category_warning',
        title: 'Higher than usual spending',
        description: `You've spent ${formatCurrency(currentMonth.total)} this month, ${Math.round(((currentMonth.total - avgPrevious) / avgPrevious) * 100)}% more than your recent average.`,
        impact: 'high',
        potentialSavings: currentMonth.total - avgPrevious,
        actionRequired: 'Review your expenses and consider reducing non-essential spending',
        priority: 9
      });
    }
    
    // Category optimization suggestions
    Object.entries(currentMonth.categoryBreakdown).forEach(([category, amount]) => {
      const avgCategorySpending = previousMonths.reduce(
        (sum, month) => sum + (month.categoryBreakdown[category as ExpenseCategory] || 0), 0
      ) / previousMonths.length;
      
      if (amount > avgCategorySpending * 1.3) {
        suggestions.push({
          id: `category-optimization-${category}`,
          type: 'budget_optimization',
          title: `Reduce ${category} spending`,
          description: `Your ${category.toLowerCase()} spending is ${Math.round(((amount - avgCategorySpending) / avgCategorySpending) * 100)}% higher than usual.`,
          impact: amount > 200 ? 'high' : amount > 100 ? 'medium' : 'low',
          potentialSavings: amount - avgCategorySpending,
          actionRequired: `Look for alternatives or reduce frequency of ${category.toLowerCase()} expenses`,
          category: category as ExpenseCategory,
          priority: Math.min(10, Math.round((amount - avgCategorySpending) / 50))
        });
      }
    });
  }
  
  // Pattern-based suggestions
  patterns.forEach(pattern => {
    if (pattern.type === 'recurring' && pattern.averageAmount > 50) {
      suggestions.push({
        id: `recurring-review-${pattern.id}`,
        type: 'habit_change',
        title: `Review recurring ${pattern.category} expense`,
        description: `You spend ~${formatCurrency(pattern.averageAmount)} ${pattern.frequency} on ${pattern.category.toLowerCase()}. Consider if this is still necessary.`,
        impact: pattern.averageAmount > 200 ? 'high' : 'medium',
        potentialSavings: pattern.averageAmount * 0.3, // Assume 30% potential reduction
        actionRequired: 'Evaluate if this recurring expense can be reduced or eliminated',
        category: pattern.category,
        priority: Math.min(8, Math.round(pattern.averageAmount / 50))
      });
    }
  });
  
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8); // Top 8 suggestions
}

export function generatePredictiveAnalysis(
  expenses: Expense[], 
  monthlyData: MonthlyData[]
): PredictiveAnalysis {
  const recentMonths = monthlyData.slice(-6); // Last 6 months
  const avgMonthly = recentMonths.reduce((sum, month) => sum + month.total, 0) / recentMonths.length;
  
  // Simple trend-based prediction
  const firstThree = recentMonths.slice(0, 3).reduce((sum, month) => sum + month.total, 0) / 3;
  const lastThree = recentMonths.slice(-3).reduce((sum, month) => sum + month.total, 0) / 3;
  const trendFactor = lastThree / firstThree;
  
  const nextMonthEstimate = avgMonthly * trendFactor;
  const confidence = Math.max(0.6, Math.min(0.95, 1 - Math.abs(trendFactor - 1)));
  
  // Category forecasts
  const categoryForecasts = {} as Record<ExpenseCategory, number>;
  Object.keys(recentMonths[0]?.categoryBreakdown || {}).forEach(category => {
    const categoryAvg = recentMonths.reduce(
      (sum, month) => sum + (month.categoryBreakdown[category as ExpenseCategory] || 0), 0
    ) / recentMonths.length;
    categoryForecasts[category as ExpenseCategory] = categoryAvg * trendFactor;
  });
  
  const yearEndProjection = nextMonthEstimate * (12 - new Date().getMonth());
  
  return {
    nextMonthEstimate,
    confidence,
    factors: ['Recent spending trends', 'Seasonal patterns', 'Historical data'],
    yearEndProjection,
    categoryForecasts,
    savingsOpportunities: [] // Will be populated by optimization analysis
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
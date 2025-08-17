import { Income, Expense } from '@/types/expense';
import { Subscription } from '@/types/financial';
import { addDays, addWeeks, addMonths, addYears, isAfter, isBefore } from 'date-fns';
import { parseLocalDate, formatLocalDate, getTodayString } from './dateUtils';

export interface RecurringGenerationOptions {
  startDate: string;
  endDate?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  includeStartDate?: boolean;
}

export function generateRecurringDates(options: RecurringGenerationOptions): string[] {
  const { startDate, endDate = getTodayString(), frequency, includeStartDate = true } = options;
  
  // Parse dates consistently to avoid timezone issues
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const dates: string[] = [];
  
  if (includeStartDate) {
    dates.push(formatLocalDate(start));
  }
  
  let currentDate = new Date(start);
  
  while (true) {
    switch (frequency) {
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'quarterly':
        currentDate = addMonths(currentDate, 3);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, 1);
        break;
    }
    
    if (isAfter(currentDate, end)) {
      break;
    }
    
    dates.push(formatLocalDate(currentDate));
  }
  
  return dates;
}

export function generateHistoricalIncomeEntries(
  income: Income,
  endDate: string = getTodayString()
): Income[] {
  if (!income.isRecurring || !income.frequency) {
    return [income];
  }

  const dates = generateRecurringDates({
    startDate: income.date,
    endDate,
    frequency: income.frequency,
    includeStartDate: true,
  });

  return dates.map((date, index) => ({
    ...income,
    id: `${income.id}-recurring-${index}`,
    date,
    description: index === 0 ? income.description : `${income.description} (Recurring)`,
    createdAt: income.createdAt,
    updatedAt: new Date().toISOString(),
  }));
}

export function generateHistoricalSubscriptionExpenses(
  subscription: Subscription,
  endDate: string = getTodayString()
): Expense[] {
  const dates = generateRecurringDates({
    startDate: subscription.startDate,
    endDate: subscription.endDate || endDate,
    frequency: subscription.frequency,
    includeStartDate: true,
  });

  return dates.map((date, index) => ({
    id: `sub-${subscription.id}-${date}`,
    amount: subscription.amount,
    category: subscription.category as any,
    description: `${subscription.name} (Subscription)`,
    date,
    createdAt: subscription.createdAt,
    updatedAt: new Date().toISOString(),
  }));
}

export function calculateRecurringStats(entries: (Income | Expense)[], frequency: string) {
  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyEquivalent = calculateMonthlyEquivalent(totalAmount, frequency, entries.length);
  
  return {
    totalEntries: entries.length,
    totalAmount,
    monthlyEquivalent,
    averagePerEntry: totalAmount / entries.length,
    dateRange: {
      start: entries[0]?.date,
      end: entries[entries.length - 1]?.date,
    },
  };
}

function calculateMonthlyEquivalent(totalAmount: number, frequency: string, entryCount: number): number {
  const perEntry = totalAmount / entryCount;
  
  switch (frequency) {
    case 'weekly':
      return perEntry * 4.33; // Average weeks per month
    case 'biweekly':
      return perEntry * 2.17; // Average biweekly periods per month
    case 'monthly':
      return perEntry;
    case 'quarterly':
      return perEntry / 3;
    case 'yearly':
      return perEntry / 12;
    default:
      return perEntry;
  }
}

export function validateRecurringEntry(entry: Income | Subscription): string[] {
  const errors: string[] = [];
  
  if (!entry.isRecurring && 'isRecurring' in entry) {
    return errors; // Not recurring, no validation needed
  }
  
  if ('frequency' in entry && entry.frequency) {
    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(entry.frequency)) {
      errors.push('Invalid frequency specified');
    }
  } else {
    errors.push('Frequency is required for recurring entries');
  }
  
  const entryDate = parseLocalDate(entry.date || entry.startDate);
  const today = new Date();
  
  if (isAfter(entryDate, today)) {
    errors.push('Start date cannot be in the future for historical generation');
  }
  
  // Check if the date is too far in the past (more than 10 years)
  const tenYearsAgo = addYears(today, -10);
  if (isBefore(entryDate, tenYearsAgo)) {
    errors.push('Start date cannot be more than 10 years in the past');
  }
  
  return errors;
}

export function previewRecurringGeneration(
  entry: Income | Subscription,
  endDate?: string
): {
  totalEntries: number;
  dateRange: { start: string; end: string };
  sampleDates: string[];
  estimatedTotal: number;
} {
  const startDate = 'date' in entry ? entry.date : entry.startDate;
  const frequency = entry.frequency!;
  const amount = entry.amount;
  
  const dates = generateRecurringDates({
    startDate,
    endDate: endDate || getTodayString(),
    frequency,
    includeStartDate: true,
  });
  
  return {
    totalEntries: dates.length,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    sampleDates: dates.slice(0, 5), // First 5 dates as preview
    estimatedTotal: dates.length * amount,
  };
}
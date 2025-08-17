import { Income, Expense } from '@/types/expense';
import { Subscription } from '@/types/financial';
import { storage } from '@/lib/storage';
import { financialStorage } from '@/lib/financialStorage';
import { generateHistoricalIncomeEntries, generateHistoricalSubscriptionExpenses } from '@/lib/recurringGenerator';
import { getTodayString } from '@/lib/dateUtils';

export interface BulkGenerationResult {
  success: boolean;
  generated: {
    incomeEntries: number;
    expenseEntries: number;
  };
  errors: string[];
  totalEntriesAdded: number;
}

export interface BulkGenerationOptions {
  endDate?: string;
  dryRun?: boolean;
  skipExisting?: boolean;
}

export async function generateAllHistoricalEntries(
  options: BulkGenerationOptions = {}
): Promise<BulkGenerationResult> {
  const { endDate = getTodayString(), dryRun = false, skipExisting = true } = options;
  
  const result: BulkGenerationResult = {
    success: false,
    generated: { incomeEntries: 0, expenseEntries: 0 },
    errors: [],
    totalEntriesAdded: 0,
  };

  try {
    // Get all existing data
    const existingIncomes = storage.getIncome();
    const existingExpenses = storage.getExpenses();
    const existingSubscriptions = financialStorage.getSubscriptions();

    // Filter for recurring items that started in the past
    const today = new Date();
    const recurringIncomes = existingIncomes.filter(income => 
      income.isRecurring && 
      new Date(income.date) < today &&
      income.frequency
    );

    const historicalSubscriptions = existingSubscriptions.filter(subscription =>
      new Date(subscription.startDate) < today &&
      subscription.frequency
    );

    // Generate historical income entries
    for (const income of recurringIncomes) {
      try {
        const historicalEntries = generateHistoricalIncomeEntries(income, endDate);
        
        // Filter out entries that already exist if skipExisting is true
        const newEntries = skipExisting 
          ? historicalEntries.filter(entry => 
              !existingIncomes.some(existing => 
                existing.date === entry.date && 
                existing.description === entry.description &&
                existing.amount === entry.amount
              )
            )
          : historicalEntries;

        if (!dryRun) {
          newEntries.forEach((entry, index) => {
            const entryWithUniqueId = {
              ...entry,
              id: `${income.id}-bulk-${index}-${Date.now()}`,
            };
            storage.addIncome(entryWithUniqueId);
          });
        }

        result.generated.incomeEntries += newEntries.length;
      } catch (error) {
        result.errors.push(`Error generating income entries for ${income.description}: ${error}`);
      }
    }

    // Generate historical subscription expenses
    for (const subscription of historicalSubscriptions) {
      try {
        const historicalExpenses = generateHistoricalSubscriptionExpenses(subscription, endDate);
        
        // Filter out expenses that already exist if skipExisting is true
        const newExpenses = skipExisting
          ? historicalExpenses.filter(expense =>
              !existingExpenses.some(existing =>
                existing.date === expense.date &&
                existing.description === expense.description &&
                existing.amount === expense.amount
              )
            )
          : historicalExpenses;

        if (!dryRun) {
          newExpenses.forEach(expense => {
            storage.addExpense(expense);
          });
        }

        result.generated.expenseEntries += newExpenses.length;
      } catch (error) {
        result.errors.push(`Error generating expenses for ${subscription.name}: ${error}`);
      }
    }

    result.totalEntriesAdded = result.generated.incomeEntries + result.generated.expenseEntries;
    result.success = result.errors.length === 0;

    return result;
  } catch (error) {
    result.errors.push(`Fatal error during bulk generation: ${error}`);
    return result;
  }
}

export function analyzeRecurringEntries(): {
  recurringIncomes: Income[];
  historicalSubscriptions: Subscription[];
  potentialEntries: {
    income: number;
    expenses: number;
    total: number;
  };
} {
  const existingIncomes = storage.getIncome();
  const existingSubscriptions = financialStorage.getSubscriptions();
  const today = new Date();

  const recurringIncomes = existingIncomes.filter(income => 
    income.isRecurring && 
    new Date(income.date) < today &&
    income.frequency
  );

  const historicalSubscriptions = existingSubscriptions.filter(subscription =>
    new Date(subscription.startDate) < today &&
    subscription.frequency
  );

  // Estimate potential entries
  let potentialIncomeEntries = 0;
  let potentialExpenseEntries = 0;

  recurringIncomes.forEach(income => {
    try {
      const entries = generateHistoricalIncomeEntries(income);
      potentialIncomeEntries += entries.length;
    } catch (error) {
      // Ignore estimation errors
    }
  });

  historicalSubscriptions.forEach(subscription => {
    try {
      const entries = generateHistoricalSubscriptionExpenses(subscription);
      potentialExpenseEntries += entries.length;
    } catch (error) {
      // Ignore estimation errors
    }
  });

  return {
    recurringIncomes,
    historicalSubscriptions,
    potentialEntries: {
      income: potentialIncomeEntries,
      expenses: potentialExpenseEntries,
      total: potentialIncomeEntries + potentialExpenseEntries,
    },
  };
}

export function validateBulkGeneration(): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const analysis = analyzeRecurringEntries();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check for excessive entries
  if (analysis.potentialEntries.total > 1000) {
    warnings.push(`This will generate ${analysis.potentialEntries.total} entries, which may impact performance.`);
    recommendations.push('Consider filtering by date range or reviewing your recurring entries.');
  }

  // Check for very old start dates
  const veryOldThreshold = new Date();
  veryOldThreshold.setFullYear(veryOldThreshold.getFullYear() - 5);

  const veryOldEntries = [
    ...analysis.recurringIncomes.filter(income => new Date(income.date) < veryOldThreshold),
    ...analysis.historicalSubscriptions.filter(sub => new Date(sub.startDate) < veryOldThreshold),
  ];

  if (veryOldEntries.length > 0) {
    warnings.push(`${veryOldEntries.length} entries have start dates more than 5 years ago.`);
    recommendations.push('Consider updating start dates to more recent periods if historical data is not needed.');
  }

  // Check for inactive subscriptions
  const inactiveSubscriptions = analysis.historicalSubscriptions.filter(sub => !sub.isActive);
  if (inactiveSubscriptions.length > 0) {
    warnings.push(`${inactiveSubscriptions.length} inactive subscriptions will generate expenses.`);
    recommendations.push('Review inactive subscriptions before generating historical entries.');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
  };
}

export async function cleanupDuplicateEntries(): Promise<{
  duplicatesRemoved: { income: number; expenses: number };
  success: boolean;
  errors: string[];
}> {
  const result = {
    duplicatesRemoved: { income: 0, expenses: 0 },
    success: false,
    errors: [] as string[],
  };

  try {
    // Clean up duplicate income entries
    const incomes = storage.getIncome();
    const uniqueIncomes: Income[] = [];
    const seenIncomes = new Set<string>();

    incomes.forEach(income => {
      const key = `${income.date}-${income.description}-${income.amount}`;
      if (!seenIncomes.has(key)) {
        seenIncomes.add(key);
        uniqueIncomes.push(income);
      } else {
        result.duplicatesRemoved.income++;
      }
    });

    if (result.duplicatesRemoved.income > 0) {
      storage.saveIncome(uniqueIncomes);
    }

    // Clean up duplicate expense entries
    const expenses = storage.getExpenses();
    const uniqueExpenses: Expense[] = [];
    const seenExpenses = new Set<string>();

    expenses.forEach(expense => {
      const key = `${expense.date}-${expense.description}-${expense.amount}`;
      if (!seenExpenses.has(key)) {
        seenExpenses.add(key);
        uniqueExpenses.push(expense);
      } else {
        result.duplicatesRemoved.expenses++;
      }
    });

    if (result.duplicatesRemoved.expenses > 0) {
      storage.saveExpenses(uniqueExpenses);
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(`Error cleaning up duplicates: ${error}`);
    return result;
  }
}
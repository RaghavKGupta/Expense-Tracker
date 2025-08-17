import { Expense, Income, CustomCategory } from '@/types/expense';
import { createCombinedCSV, downloadCSV } from './csvUtils';

// In-memory storage for the current session
let currentExpenses: Expense[] = [];
let currentIncomes: Income[] = [];
let currentCustomCategories: CustomCategory[] = [];
let isDataLoaded = false;
let sessionChanges = 0;

// Storage event listeners
const storageListeners: (() => void)[] = [];

export const csvStorage = {
  // Initialize data from CSV upload or localStorage migration
  initializeData: (expenses: Expense[], incomes: Income[], customCategories: CustomCategory[] = []) => {
    currentExpenses = [...expenses];
    currentIncomes = [...incomes];
    currentCustomCategories = [...customCategories];
    isDataLoaded = true;
    sessionChanges = 0;
    notifyListeners();
  },

  // Check if data has been loaded
  isDataLoaded: () => isDataLoaded,

  // Get current session changes count
  getSessionChanges: () => sessionChanges,

  // Expenses
  getExpenses: (): Expense[] => {
    return [...currentExpenses];
  },

  addExpense: (expense: Expense): void => {
    currentExpenses.push(expense);
    sessionChanges++;
    notifyListeners();
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('expenseAdded', { detail: expense }));
    }
  },

  updateExpense: (updatedExpense: Expense): void => {
    const index = currentExpenses.findIndex(exp => exp.id === updatedExpense.id);
    if (index !== -1) {
      currentExpenses[index] = updatedExpense;
      sessionChanges++;
      notifyListeners();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expenseUpdated', { detail: updatedExpense }));
      }
    }
  },

  deleteExpense: (id: string): void => {
    const originalLength = currentExpenses.length;
    currentExpenses = currentExpenses.filter(exp => exp.id !== id);
    
    if (currentExpenses.length < originalLength) {
      sessionChanges++;
      notifyListeners();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expenseDeleted', { detail: { id } }));
      }
    }
  },

  // Income
  getIncome: (): Income[] => {
    return [...currentIncomes];
  },

  addIncome: (income: Income): void => {
    currentIncomes.push(income);
    sessionChanges++;
    notifyListeners();
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('incomeAdded', { detail: income }));
    }
  },

  updateIncome: (updatedIncome: Income): void => {
    const index = currentIncomes.findIndex(inc => inc.id === updatedIncome.id);
    if (index !== -1) {
      currentIncomes[index] = updatedIncome;
      sessionChanges++;
      notifyListeners();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('incomeUpdated', { detail: updatedIncome }));
      }
    }
  },

  deleteIncome: (id: string): void => {
    const originalLength = currentIncomes.length;
    currentIncomes = currentIncomes.filter(inc => inc.id !== id);
    
    if (currentIncomes.length < originalLength) {
      sessionChanges++;
      notifyListeners();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('incomeDeleted', { detail: { id } }));
      }
    }
  },

  // Custom Categories
  getCustomCategories: (): CustomCategory[] => {
    return [...currentCustomCategories];
  },

  addCustomCategory: (category: CustomCategory): void => {
    currentCustomCategories.push(category);
    sessionChanges++;
    notifyListeners();
  },

  updateCustomCategory: (updatedCategory: CustomCategory): void => {
    const index = currentCustomCategories.findIndex(cat => cat.id === updatedCategory.id);
    if (index !== -1) {
      currentCustomCategories[index] = updatedCategory;
      sessionChanges++;
      notifyListeners();
    }
  },

  deleteCustomCategory: (id: string): void => {
    const originalLength = currentCustomCategories.length;
    currentCustomCategories = currentCustomCategories.filter(cat => cat.id !== id);
    
    if (currentCustomCategories.length < originalLength) {
      sessionChanges++;
      notifyListeners();
    }
  },

  // Export current data to CSV
  exportToCSV: (filename?: string): void => {
    const csvContent = createCombinedCSV(currentExpenses, currentIncomes);
    const defaultFilename = `expense-data-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename || defaultFilename);
  },

  // Get export data without downloading
  getExportData: () => {
    return createCombinedCSV(currentExpenses, currentIncomes);
  },

  // Clear all data (for new session)
  clearData: (): void => {
    currentExpenses = [];
    currentIncomes = [];
    currentCustomCategories = [];
    isDataLoaded = false;
    sessionChanges = 0;
    notifyListeners();
  },

  // Migration from localStorage
  migrateFromLocalStorage: (): { expenses: Expense[]; incomes: Income[]; customCategories: CustomCategory[] } => {
    if (typeof window === 'undefined') {
      return { expenses: [], incomes: [], customCategories: [] };
    }

    try {
      // Get expenses from localStorage
      const expenseData = localStorage.getItem('expense-tracker-data');
      const expenses = expenseData ? JSON.parse(expenseData) : [];

      // Get income from localStorage
      const incomeData = localStorage.getItem('expense-tracker-income');
      const incomes = incomeData ? JSON.parse(incomeData) : [];

      // Get custom categories from localStorage
      const categoryData = localStorage.getItem('expense-tracker-custom-categories');
      const customCategories = categoryData ? JSON.parse(categoryData) : [];

      return { expenses, incomes, customCategories };
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return { expenses: [], incomes: [], customCategories: [] };
    }
  },

  // Clear localStorage after migration
  clearLocalStorage: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('expense-tracker-data');
      localStorage.removeItem('expense-tracker-income');
      localStorage.removeItem('expense-tracker-custom-categories');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Subscribe to storage changes
  subscribe: (listener: () => void): () => void => {
    storageListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = storageListeners.indexOf(listener);
      if (index > -1) {
        storageListeners.splice(index, 1);
      }
    };
  },

  // Auto-save reminder
  shouldShowSaveReminder: (): boolean => {
    return sessionChanges > 0;
  },

  // Reset session changes (after export)
  resetSessionChanges: (): void => {
    sessionChanges = 0;
  }
};

// Notify all listeners of storage changes
function notifyListeners() {
  storageListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Error in storage listener:', error);
    }
  });
}

// Auto-export on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (csvStorage.shouldShowSaveReminder()) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return 'You have unsaved changes. Are you sure you want to leave?';
    }
  });
}
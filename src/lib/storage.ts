import { Expense, Income, CustomCategory } from '@/types/expense';

const STORAGE_KEY = 'expense-tracker-data';
const INCOME_STORAGE_KEY = 'expense-tracker-income';
const CUSTOM_CATEGORIES_KEY = 'expense-tracker-custom-categories';

export const storage = {
  getExpenses: (): Expense[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading expenses from localStorage:', error);
      return [];
    }
  },

  saveExpenses: (expenses: Expense[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
  },

  addExpense: (expense: Expense): void => {
    const expenses = storage.getExpenses();
    expenses.push(expense);
    storage.saveExpenses(expenses);
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('expenseAdded', { detail: expense }));
    }
  },

  updateExpense: (updatedExpense: Expense): void => {
    const expenses = storage.getExpenses();
    const index = expenses.findIndex(exp => exp.id === updatedExpense.id);
    if (index !== -1) {
      expenses[index] = updatedExpense;
      storage.saveExpenses(expenses);
      
      // Dispatch custom event to notify components of data change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expenseUpdated', { detail: updatedExpense }));
      }
    }
  },

  deleteExpense: (id: string): void => {
    const expenses = storage.getExpenses();
    const filteredExpenses = expenses.filter(exp => exp.id !== id);
    storage.saveExpenses(filteredExpenses);
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('expenseDeleted', { detail: { id } }));
    }
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  // Income methods
  getIncome: (): Income[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(INCOME_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading income from localStorage:', error);
      return [];
    }
  },

  saveIncome: (income: Income[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Ensure we only serialize plain objects without circular references
      const cleanIncome = income.map(item => ({
        id: item.id,
        amount: item.amount,
        category: item.category,
        description: item.description,
        date: item.date,
        isRecurring: item.isRecurring,
        frequency: item.frequency,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(cleanIncome));
    } catch (error) {
      console.error('Error saving income to localStorage:', error);
      // If JSON.stringify fails due to circular references, try to save a simplified version
      try {
        const simpleIncome = income.map(item => ({
          id: String(item.id || ''),
          amount: Number(item.amount || 0),
          category: String(item.category || ''),
          description: String(item.description || ''),
          date: String(item.date || ''),
          isRecurring: Boolean(item.isRecurring),
          frequency: String(item.frequency || 'monthly'),
          createdAt: String(item.createdAt || ''),
          updatedAt: String(item.updatedAt || '')
        }));
        localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(simpleIncome));
      } catch (fallbackError) {
        console.error('Failed to save income even with fallback:', fallbackError);
      }
    }
  },

  addIncome: (income: Income): void => {
    const incomeList = storage.getIncome();
    incomeList.push(income);
    storage.saveIncome(incomeList);
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('incomeAdded', { detail: income }));
    }
  },

  updateIncome: (updatedIncome: Income): void => {
    const incomeList = storage.getIncome();
    const index = incomeList.findIndex(inc => inc.id === updatedIncome.id);
    if (index !== -1) {
      incomeList[index] = updatedIncome;
      storage.saveIncome(incomeList);
      
      // Dispatch custom event to notify components of data change
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('incomeUpdated', { detail: updatedIncome }));
      }
    }
  },

  deleteIncome: (id: string): void => {
    const incomeList = storage.getIncome();
    const filteredIncome = incomeList.filter(inc => inc.id !== id);
    storage.saveIncome(filteredIncome);
    
    // Dispatch custom event to notify components of data change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('incomeDeleted', { detail: { id } }));
    }
  },

  // Custom categories methods
  getCustomCategories: (): CustomCategory[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading custom categories from localStorage:', error);
      return [];
    }
  },

  saveCustomCategories: (categories: CustomCategory[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving custom categories to localStorage:', error);
    }
  },

  addCustomCategory: (category: CustomCategory): void => {
    const categories = storage.getCustomCategories();
    categories.push(category);
    storage.saveCustomCategories(categories);
  },

  updateCustomCategory: (updatedCategory: CustomCategory): void => {
    const categories = storage.getCustomCategories();
    const index = categories.findIndex(cat => cat.id === updatedCategory.id);
    if (index !== -1) {
      categories[index] = updatedCategory;
      storage.saveCustomCategories(categories);
    }
  },

  deleteCustomCategory: (id: string): void => {
    const categories = storage.getCustomCategories();
    const filteredCategories = categories.filter(cat => cat.id !== id);
    storage.saveCustomCategories(filteredCategories);
  }
};
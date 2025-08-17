import { storage } from '../storage';
import { Expense, Income, CustomCategory } from '@/types/expense';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

(global as any).localStorage = mockLocalStorage;

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Expenses', () => {
    const mockExpense: Expense = {
      id: 'test-expense-1',
      amount: 100,
      category: 'Food',
      description: 'Test expense',
      date: '2024-01-01',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    describe('getExpenses', () => {
      it('should return empty array when no data in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const result = storage.getExpenses();
        expect(result).toEqual([]);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('expense-tracker-data');
      });

      it('should return parsed expenses from localStorage', () => {
        const expenses = [mockExpense];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
        const result = storage.getExpenses();
        expect(result).toEqual(expenses);
      });

      it('should return empty array on JSON parse error', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = storage.getExpenses();
        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('saveExpenses', () => {
      it('should save expenses to localStorage', () => {
        const expenses = [mockExpense];
        storage.saveExpenses(expenses);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-data',
          JSON.stringify(expenses)
        );
      });

      it('should handle save errors gracefully', () => {
        const expenses = [mockExpense];
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage error');
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        expect(() => storage.saveExpenses(expenses)).not.toThrow();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('addExpense', () => {
      it('should add expense to existing list', () => {
        const existingExpenses = [mockExpense];
        const newExpense = { ...mockExpense, id: 'test-expense-2' };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingExpenses));
        storage.addExpense(newExpense);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-data',
          JSON.stringify([...existingExpenses, newExpense])
        );
      });
    });

    describe('updateExpense', () => {
      it('should update existing expense', () => {
        const expenses = [mockExpense];
        const updatedExpense = { ...mockExpense, amount: 200 };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
        storage.updateExpense(updatedExpense);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-data',
          JSON.stringify([updatedExpense])
        );
      });

      it('should not update if expense not found', () => {
        const expenses = [mockExpense];
        const nonExistentExpense = { ...mockExpense, id: 'non-existent' };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
        storage.updateExpense(nonExistentExpense);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-data',
          JSON.stringify(expenses)
        );
      });
    });

    describe('deleteExpense', () => {
      it('should delete expense by id', () => {
        const expenses = [mockExpense, { ...mockExpense, id: 'test-expense-2' }];
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expenses));
        storage.deleteExpense('test-expense-1');
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-data',
          JSON.stringify([{ ...mockExpense, id: 'test-expense-2' }])
        );
      });
    });
  });

  describe('Income', () => {
    const mockIncome: Income = {
      id: 'test-income-1',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-01-01',
      isRecurring: true,
      frequency: 'monthly',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    describe('getIncome', () => {
      it('should return empty array when no data in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const result = storage.getIncome();
        expect(result).toEqual([]);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('expense-tracker-income');
      });

      it('should return parsed income from localStorage', () => {
        const income = [mockIncome];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(income));
        const result = storage.getIncome();
        expect(result).toEqual(income);
      });
    });

    describe('saveIncome', () => {
      it('should save income to localStorage with data cleaning', () => {
        const income = [mockIncome];
        storage.saveIncome(income);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-income',
          expect.any(String)
        );
        
        const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(savedData[0]).toEqual(mockIncome);
      });

      it('should handle circular references with fallback', () => {
        const circularIncome = { ...mockIncome };
        (circularIncome as any).circular = circularIncome;
        
        // Mock JSON.stringify to throw on first call (circular ref) but succeed on second
        let callCount = 0;
        const originalStringify = JSON.stringify;
        jest.spyOn(JSON, 'stringify').mockImplementation((...args) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Converting circular structure to JSON');
          }
          return originalStringify(...args);
        });
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        storage.saveIncome([circularIncome]);
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
        jest.restoreAllMocks();
      });
    });

    describe('addIncome', () => {
      it('should add income to existing list', () => {
        const existingIncome = [mockIncome];
        const newIncome = { ...mockIncome, id: 'test-income-2' };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingIncome));
        storage.addIncome(newIncome);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Categories', () => {
    const mockCategory: CustomCategory = {
      id: 'test-category-1',
      name: 'Test Category',
      icon: '🎯',
      color: '#ff0000',
      createdAt: '2024-01-01T00:00:00Z',
    };

    describe('getCustomCategories', () => {
      it('should return empty array when no data in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        const result = storage.getCustomCategories();
        expect(result).toEqual([]);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('expense-tracker-custom-categories');
      });

      it('should return parsed categories from localStorage', () => {
        const categories = [mockCategory];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(categories));
        const result = storage.getCustomCategories();
        expect(result).toEqual(categories);
      });
    });

    describe('addCustomCategory', () => {
      it('should add category to existing list', () => {
        const existingCategories = [mockCategory];
        const newCategory = { ...mockCategory, id: 'test-category-2' };
        
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCategories));
        storage.addCustomCategory(newCategory);
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'expense-tracker-custom-categories',
          JSON.stringify([...existingCategories, newCategory])
        );
      });
    });
  });

  describe('clearAll', () => {
    it('should remove expenses from localStorage', () => {
      storage.clearAll();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expense-tracker-data');
    });
  });
});
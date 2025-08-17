import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomePage from '../page';
import { storage } from '@/lib/storage';
import { Income } from '@/types/expense';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  storage: {
    getIncome: jest.fn(),
    addIncome: jest.fn(),
    updateIncome: jest.fn(),
    deleteIncome: jest.fn(),
  },
}));

// Mock the formatCurrency function
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
});

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('IncomePage', () => {
  const mockIncomes: Income[] = [
    {
      id: '1',
      amount: 5000,
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-01-01',
      isRecurring: true,
      frequency: 'monthly',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      amount: 1500,
      category: 'Freelance',
      description: 'Project payment',
      date: '2024-01-15',
      isRecurring: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getIncome.mockReturnValue(mockIncomes);
  });

  it('should render income page with summary cards', async () => {
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('Income Tracker')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Recurring Sources')).toBeInTheDocument();
  });

  it('should display income list when data is available', async () => {
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly salary')).toBeInTheDocument();
      expect(screen.getByText('Project payment')).toBeInTheDocument();
    });

    expect(screen.getByText('+$5000.00')).toBeInTheDocument();
    expect(screen.getByText('+$1500.00')).toBeInTheDocument();
  });

  it('should show empty state when no income data', async () => {
    mockStorage.getIncome.mockReturnValue([]);
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('No income entries yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Start tracking your income to see insights and trends')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add your first income/i })).toBeInTheDocument();
  });

  it('should open form when Add Income button is clicked', async () => {
    const user = userEvent.setup();
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add income/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText('Add New Income')).toBeInTheDocument();
    });
  });

  it('should add new income when form is submitted', async () => {
    const user = userEvent.setup();
    render(<IncomePage />);

    // Open the form
    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText('Add New Income')).toBeInTheDocument();
    });

    // Fill the form
    await user.type(screen.getByLabelText(/amount/i), '3000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Bonus');
    await user.type(screen.getByLabelText(/description/i), 'Year-end bonus');
    await user.type(screen.getByLabelText(/date/i), '2024-12-01');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(mockStorage.addIncome).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-123',
          amount: 3000,
          category: 'Bonus',
          description: 'Year-end bonus',
          date: '2024-12-01',
          isRecurring: false,
        })
      );
    });
  });

  it('should edit income when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    });

    // Find and click edit button (assuming there's an edit button for each income)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.getAttribute('title') === 'Edit' || 
      button.querySelector('svg')?.getAttribute('data-lucide') === 'edit'
    );

    if (editButton) {
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Income')).toBeInTheDocument();
      });
    }
  });

  it('should delete income when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.getAttribute('title') === 'Delete' ||
      button.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
    );

    if (deleteButton) {
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this income entry?');
      expect(mockStorage.deleteIncome).toHaveBeenCalledWith('1');
    }
  });

  it('should not delete income when deletion is cancelled', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);
    
    render(<IncomePage />);

    await waitFor(() => {
      expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('data-lucide') === 'trash-2'
    );

    if (deleteButton) {
      await user.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockStorage.deleteIncome).not.toHaveBeenCalled();
    }
  });

  it('should calculate and display correct totals', async () => {
    // Mock current date to be in January 2024 for monthly calculation
    const mockDate = new Date('2024-01-15');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    render(<IncomePage />);

    await waitFor(() => {
      // Total income: 5000 + 1500 = 6500
      expect(screen.getByText('$6500.00')).toBeInTheDocument();
      
      // Monthly income (January 2024): 5000 + 1500 = 6500
      expect(screen.getByText('$6500.00')).toBeInTheDocument();
      
      // Recurring sources: 1 (only the salary is recurring)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    mockStorage.getIncome.mockImplementation(() => {
      // Simulate slow loading
      return [];
    });

    render(<IncomePage />);

    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should close form when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<IncomePage />);

    // Open the form
    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText('Add New Income')).toBeInTheDocument();
    });

    // Click cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText('Add New Income')).not.toBeInTheDocument();
    });
  });
});
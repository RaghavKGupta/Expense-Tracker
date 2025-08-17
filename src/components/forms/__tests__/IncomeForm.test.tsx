import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomeForm from '../IncomeForm';
import { IncomeFormData } from '@/types/expense';

describe('IncomeForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  it('should render all form fields', () => {
    render(<IncomeForm {...defaultProps} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/this is recurring income/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add income/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show frequency field when recurring is checked', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    const recurringCheckbox = screen.getByLabelText(/this is recurring income/i);
    await user.click(recurringCheckbox);

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
  });

  it('should hide frequency field when recurring is unchecked', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    const recurringCheckbox = screen.getByLabelText(/this is recurring income/i);
    
    // Check it first
    await user.click(recurringCheckbox);
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();

    // Uncheck it
    await user.click(recurringCheckbox);
    expect(screen.queryByLabelText(/frequency/i)).not.toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    const formData: IncomeFormData = {
      amount: '5000',
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-01-01',
      isRecurring: true,
      frequency: 'monthly',
    };

    await user.type(screen.getByLabelText(/amount/i), formData.amount);
    await user.selectOptions(screen.getByLabelText(/category/i), formData.category);
    await user.type(screen.getByLabelText(/description/i), formData.description);
    await user.type(screen.getByLabelText(/date/i), formData.date);
    await user.click(screen.getByLabelText(/this is recurring income/i));
    await user.selectOptions(screen.getByLabelText(/frequency/i), formData.frequency);

    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(formData);
    });
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid amount', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/amount/i), '-100');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount must be a positive number/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should populate form with initial data when provided', () => {
    const initialData: Partial<IncomeFormData> = {
      amount: '3000',
      category: 'Freelance',
      description: 'Project payment',
      date: '2024-02-01',
      isRecurring: false,
    };

    render(<IncomeForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Freelance')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Project payment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
    expect(screen.getByLabelText(/this is recurring income/i)).not.toBeChecked();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    // Trigger validation errors
    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });

    // Start typing in amount field
    await user.type(screen.getByLabelText(/amount/i), '100');

    await waitFor(() => {
      expect(screen.queryByText(/amount is required/i)).not.toBeInTheDocument();
    });
  });

  it('should render all income categories in select', () => {
    render(<IncomeForm {...defaultProps} />);

    const categorySelect = screen.getByLabelText(/category/i);
    const expectedCategories = ['Salary', 'Freelance', 'Investment', 'Rental', 'Business', 'Gift', 'Bonus', 'Other'];

    expectedCategories.forEach(category => {
      expect(screen.getByRole('option', { name: category })).toBeInTheDocument();
    });
  });

  it('should render all frequency options when recurring is enabled', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    await user.click(screen.getByLabelText(/this is recurring income/i));

    const frequencySelect = screen.getByLabelText(/frequency/i);
    const expectedFrequencies = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Yearly'];

    expectedFrequencies.forEach(frequency => {
      expect(screen.getByRole('option', { name: frequency })).toBeInTheDocument();
    });
  });

  it('should show loading state when isLoading is true', () => {
    render(<IncomeForm {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /adding.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adding.../i })).toBeDisabled();
  });

  it('should handle form submission with non-recurring income', async () => {
    const user = userEvent.setup();
    render(<IncomeForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/amount/i), '1500');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Gift');
    await user.type(screen.getByLabelText(/description/i), 'Birthday gift');
    await user.type(screen.getByLabelText(/date/i), '2024-03-01');

    await user.click(screen.getByRole('button', { name: /add income/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: '1500',
        category: 'Gift',
        description: 'Birthday gift',
        date: '2024-03-01',
        isRecurring: false,
        frequency: 'monthly', // Default frequency
      });
    });
  });
});
'use client';

import { useState } from 'react';
import { IncomeFormData, IncomeCategory } from '@/types/expense';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { previewRecurringGeneration, validateRecurringEntry } from '@/lib/recurringGenerator';
import { formatCurrency } from '@/lib/utils';
import { getTodayString } from '@/lib/dateUtils';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';

interface IncomeFormProps {
  onSubmit: (data: IncomeFormData & { generateHistorical?: boolean }) => void;
  onCancel?: () => void;
  initialData?: Partial<IncomeFormData>;
  isLoading?: boolean;
}

const incomeCategories: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Investment',
  'Rental',
  'Business',
  'Gift',
  'Bonus',
  'Other'
];

const frequencyOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

export default function IncomeForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isLoading = false 
}: IncomeFormProps) {
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: initialData?.amount || '',
    category: initialData?.category || 'Salary',
    description: initialData?.description || '',
    date: initialData?.date || getTodayString(),
    isRecurring: initialData?.isRecurring || false,
    frequency: initialData?.frequency || 'monthly'
  });

  const [errors, setErrors] = useState<Partial<IncomeFormData>>({});
  const [generateHistorical, setGenerateHistorical] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<IncomeFormData> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({ ...formData, generateHistorical });
    }
  };

  const getRecurringPreview = () => {
    if (!formData.isRecurring || !formData.amount || !formData.frequency) return null;
    
    try {
      const mockIncome = {
        id: 'preview',
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        isRecurring: formData.isRecurring,
        frequency: formData.frequency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return previewRecurringGeneration(mockIncome);
    } catch (error) {
      return null;
    }
  };

  const preview = getRecurringPreview();
  const isPastDate = new Date(formData.date) < new Date();
  const shouldShowHistoricalOption = formData.isRecurring && isPastDate;

  const handleInputChange = (field: keyof IncomeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
            Amount *
          </label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
            Category *
          </label>
          <Select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value as IncomeCategory)}
            error={errors.category}
          >
            {incomeCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
          Description *
        </label>
        <Input
          id="description"
          type="text"
          placeholder="Income description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
          Date *
        </label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          error={errors.date}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            id="isRecurring"
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-slate-300">
            This is recurring income
          </label>
        </div>

        {formData.isRecurring && (
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-slate-300 mb-2">
              Frequency
            </label>
            <Select
              value={formData.frequency || 'monthly'}
              onChange={(e) => handleInputChange('frequency', e.target.value)}
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Historical Generation Section */}
      {shouldShowHistoricalOption && (
        <div className="border-t border-slate-700 pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                id="generateHistorical"
                type="checkbox"
                checked={generateHistorical}
                onChange={(e) => setGenerateHistorical(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="generateHistorical" className="text-sm font-medium text-slate-300 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                Generate historical entries from start date to today
              </label>
            </div>

            {generateHistorical && preview && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center mb-3">
                  <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                  <h4 className="text-sm font-semibold text-white">Preview: Historical Entries</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Total Entries:</span>
                    <span className="text-white font-medium ml-2">{preview.totalEntries}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="text-green-400 font-medium ml-2">{formatCurrency(preview.estimatedTotal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Date Range:</span>
                    <span className="text-white font-medium ml-2">
                      {preview.dateRange.start} to {preview.dateRange.end}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Frequency:</span>
                    <span className="text-white font-medium ml-2 capitalize">{formData.frequency}</span>
                  </div>
                </div>

                {preview.totalEntries > 50 && (
                  <div className="mt-3 flex items-center text-amber-400 text-xs">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>This will generate {preview.totalEntries} entries. Consider using a more recent start date if this seems excessive.</span>
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-slate-400 text-xs">Sample dates: </span>
                  <span className="text-slate-300 text-xs">
                    {preview.sampleDates.join(', ')}
                    {preview.totalEntries > 5 && '...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? 'Adding...' : 'Add Income'}
        </Button>
      </div>
    </form>
  );
}
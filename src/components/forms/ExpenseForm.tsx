'use client';

import { useState, useEffect } from 'react';
import { ExpenseFormData, ExpenseCategory, Expense, CustomCategory } from '@/types/expense';
import { csvStorage } from '@/lib/csvStorage';
import { generateId, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categories: ExpenseCategory[] = [
  'Food',
  'Groceries', 
  'Dining Out',
  'Transportation',
  'Gas/Fuel',
  'Public Transport',
  'Entertainment',
  'Shopping',
  'Clothing',
  'Electronics',
  'Bills',
  'Rent/Mortgage',
  'Utilities',
  'Internet/Phone',
  'Insurance',
  'Healthcare',
  'Education',
  'Travel',
  'Fitness/Sports',
  'Personal Care',
  'Gifts',
  'Charity',
  'Business',
  'Other'
];

export default function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: expense?.amount.toString() || '',
    category: (expense?.category as ExpenseCategory) || 'Food',
    description: expense?.description || '',
    date: expense?.date || format(new Date(), 'yyyy-MM-dd'),
  });

  const [errors, setErrors] = useState<Partial<ExpenseFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const loadedCustomCategories = csvStorage.getCustomCategories();
    setCustomCategories(loadedCustomCategories);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<ExpenseFormData> = {};

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const expenseData: Expense = {
        id: expense?.id || generateId(),
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        createdAt: expense?.createdAt || now,
        updatedAt: now,
      };

      if (expense) {
        csvStorage.updateExpense(expenseData);
      } else {
        csvStorage.addExpense(expenseData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setFormData({
          amount: '',
          category: 'Food',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: CustomCategory = {
      id: generateId(),
      name: newCategoryName.trim(),
      createdAt: new Date().toISOString(),
    };
    
    csvStorage.addCustomCategory(newCategory);
    setCustomCategories(prev => [...prev, newCategory]);
    setFormData(prev => ({ ...prev, category: newCategory.name as ExpenseCategory }));
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  // Combine default and custom categories
  const allCategories = [
    ...categories,
    ...customCategories.map(cat => cat.name as ExpenseCategory)
  ];

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={errors.amount}
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as ExpenseCategory)}
                  error={errors.category}
                  options={[]}
                  required
                >
                  <optgroup label="Default Categories" className="bg-slate-800 text-white">
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-slate-800 text-white">
                        {category}
                      </option>
                    ))}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="Custom Categories" className="bg-slate-700 text-white">
                      {customCategories.map((category) => (
                        <option key={category.id} value={category.name} className="bg-slate-700 text-white">
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </Select>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="mt-6 px-3 h-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {showAddCategory && (
              <div className="mt-3 p-4 bg-slate-700 bg-opacity-30 rounded-lg border border-slate-600">
                <div className="flex gap-2">
                  <Input
                    label=""
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter custom category name"
                    className="flex-1"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <Input
            label="Description"
            type="text"
            placeholder="What was this expense for?"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={errors.description}
            required
          />
        </div>

        <div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
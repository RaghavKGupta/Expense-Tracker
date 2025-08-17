'use client';

import { ExpenseFilters, ExpenseCategory } from '@/types/expense';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Search, X } from 'lucide-react';

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
}

const categories: (ExpenseCategory | 'All')[] = ['All', 'Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

export default function ExpenseFiltersComponent({ filters, onFiltersChange }: ExpenseFiltersProps) {
  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Boolean(
    filters.category && filters.category !== 'All' ||
    filters.startDate ||
    filters.endDate ||
    filters.searchTerm
  );

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Input
            label="Search"
            type="text"
            placeholder="Search description..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-10 h-4 w-4 text-slate-400" />
        </div>

        <Select
          label="Category"
          value={filters.category || 'All'}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          options={[]}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

        <Input
          label="From Date"
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
        />

        <Input
          label="To Date"
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
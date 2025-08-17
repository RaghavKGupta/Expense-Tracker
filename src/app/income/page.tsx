'use client';

import { useEffect, useState } from 'react';
import { Income, IncomeFormData } from '@/types/expense';
import { csvStorage } from '@/lib/csvStorage';
import { formatCurrency, formatDate } from '@/lib/utils';
import { generateHistoricalIncomeEntries } from '@/lib/recurringGenerator';
import IncomeForm from '@/components/forms/IncomeForm';
import Button from '@/components/ui/Button';
import { Plus, Edit, Trash2, TrendingUp, Calendar, RefreshCw, History } from 'lucide-react';

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIncomes, setSelectedIncomes] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = () => {
    const loadedIncomes = csvStorage.getIncome();
    setIncomes(loadedIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  };

  const handleSubmit = async (formData: IncomeFormData & { generateHistorical?: boolean }) => {
    setIsSubmitting(true);
    
    try {
      const now = new Date().toISOString();
      
      if (editingIncome) {
        const updatedIncome: Income = {
          ...editingIncome,
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          isRecurring: formData.isRecurring,
          frequency: formData.frequency,
          updatedAt: now
        };
        
        csvStorage.updateIncome(updatedIncome);
      } else {
        const newIncome: Income = {
          id: crypto.randomUUID(),
          amount: Number(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          isRecurring: formData.isRecurring,
          frequency: formData.frequency,
          createdAt: now,
          updatedAt: now
        };
        
        if (formData.generateHistorical && formData.isRecurring) {
          // Generate historical entries
          const historicalEntries = generateHistoricalIncomeEntries(newIncome);
          
          // Save all historical entries
          historicalEntries.forEach((entry, index) => {
            const entryWithUniqueId = {
              ...entry,
              id: index === 0 ? newIncome.id : `${newIncome.id}-${index}`,
            };
            csvStorage.addIncome(entryWithUniqueId);
          });
        } else {
          csvStorage.addIncome(newIncome);
        }
      }
      
      loadIncomes();
      setShowForm(false);
      setEditingIncome(null);
    } catch (error) {
      console.error('Error saving income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      csvStorage.deleteIncome(id);
      loadIncomes();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIncome(null);
  };

  const handleBulkDelete = () => {
    if (selectedIncomes.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedIncomes.size} income entry(ies)?`)) {
      selectedIncomes.forEach(incomeId => {
        csvStorage.deleteIncome(incomeId);
      });
      setSelectedIncomes(new Set());
      setBulkMode(false);
      loadIncomes();
    }
  };

  const handleSelectIncome = (incomeId: string) => {
    const newSelected = new Set(selectedIncomes);
    if (newSelected.has(incomeId)) {
      newSelected.delete(incomeId);
    } else {
      newSelected.add(incomeId);
    }
    setSelectedIncomes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIncomes.size === incomes.length) {
      setSelectedIncomes(new Set());
    } else {
      setSelectedIncomes(new Set(incomes.map(inc => inc.id)));
    }
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const monthlyIncome = incomes
    .filter(income => {
      const incomeDate = new Date(income.date);
      const now = new Date();
      return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, income) => sum + income.amount, 0);

  const recurringIncome = incomes.filter(income => income.isRecurring);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Income Tracker
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Track your income sources and manage your earnings
            </p>
          </div>
          
          <div className="flex gap-3">
            {!bulkMode ? (
              <>
                <Button
                  onClick={() => setBulkMode(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Bulk Delete
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {selectedIncomes.size === incomes.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  variant="danger"
                  disabled={selectedIncomes.size === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete ({selectedIncomes.size})
                </Button>
                <Button
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedIncomes(new Set());
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Total Income</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">This Month</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlyIncome)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-400">Recurring Sources</p>
              <p className="text-2xl font-bold text-white">{recurringIncome.length}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            {editingIncome ? 'Edit Income' : 'Add New Income'}
          </h2>
          <IncomeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingIncome ? {
              amount: editingIncome.amount.toString(),
              category: editingIncome.category as any,
              description: editingIncome.description,
              date: editingIncome.date,
              isRecurring: editingIncome.isRecurring,
              frequency: editingIncome.frequency
            } : undefined}
            isLoading={isSubmitting}
          />
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Income History</h2>
        </div>
        
        {incomes.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">No income entries yet</h3>
            <p className="text-slate-500 mb-6">Start tracking your income to see insights and trends</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Income
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {incomes.map((income) => (
              <div key={income.id} className={`p-6 hover:bg-slate-800/50 transition-colors ${
                selectedIncomes.has(income.id) ? 'bg-blue-900/30' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {bulkMode && (
                      <input
                        type="checkbox"
                        checked={selectedIncomes.has(income.id)}
                        onChange={() => handleSelectIncome(income.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {income.description}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {income.category}
                            </span>
                            <span className="text-sm text-slate-400">
                              {formatDate(income.date)}
                            </span>
                            {income.isRecurring && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {income.frequency}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-xl font-bold text-green-400">
                      +{formatCurrency(income.amount)}
                    </span>
                    {!bulkMode && (
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(income)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
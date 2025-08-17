'use client';

import { useEffect, useState } from 'react';
import { Subscription, SubscriptionFrequency } from '@/types/financial';
import { financialStorage } from '@/lib/financialStorage';
import { calculateNextBillingDate, getUpcomingSubscriptions, calculateMonthlyRecurringTotal } from '@/lib/financialCalculations';
import { storage } from '@/lib/storage';
import { formatCurrency, generateId } from '@/lib/utils';
import { getTodayString } from '@/lib/dateUtils';
import { generateHistoricalSubscriptionExpenses, previewRecurringGeneration } from '@/lib/recurringGenerator';
import { 
  Plus, 
  Calendar,
  Repeat,
  DollarSign,
  AlertCircle,
  Play,
  Pause,
  Edit2,
  Trash2,
  Bell,
  Clock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

const SUBSCRIPTION_FREQUENCIES: { value: SubscriptionFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (3 months)' },
  { value: 'yearly', label: 'Yearly' }
];

const EXPENSE_CATEGORIES = [
  'Entertainment',
  'Bills',
  'Transportation',
  'Shopping',
  'Food',
  'Other'
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = () => {
    const loadedSubscriptions = financialStorage.getSubscriptions();
    // Update next billing dates for all subscriptions
    const updatedSubscriptions = loadedSubscriptions.map(sub => ({
      ...sub,
      nextBilling: calculateNextBillingDate(sub)
    }));
    setSubscriptions(updatedSubscriptions);
    setIsLoading(false);
  };

  const handleAddSubscription = (subscriptionData: Partial<Subscription> & { generateHistorical?: boolean }) => {
    const nextBilling = calculateNextBillingDate({
      startDate: subscriptionData.startDate || getTodayString(),
      frequency: subscriptionData.frequency || 'monthly',
      lastBilled: undefined
    } as Subscription);

    const newSubscription: Subscription = {
      id: generateId(),
      name: subscriptionData.name || '',
      amount: subscriptionData.amount || 0,
      frequency: subscriptionData.frequency || 'monthly',
      startDate: subscriptionData.startDate || getTodayString(),
      endDate: subscriptionData.endDate,
      category: subscriptionData.category || 'Entertainment',
      description: subscriptionData.description,
      isActive: subscriptionData.isActive !== false,
      nextBilling,
      autoGenerate: subscriptionData.autoGenerate !== false,
      createdAt: new Date().toISOString(),
      billingHistory: []
    };
    
    financialStorage.addSubscription(newSubscription);
    
    // Generate historical expenses if requested
    if (subscriptionData.generateHistorical) {
      const historicalExpenses = generateHistoricalSubscriptionExpenses(newSubscription);
      historicalExpenses.forEach(expense => {
        storage.addExpense(expense);
      });
    }
    
    setSubscriptions(prev => [...prev, newSubscription]);
    setShowAddModal(false);
  };

  const handleUpdateSubscription = (subscriptionData: Partial<Subscription> & { generateHistorical?: boolean }) => {
    if (!editingSubscription) return;
    
    const updatedSubscription: Subscription = {
      ...editingSubscription,
      ...subscriptionData,
      id: editingSubscription.id
    };
    
    const withUpdatedBilling = {
      ...updatedSubscription,
      nextBilling: calculateNextBillingDate(updatedSubscription)
    };
    
    financialStorage.updateSubscription(withUpdatedBilling);
    setSubscriptions(prev => prev.map(subscription => 
      subscription.id === withUpdatedBilling.id ? withUpdatedBilling : subscription
    ));
    setEditingSubscription(null);
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      financialStorage.deleteSubscription(subscriptionId);
      setSubscriptions(prev => prev.filter(subscription => subscription.id !== subscriptionId));
    }
  };

  const handleToggleActive = (subscription: Subscription) => {
    const updated = { ...subscription, isActive: !subscription.isActive };
    handleUpdateSubscription(updated);
  };

  const handleBulkDelete = () => {
    if (selectedSubscriptions.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedSubscriptions.size} subscription(s)?`)) {
      selectedSubscriptions.forEach(subscriptionId => {
        financialStorage.deleteSubscription(subscriptionId);
      });
      setSubscriptions(prev => prev.filter(subscription => !selectedSubscriptions.has(subscription.id)));
      setSelectedSubscriptions(new Set());
      setBulkMode(false);
    }
  };

  const handleSelectSubscription = (subscriptionId: string) => {
    const newSelected = new Set(selectedSubscriptions);
    if (newSelected.has(subscriptionId)) {
      newSelected.delete(subscriptionId);
    } else {
      newSelected.add(subscriptionId);
    }
    setSelectedSubscriptions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSubscriptions.size === subscriptions.length) {
      setSelectedSubscriptions(new Set());
    } else {
      setSelectedSubscriptions(new Set(subscriptions.map(sub => sub.id)));
    }
  };

  const generateUpcomingExpenses = () => {
    const expenses = storage.getExpenses();
    const upcoming = getUpcomingSubscriptions(subscriptions, 7); // Next 7 days
    let generated = 0;

    upcoming.forEach(subscription => {
      if (subscription.autoGenerate) {
        const existingExpense = expenses.find(exp => 
          exp.date === subscription.nextBilling &&
          exp.description.includes(subscription.name) &&
          exp.amount === subscription.amount
        );

        if (!existingExpense) {
          const newExpense = {
            id: `sub-${subscription.id}-${subscription.nextBilling}`,
            description: `${subscription.name} (Subscription)`,
            amount: subscription.amount,
            category: subscription.category as any,
            date: subscription.nextBilling,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isRecurring: true,
            subscriptionId: subscription.id
          };
          
          storage.addExpense(newExpense);
          generated++;

          // Update subscription's last billed date and next billing
          const updatedSub = {
            ...subscription,
            lastBilled: subscription.nextBilling,
            nextBilling: calculateNextBillingDate({
              ...subscription,
              lastBilled: subscription.nextBilling
            })
          };
          handleUpdateSubscription(updatedSub);
        }
      }
    });

    if (generated > 0) {
      alert(`Generated ${generated} upcoming subscription expenses!`);
    } else {
      alert('No new subscription expenses to generate.');
    }
  };

  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  const monthlyTotal = calculateMonthlyRecurringTotal(activeSubscriptions);
  const upcomingBills = getUpcomingSubscriptions(subscriptions, 30);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Subscriptions
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Manage recurring charges and subscriptions
          </p>
        </div>
        <div className="flex gap-3">
          {!bulkMode ? (
            <>
              <Button
                onClick={generateUpcomingExpenses}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Clock className="h-5 w-5" />
                Generate Due
              </Button>
              <Button
                onClick={() => setBulkMode(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Bulk Delete
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Subscription
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                {selectedSubscriptions.size === subscriptions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleBulkDelete}
                variant="danger"
                disabled={selectedSubscriptions.size === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Delete ({selectedSubscriptions.size})
              </Button>
              <Button
                onClick={() => {
                  setBulkMode(false);
                  setSelectedSubscriptions(new Set());
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
              <Repeat className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-2xl font-bold text-white">
                {activeSubscriptions.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 bg-opacity-20 rounded-xl">
              <Bell className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Due Soon</p>
              <p className="text-2xl font-bold text-white">
                {upcomingBills.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 bg-opacity-20 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total</p>
              <p className="text-2xl font-bold text-white">
                {subscriptions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bills Alert */}
      {upcomingBills.length > 0 && (
        <div className="card p-6 mb-8 border-orange-500 border-opacity-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-orange-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Upcoming Bills</h3>
              <div className="space-y-2">
                {upcomingBills.slice(0, 5).map((sub) => {
                  const daysUntil = differenceInDays(parseISO(sub.nextBilling), new Date());
                  return (
                    <div key={sub.id} className="flex justify-between items-center">
                      <span className="text-slate-300">{sub.name}</span>
                      <div className="text-right">
                        <span className="text-white font-medium">{formatCurrency(sub.amount)}</span>
                        <p className="text-xs text-slate-400">
                          {daysUntil === 0 ? 'Today' : 
                           daysUntil === 1 ? 'Tomorrow' : 
                           `${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="card p-12 text-center">
          <Repeat className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Subscriptions Added</h3>
          <p className="text-slate-400 mb-6">Track your recurring charges and never miss a payment</p>
          <Button onClick={() => setShowAddModal(true)}>
            Add Your First Subscription
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions
            .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())
            .map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onEdit={() => setEditingSubscription(subscription)}
                onDelete={() => handleDeleteSubscription(subscription.id)}
                onToggleActive={() => handleToggleActive(subscription)}
                bulkMode={bulkMode}
                isSelected={selectedSubscriptions.has(subscription.id)}
                onSelect={() => handleSelectSubscription(subscription.id)}
              />
            ))}
        </div>
      )}

      {/* Add/Edit Subscription Modal */}
      {(showAddModal || editingSubscription) && (
        <SubscriptionModal
          subscription={editingSubscription}
          onSave={editingSubscription ? handleUpdateSubscription : handleAddSubscription}
          onClose={() => {
            setShowAddModal(false);
            setEditingSubscription(null);
          }}
        />
      )}
    </div>
  );
}

function SubscriptionCard({ 
  subscription, 
  onEdit, 
  onDelete, 
  onToggleActive,
  bulkMode = false,
  isSelected = false,
  onSelect
}: { 
  subscription: Subscription; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggleActive: () => void;
  bulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const daysUntilBilling = differenceInDays(parseISO(subscription.nextBilling), new Date());
  const isOverdue = daysUntilBilling < 0;
  const isDueSoon = daysUntilBilling <= 3 && daysUntilBilling >= 0;

  return (
    <div className={`card p-6 card-hover ${
      !subscription.isActive ? 'opacity-60' : 
      isOverdue ? 'border-red-500 border-opacity-50' :
      isDueSoon ? 'border-orange-500 border-opacity-50' : ''
    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{subscription.name}</h3>
              {!subscription.isActive && (
                <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">Paused</span>
              )}
            </div>
            <p className="text-sm text-slate-400">{subscription.description}</p>
          </div>
        </div>
        
        {!bulkMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleActive}
              className="p-1 h-8 w-8"
              title={subscription.isActive ? 'Pause' : 'Resume'}
            >
              {subscription.isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="p-1 h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="p-1 h-8 w-8 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(subscription.amount)}
          </p>
          <p className="text-sm text-slate-400 capitalize">
            per {subscription.frequency.replace('ly', '')}
          </p>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Category:</span>
          <span className="text-white">{subscription.category}</span>
        </div>
        
        <div className="pt-2 border-t border-slate-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Next billing:</span>
            <span className={`font-medium ${
              isOverdue ? 'text-red-400' :
              isDueSoon ? 'text-orange-400' : 'text-slate-300'
            }`}>
              {format(parseISO(subscription.nextBilling), 'MMM dd')}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isOverdue ? `${Math.abs(daysUntilBilling)} days overdue` :
             daysUntilBilling === 0 ? 'Due today' :
             daysUntilBilling === 1 ? 'Due tomorrow' :
             `${daysUntilBilling} days away`}
          </div>
        </div>
        
        {subscription.autoGenerate && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Clock className="h-3 w-3" />
            <span>Auto-generates expenses</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionModal({ 
  subscription, 
  onSave, 
  onClose 
}: { 
  subscription?: Subscription | null;
  onSave: (subscription: Partial<Subscription> & { generateHistorical?: boolean }) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    amount: subscription?.amount?.toString() || '',
    frequency: subscription?.frequency || 'monthly',
    category: subscription?.category || 'Entertainment',
    startDate: subscription?.startDate || getTodayString(),
    endDate: subscription?.endDate || '',
    description: subscription?.description || '',
    autoGenerate: subscription?.autoGenerate !== false
  });

  const [generateHistorical, setGenerateHistorical] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      endDate: formData.endDate || undefined,
      generateHistorical: generateHistorical && !subscription // Only for new subscriptions
    });
  };

  const getRecurringPreview = () => {
    if (!formData.amount || !formData.frequency) return null;
    
    try {
      const mockSubscription = {
        id: 'preview',
        name: formData.name,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency as SubscriptionFrequency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category,
        description: formData.description,
        isActive: true,
        nextBilling: '',
        autoGenerate: formData.autoGenerate,
        createdAt: new Date().toISOString(),
        billingHistory: []
      };
      
      return previewRecurringGeneration(mockSubscription);
    } catch (error) {
      return null;
    }
  };

  const preview = getRecurringPreview();
  const isPastDate = new Date(formData.startDate) < new Date();
  const shouldShowHistoricalOption = !subscription && isPastDate; // Only for new subscriptions with past dates

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {subscription ? 'Edit Subscription' : 'Add New Subscription'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Subscription Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Netflix, Spotify"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0.00"
              required
            />
            
            <Select
              label="Frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value as SubscriptionFrequency})}
              options={SUBSCRIPTION_FREQUENCIES}
              required
            />
          </div>
          
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
            />
            
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
          </div>
          
          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description"
          />
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.autoGenerate}
              onChange={(e) => setFormData({...formData, autoGenerate: e.target.checked})}
              className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Automatically generate expenses when due</span>
          </label>

          {/* Historical Generation Section */}
          {shouldShowHistoricalOption && (
            <div className="border-t border-slate-700 pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    id="generateHistoricalSub"
                    type="checkbox"
                    checked={generateHistorical}
                    onChange={(e) => setGenerateHistorical(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="generateHistoricalSub" className="text-sm font-medium text-slate-300 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                    Generate historical expense entries from start date
                  </label>
                </div>

                {generateHistorical && preview && (
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center mb-3">
                      <Clock className="h-4 w-4 text-orange-400 mr-2" />
                      <h4 className="text-sm font-semibold text-white">Preview: Historical Expenses</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Total Expenses:</span>
                        <span className="text-white font-medium ml-2">{preview.totalEntries}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Amount:</span>
                        <span className="text-red-400 font-medium ml-2">{formatCurrency(preview.estimatedTotal)}</span>
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
                        <span>This will generate {preview.totalEntries} expense entries. Consider using a more recent start date.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {subscription ? 'Update Subscription' : 'Add Subscription'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
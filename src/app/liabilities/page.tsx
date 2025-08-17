'use client';

import { useEffect, useState } from 'react';
import { Liability, LiabilityCategory } from '@/types/financial';
import { financialStorage } from '@/lib/financialStorage';
import { calculateLoanPayoff } from '@/lib/financialCalculations';
import { formatCurrency, generateId } from '@/lib/utils';
import { 
  Plus, 
  CreditCard,
  GraduationCap,
  Home,
  Car,
  DollarSign,
  AlertTriangle,
  Edit2,
  Trash2,
  Calculator,
  TrendingDown,
  Calendar
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format, addMonths } from 'date-fns';

const LIABILITY_CATEGORIES: { value: LiabilityCategory; label: string; icon: React.ElementType }[] = [
  { value: 'Credit Cards', label: 'Credit Cards', icon: CreditCard },
  { value: 'Student Loans', label: 'Student Loans', icon: GraduationCap },
  { value: 'Mortgage', label: 'Mortgage', icon: Home },
  { value: 'Auto Loans', label: 'Auto Loans', icon: Car },
  { value: 'Personal Loans', label: 'Personal Loans', icon: DollarSign },
  { value: 'Other Debts', label: 'Other Debts', icon: AlertTriangle }
];

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [showPayoffModal, setShowPayoffModal] = useState<Liability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedLiabilities = financialStorage.getLiabilities();
    setLiabilities(loadedLiabilities);
    setIsLoading(false);
  }, []);

  const handleAddLiability = (liabilityData: Partial<Liability>) => {
    const newLiability: Liability = {
      id: generateId(),
      name: liabilityData.name || '',
      category: liabilityData.category || 'Other Debts',
      currentBalance: liabilityData.currentBalance || 0,
      originalAmount: liabilityData.originalAmount,
      interestRate: liabilityData.interestRate,
      minimumPayment: liabilityData.minimumPayment,
      dueDate: liabilityData.dueDate,
      startDate: liabilityData.startDate || new Date().toISOString().split('T')[0],
      maturityDate: liabilityData.maturityDate,
      description: liabilityData.description,
      lastUpdated: new Date().toISOString(),
      paymentHistory: []
    };
    
    financialStorage.addLiability(newLiability);
    setLiabilities(prev => [...prev, newLiability]);
    setShowAddModal(false);
  };

  const handleUpdateLiability = (liabilityData: Partial<Liability>) => {
    if (!editingLiability) return;
    
    const updatedLiability: Liability = {
      ...editingLiability,
      ...liabilityData,
      id: editingLiability.id
    };
    
    financialStorage.updateLiability(updatedLiability);
    setLiabilities(prev => prev.map(liability => 
      liability.id === updatedLiability.id ? updatedLiability : liability
    ));
    setEditingLiability(null);
  };

  const handleDeleteLiability = (liabilityId: string) => {
    if (confirm('Are you sure you want to delete this liability?')) {
      financialStorage.deleteLiability(liabilityId);
      setLiabilities(prev => prev.filter(liability => liability.id !== liabilityId));
    }
  };

  const totalDebt = liabilities.reduce((sum, liability) => sum + liability.currentBalance, 0);
  const totalMinimumPayments = liabilities.reduce((sum, liability) => sum + (liability.minimumPayment || 0), 0);
  
  const liabilitiesByCategory = liabilities.reduce((groups, liability) => {
    if (!groups[liability.category]) groups[liability.category] = [];
    groups[liability.category].push(liability);
    return groups;
  }, {} as Record<LiabilityCategory, Liability[]>);

  const categoryTotals = Object.entries(liabilitiesByCategory).map(([category, categoryLiabilities]) => ({
    category: category as LiabilityCategory,
    total: categoryLiabilities.reduce((sum, liability) => sum + liability.currentBalance, 0),
    count: categoryLiabilities.length,
    liabilities: categoryLiabilities
  })).sort((a, b) => b.total - a.total);

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
            Debt & Liabilities
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Track and manage your debts
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Liability
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Debt</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 bg-opacity-20 rounded-xl">
              <Calendar className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Payments</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalMinimumPayments)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Debts</p>
              <p className="text-2xl font-bold text-white">
                {liabilities.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liabilities by Category */}
      {categoryTotals.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Liabilities Added</h3>
          <p className="text-slate-400 mb-6">Track your debts to get a complete financial picture</p>
          <Button onClick={() => setShowAddModal(true)}>
            Add Your First Liability
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {categoryTotals.map(({ category, total, count, liabilities: categoryLiabilities }) => {
            const categoryInfo = LIABILITY_CATEGORIES.find(cat => cat.value === category);
            const Icon = categoryInfo?.icon || AlertTriangle;
            
            return (
              <div key={category} className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
                      <Icon className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{category}</h3>
                      <p className="text-sm text-slate-400">
                        {count} {count === 1 ? 'debt' : 'debts'} • {formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryLiabilities.map((liability) => (
                    <LiabilityCard
                      key={liability.id}
                      liability={liability}
                      onEdit={() => setEditingLiability(liability)}
                      onDelete={() => handleDeleteLiability(liability.id)}
                      onViewPayoff={() => setShowPayoffModal(liability)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Liability Modal */}
      {(showAddModal || editingLiability) && (
        <LiabilityModal
          liability={editingLiability}
          onSave={editingLiability ? handleUpdateLiability : handleAddLiability}
          onClose={() => {
            setShowAddModal(false);
            setEditingLiability(null);
          }}
        />
      )}

      {/* Payoff Calculator Modal */}
      {showPayoffModal && (
        <PayoffModal
          liability={showPayoffModal}
          onClose={() => setShowPayoffModal(null)}
        />
      )}
    </div>
  );
}

function LiabilityCard({ 
  liability, 
  onEdit, 
  onDelete, 
  onViewPayoff 
}: { 
  liability: Liability; 
  onEdit: () => void; 
  onDelete: () => void;
  onViewPayoff: () => void;
}) {
  const originalAmount = liability.originalAmount || liability.currentBalance;
  const paidOff = originalAmount - liability.currentBalance;
  const progressPercentage = originalAmount > 0 ? (paidOff / originalAmount) * 100 : 0;

  return (
    <div className="p-4 bg-slate-700 bg-opacity-30 rounded-lg card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{liability.name}</h4>
          <p className="text-sm text-slate-400">{liability.description}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewPayoff}
            className="p-1 h-8 w-8"
            title="Payoff calculator"
          >
            <Calculator className="h-4 w-4" />
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
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-lg font-bold text-red-300">
            {formatCurrency(liability.currentBalance)}
          </p>
          <p className="text-xs text-slate-400">
            Current Balance
          </p>
        </div>
        
        {liability.minimumPayment && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Min. Payment:</span>
            <span className="text-white">{formatCurrency(liability.minimumPayment)}</span>
          </div>
        )}
        
        {liability.interestRate && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Interest Rate:</span>
            <span className="text-white">{liability.interestRate}%</span>
          </div>
        )}
        
        {originalAmount > liability.currentBalance && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
          Updated: {format(new Date(liability.lastUpdated), 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
}

function LiabilityModal({ 
  liability, 
  onSave, 
  onClose 
}: { 
  liability?: Liability | null;
  onSave: (liability: Partial<Liability>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: liability?.name || '',
    category: liability?.category || 'Other Debts',
    currentBalance: liability?.currentBalance?.toString() || '',
    originalAmount: liability?.originalAmount?.toString() || '',
    interestRate: liability?.interestRate?.toString() || '',
    minimumPayment: liability?.minimumPayment?.toString() || '',
    dueDate: liability?.dueDate || '',
    startDate: liability?.startDate || new Date().toISOString().split('T')[0],
    maturityDate: liability?.maturityDate || '',
    description: liability?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      currentBalance: parseFloat(formData.currentBalance),
      originalAmount: formData.originalAmount ? parseFloat(formData.originalAmount) : undefined,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      minimumPayment: formData.minimumPayment ? parseFloat(formData.minimumPayment) : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {liability ? 'Edit Liability' : 'Add New Liability'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Debt Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Chase Credit Card"
            required
          />
          
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value as LiabilityCategory})}
            options={LIABILITY_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }))}
            required
          />
          
          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            value={formData.currentBalance}
            onChange={(e) => setFormData({...formData, currentBalance: e.target.value})}
            placeholder="0.00"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
              placeholder="0.00"
            />
            
            <Input
              label="Min. Payment"
              type="number"
              step="0.01"
              value={formData.minimumPayment}
              onChange={(e) => setFormData({...formData, minimumPayment: e.target.value})}
              placeholder="0.00"
            />
          </div>
          
          <Input
            label="Original Amount (Optional)"
            type="number"
            step="0.01"
            value={formData.originalAmount}
            onChange={(e) => setFormData({...formData, originalAmount: e.target.value})}
            placeholder="0.00"
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
              label="Maturity Date (Optional)"
              type="date"
              value={formData.maturityDate}
              onChange={(e) => setFormData({...formData, maturityDate: e.target.value})}
            />
          </div>
          
          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description"
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {liability ? 'Update Liability' : 'Add Liability'}
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

function PayoffModal({ 
  liability, 
  onClose 
}: { 
  liability: Liability;
  onClose: () => void;
}) {
  const payoffProjection = calculateLoanPayoff(liability);

  if (!payoffProjection) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Cannot Calculate Payoff</h2>
            <p className="text-slate-400 mb-6">
              Missing required information (minimum payment and interest rate) or payment is insufficient to cover interest.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">{liability.name} - Payoff Analysis</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-sm text-slate-400">Payoff Date</p>
              <p className="text-lg font-bold text-white">
                {format(new Date(payoffProjection.payoffDate), 'MMM yyyy')}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-400">Months Remaining</p>
              <p className="text-lg font-bold text-white">
                {payoffProjection.monthsRemaining}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-400">Total Interest</p>
              <p className="text-lg font-bold text-red-300">
                {formatCurrency(payoffProjection.totalInterestRemaining)}
              </p>
            </div>
          </div>

          {/* Extra Payment Scenarios */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Extra Payment Scenarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payoffProjection.extraPaymentScenarios.map((scenario) => (
                <div key={scenario.extraAmount} className="p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">
                      +{formatCurrency(scenario.extraAmount)}/month
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-green-400">
                        {scenario.monthsSaved} months saved
                      </div>
                      <div className="text-xs text-slate-400">
                        Save {formatCurrency(scenario.interestSaved)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Expense, ExpenseCategory } from '@/types/expense';
import { SpendingGoal } from '@/types/analytics';
import { storage } from '@/lib/storage';
import { formatCurrency, generateId } from '@/lib/utils';
import { 
  Target, 
  Plus, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';

const GOALS_STORAGE_KEY = 'expense-tracker-goals';

export default function GoalsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<SpendingGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpendingGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = storage.getExpenses();
    const loadedGoals = loadGoals();
    
    setExpenses(loadExpenses);
    setGoals(loadedGoals);
    setIsLoading(false);
  }, []);

  const loadGoals = (): SpendingGoal[] => {
    try {
      const data = localStorage.getItem(GOALS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveGoals = (goalsToSave: SpendingGoal[]) => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goalsToSave));
    setGoals(goalsToSave);
  };

  const calculateGoalProgress = (goal: SpendingGoal): SpendingGoal => {
    const now = new Date();
    const deadline = parseISO(goal.deadline);
    
    let relevantExpenses = expenses;
    
    // Filter expenses based on goal type and timeframe
    if (goal.type === 'reduce_category' && goal.category) {
      relevantExpenses = expenses.filter(exp => exp.category === goal.category);
    }
    
    // For monthly goals, only look at current month
    if (goal.type === 'total_limit') {
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      relevantExpenses = expenses.filter(exp => {
        const expDate = parseISO(exp.date);
        return expDate >= monthStart && expDate <= monthEnd;
      });
    }
    
    const currentAmount = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    let progress: number;
    let status: SpendingGoal['status'];
    
    if (goal.type === 'save_amount') {
      // For savings goals, progress is based on how much we've saved (not spent)
      const expectedSpending = goal.targetAmount * 1.5; // Assume they want to save from a higher baseline
      const actualSavings = Math.max(0, expectedSpending - currentAmount);
      progress = Math.min(100, (actualSavings / goal.targetAmount) * 100);
    } else {
      // For spending limits, progress is how much of the limit we've used
      progress = Math.min(100, (currentAmount / goal.targetAmount) * 100);
    }
    
    // Determine status
    if (isAfter(now, deadline)) {
      status = progress >= 100 ? 'completed' : 'failed';
    } else if (progress >= 100) {
      status = goal.type === 'save_amount' ? 'completed' : 'failed';
    } else {
      status = 'active';
    }
    
    return {
      ...goal,
      currentAmount,
      progress,
      status
    };
  };

  const goalsWithProgress = goals.map(calculateGoalProgress);

  const handleAddGoal = (goalData: Partial<SpendingGoal>) => {
    const newGoal: SpendingGoal = {
      id: generateId(),
      title: goalData.title || '',
      type: goalData.type || 'total_limit',
      targetAmount: goalData.targetAmount || 0,
      currentAmount: 0,
      category: goalData.category,
      deadline: goalData.deadline || format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
      status: 'active',
      progress: 0
    };
    
    saveGoals([...goals, newGoal]);
    setShowAddGoal(false);
  };

  const handleUpdateGoal = (updatedGoal: SpendingGoal) => {
    const updatedGoals = goals.map(goal => 
      goal.id === updatedGoal.id ? updatedGoal : goal
    );
    saveGoals(updatedGoals);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      saveGoals(updatedGoals);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-700 rounded-xl"></div>
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
            Financial Goals
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Set targets and track your progress
          </p>
        </div>
        <Button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Goal
        </Button>
      </div>

      {/* Goals Overview */}
      {goalsWithProgress.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Completed Goals</p>
                <p className="text-2xl font-bold text-white">
                  {goalsWithProgress.filter(g => g.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Goals</p>
                <p className="text-2xl font-bold text-white">
                  {goalsWithProgress.filter(g => g.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-xl">
                <Target className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Target</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goalsWithProgress.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Goals Set</h3>
          <p className="text-slate-400 mb-6">Start setting financial goals to track your progress</p>
          <Button onClick={() => setShowAddGoal(true)}>
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsWithProgress.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditingGoal(goal)}
              onDelete={() => handleDeleteGoal(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {(showAddGoal || editingGoal) && (
        <GoalModal
          goal={editingGoal}
          onSave={editingGoal ? 
            (goalData: Partial<SpendingGoal>) => handleUpdateGoal({...editingGoal, ...goalData} as SpendingGoal) : 
            handleAddGoal
          }
          onClose={() => {
            setShowAddGoal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}

function GoalCard({ 
  goal, 
  onEdit, 
  onDelete 
}: { 
  goal: SpendingGoal; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const isOverdue = isAfter(new Date(), parseISO(goal.deadline)) && goal.status === 'active';
  
  return (
    <div className={`card p-6 card-hover ${
      goal.status === 'completed' ? 'border-green-500 border-opacity-50' :
      goal.status === 'failed' || isOverdue ? 'border-red-500 border-opacity-50' :
      'border-blue-500 border-opacity-30'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{goal.title}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>{format(parseISO(goal.deadline), 'MMM dd, yyyy')}</span>
            {isOverdue && (
              <span className="text-red-400 font-medium">Overdue</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
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
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm font-medium text-slate-300">
              {Math.round(goal.progress)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                goal.status === 'completed' ? 'bg-green-500' :
                goal.progress > 90 ? 'bg-red-500' :
                goal.progress > 75 ? 'bg-orange-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, goal.progress)}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400">Current</p>
            <p className="font-semibold text-white">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Target</p>
            <p className="font-semibold text-white">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>
        
        {goal.category && (
          <div className="pt-2 border-t border-slate-700">
            <span className="text-xs text-slate-400">Category: </span>
            <span className="text-xs text-slate-300">{goal.category}</span>
          </div>
        )}
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
          goal.status === 'completed' ? 'bg-green-500 bg-opacity-20 text-green-400' :
          goal.status === 'failed' || isOverdue ? 'bg-red-500 bg-opacity-20 text-red-400' :
          'bg-blue-500 bg-opacity-20 text-blue-400'
        }`}>
          {goal.status === 'completed' ? 'Completed' :
           goal.status === 'failed' ? 'Failed' :
           isOverdue ? 'Overdue' : 'Active'}
        </div>
      </div>
    </div>
  );
}

function GoalModal({ 
  goal, 
  onSave, 
  onClose 
}: { 
  goal?: SpendingGoal | null;
  onSave: (goal: Partial<SpendingGoal>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    type: goal?.type || 'total_limit',
    targetAmount: goal?.targetAmount?.toString() || '',
    category: goal?.category || '',
    deadline: goal?.deadline || format(new Date(), 'yyyy-MM-dd')
  });

  const goalTypes = [
    { value: 'total_limit', label: 'Monthly Spending Limit' },
    { value: 'save_amount', label: 'Save Amount' },
    { value: 'reduce_category', label: 'Reduce Category Spending' }
  ];

  const categories = [
    'Food', 'Groceries', 'Dining Out', 'Transportation', 'Gas/Fuel', 'Public Transport',
    'Entertainment', 'Shopping', 'Clothing', 'Electronics', 'Bills', 'Rent/Mortgage',
    'Utilities', 'Internet/Phone', 'Insurance', 'Healthcare', 'Education', 'Travel',
    'Fitness/Sports', 'Personal Care', 'Gifts', 'Charity', 'Business', 'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      category: formData.category as ExpenseCategory
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {goal ? 'Edit Goal' : 'Add New Goal'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Goal Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="e.g., Save for vacation"
            required
          />
          
          <Select
            label="Goal Type"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            options={goalTypes}
            required
          />
          
          <Input
            label="Target Amount"
            type="number"
            step="0.01"
            value={formData.targetAmount}
            onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
            placeholder="0.00"
            required
          />
          
          {formData.type === 'reduce_category' && (
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              required
            />
          )}
          
          <Input
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            required
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {goal ? 'Update Goal' : 'Create Goal'}
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
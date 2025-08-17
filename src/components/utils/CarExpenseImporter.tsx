'use client';

import { useState } from 'react';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { ExpenseCategory } from '@/types/expense';
import Button from '@/components/ui/Button';
import { Car, Check } from 'lucide-react';

const carExpenses = [
  { description: "Car loan", amount: 355.00, category: "Transportation", date: "2024-07-01" },
  { description: "Insurance", amount: 454.00, category: "Insurance", date: "2024-07-01" },
  { description: "Gas July 4", amount: 28.00, category: "Gas/Fuel", date: "2024-07-04" },
  { description: "Car Fix", amount: 50.00, category: "Transportation", date: "2024-07-10" },
  { description: "Gas July 14", amount: 34.00, category: "Gas/Fuel", date: "2024-07-14" },
  { description: "License Renewal", amount: 20.00, category: "Transportation", date: "2024-07-18" },
  { description: "Parking Xebia", amount: 30.00, category: "Transportation", date: "2024-07-22" },
  { description: "Gas July 25", amount: 35.00, category: "Gas/Fuel", date: "2024-07-25" },
  { description: "Parking Airport", amount: 60.00, category: "Transportation", date: "2024-07-28" }
];

export default function CarExpenseImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      // Add each car expense with specific dates
      for (const expenseData of carExpenses) {
        const now = new Date().toISOString();
        const expense = {
          id: generateId(),
          amount: expenseData.amount,
          category: expenseData.category as ExpenseCategory,
          description: expenseData.description,
          date: expenseData.date,
          createdAt: now,
          updatedAt: now
        };
        
        storage.addExpense(expense);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setIsImported(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setIsImported(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error importing car expenses:', error);
    } finally {
      setIsImporting(false);
    }
  };

  if (isImported) {
    return (
      <div className="card p-6 bg-green-500 bg-opacity-10 border border-green-500">
        <div className="flex items-center gap-3">
          <Check className="h-6 w-6 text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-green-400">Car Expenses Added!</h3>
            <p className="text-green-300 text-sm">
              Added {carExpenses.length} car-related expenses with specific July dates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = carExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="card p-6 border-blue-500 border">
      <div className="flex items-center gap-3 mb-4">
        <Car className="h-6 w-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Add Car Expenses</h3>
          <p className="text-slate-400 text-sm">
            Add {carExpenses.length} specific car expenses (${totalAmount.toFixed(2)} total)
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-slate-300 mb-2">Car expenses with exact dates:</p>
        <div className="text-xs text-slate-400 space-y-1 max-h-32 overflow-y-auto">
          {carExpenses.map((expense, index) => (
            <div key={index} className="flex justify-between">
              <span>{expense.description}</span>
              <span>${expense.amount} - {expense.date.split('-').slice(1).join('/')}</span>
            </div>
          ))}
        </div>
      </div>
      
      <Button
        onClick={handleImport}
        disabled={isImporting}
        className="w-full"
      >
        {isImporting ? 'Adding...' : 'Add Car Expenses'}
      </Button>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { ExpenseCategory } from '@/types/expense';
import Button from '@/components/ui/Button';
import { Upload, Check } from 'lucide-react';

const sampleData = [
  // Bills
  { description: "Amex loan", amount: 550.00, category: "Bills" },
  { description: "Patelco loan", amount: 575.00, category: "Bills" },
  { description: "Cap 1", amount: 461.00, category: "Bills" },
  { description: "BoA", amount: 250.00, category: "Bills" },
  
  // Transportation (mapped to Transportation and Gas/Fuel)
  { description: "Car loan", amount: 355.00, category: "Transportation" },
  { description: "Insurance", amount: 454.00, category: "Insurance" },
  { description: "Gas July 4", amount: 28.00, category: "Gas/Fuel" },
  { description: "Car Fix", amount: 50.00, category: "Transportation" },
  { description: "Gas July 14", amount: 34.00, category: "Gas/Fuel" },
  { description: "License Renewal", amount: 20.00, category: "Transportation" },
  { description: "Parking Xebia", amount: 30.00, category: "Transportation" },
  { description: "Gas July 25", amount: 35.00, category: "Gas/Fuel" },
  { description: "Parking Airport", amount: 60.00, category: "Transportation" },
  
  // Food (mapped to Dining Out)
  { description: "Chai Paani", amount: 18.00, category: "Dining Out" },
  { description: "Sams Club Pizza", amount: 18.00, category: "Dining Out" },
  { description: "KBBQ", amount: 51.00, category: "Dining Out" },
  { description: "Falafel Inc", amount: 10.00, category: "Dining Out" },
  { description: "DanDan", amount: 30.00, category: "Dining Out" },
  
  // Groceries
  { description: "TGTG", amount: 38.00, category: "Groceries" },
  { description: "Publix", amount: 24.00, category: "Groceries" },
  { description: "Patel", amount: 45.00, category: "Groceries" },
  { description: "Sams Club", amount: 60.00, category: "Groceries" },
  { description: "Whole foods", amount: 14.00, category: "Groceries" },
  
  // Misc (mapped to appropriate categories)
  { description: "Photo Print/Umbrella", amount: 16.00, category: "Shopping" },
  { description: "Burlington", amount: 11.00, category: "Clothing" },
  { description: "Braves", amount: 71.00, category: "Entertainment" },
  { description: "DH Gate", amount: 10.00, category: "Shopping" },
  { description: "Golf", amount: 18.00, category: "Fitness/Sports" },
  { description: "UPS Shipment", amount: 30.00, category: "Other" },
  { description: "AWS Exams", amount: 140.00, category: "Education" },
  { description: "Uniqlo", amount: 28.00, category: "Clothing" },
  { description: "Udemy", amount: 12.00, category: "Education" },
  { description: "Golf Clubs", amount: 140.00, category: "Fitness/Sports" },
  { description: "Movie F1", amount: 9.00, category: "Entertainment" },
  { description: "Haircut", amount: 25.00, category: "Personal Care" },
  
  // Rent (mapped to appropriate categories)
  { description: "Electricity", amount: 0.00, category: "Utilities" },
  { description: "Laundry", amount: 20.00, category: "Other" },
  { description: "Rent", amount: 100.00, category: "Rent/Mortgage" },
  { description: "Internet", amount: 30.00, category: "Internet/Phone" },
  
  // Subscriptions (mapped to appropriate categories)
  { description: "iCloud", amount: 10.00, category: "Other" },
  { description: "Verizon", amount: 38.00, category: "Internet/Phone" },
  { description: "YouTube", amount: 8.00, category: "Entertainment" },
  { description: "ForePass", amount: 30.00, category: "Other" },
  { description: "Spotify", amount: 20.00, category: "Entertainment" },
  
  // Travel
  { description: "Flight to DC", amount: 25.00, category: "Travel" },
  { description: "Uber DC", amount: 35.00, category: "Travel" },
  { description: "Metro DC", amount: 4.00, category: "Travel" },
  { description: "F1 Arcade", amount: 45.00, category: "Travel" }
];

function getRandomDateInJuly() {
  const year = new Date().getFullYear();
  const month = 6; // July is month 6 (0-indexed)
  const daysInMonth = 31; // July has 31 days
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  
  const date = new Date(year, month, randomDay);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export default function DataImporter() {
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      // Convert data to expense format and add to storage
      for (const expenseData of sampleData) {
        const now = new Date().toISOString();
        const expense = {
          id: generateId(),
          amount: expenseData.amount,
          category: expenseData.category as ExpenseCategory,
          description: expenseData.description,
          date: getRandomDateInJuly(),
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
      console.error('Error importing data:', error);
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
            <h3 className="text-lg font-semibold text-green-400">Data Imported Successfully!</h3>
            <p className="text-green-300 text-sm">
              Added {sampleData.length} sample expenses to your tracker.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-6 w-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">Import Sample Data</h3>
          <p className="text-slate-400 text-sm">
            Add {sampleData.length} July expenses with realistic categories and amounts
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-slate-300 mb-2">This will add expenses including:</p>
        <ul className="text-xs text-slate-400 grid grid-cols-2 gap-1">
          <li>• Loan payments (Bills)</li>
          <li>• Car expenses (Transportation)</li>
          <li>• Restaurant meals (Dining Out)</li>
          <li>• Grocery shopping</li>
          <li>• Entertainment & sports</li>
          <li>• Travel expenses</li>
          <li>• Utilities & subscriptions</li>
          <li>• And more...</li>
        </ul>
      </div>
      
      <Button
        onClick={handleImport}
        disabled={isImporting}
        className="w-full"
      >
        {isImporting ? 'Importing...' : 'Import Sample Data'}
      </Button>
    </div>
  );
}
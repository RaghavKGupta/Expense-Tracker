'use client';

import { useState, useEffect } from 'react';
import { Expense, Income, CustomCategory } from '@/types/expense';
import { csvStorage } from '@/lib/csvStorage';
import CSVUploader from './CSVUploader';
import SaveReminder from './SaveReminder';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [existingData, setExistingData] = useState<{
    expenses: Expense[];
    incomes: Income[];
    customCategories: CustomCategory[];
  }>({ expenses: [], incomes: [], customCategories: [] });

  useEffect(() => {
    // Check if we already have data loaded in the current session
    if (csvStorage.isDataLoaded()) {
      setIsInitialized(true);
      return;
    }

    // Check for existing localStorage data
    const migratedData = csvStorage.migrateFromLocalStorage();
    setExistingData(migratedData);

    // If we have existing data or no data at all, show the uploader
    setShowUploader(true);
  }, []);

  const handleDataLoaded = (expenses: Expense[], incomes: Income[]) => {
    // Initialize the CSV storage with the loaded data
    csvStorage.initializeData(expenses, incomes, existingData.customCategories);
    
    // Clear localStorage if we migrated data
    if (existingData.expenses.length > 0 || existingData.incomes.length > 0) {
      csvStorage.clearLocalStorage();
    }
    
    setShowUploader(false);
    setIsInitialized(true);
  };

  const handleSkip = () => {
    // Initialize with existing data or empty arrays
    csvStorage.initializeData(
      existingData.expenses,
      existingData.incomes,
      existingData.customCategories
    );
    
    setShowUploader(false);
    setIsInitialized(true);
  };

  // Show uploader if not initialized
  if (showUploader) {
    return (
      <CSVUploader
        onDataLoaded={handleDataLoaded}
        onSkip={handleSkip}
        existingExpenses={existingData.expenses}
        existingIncomes={existingData.incomes}
      />
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  // Render the app with save reminder
  return (
    <>
      {children}
      <SaveReminder />
    </>
  );
}
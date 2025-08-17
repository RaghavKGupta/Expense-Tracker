'use client';

import { useState, useRef } from 'react';
import { Expense, Income } from '@/types/expense';
import { parseCombinedCSV, createCombinedCSV, downloadCSV } from '@/lib/csvUtils';
import Button from '@/components/ui/Button';
import { Upload, FileText, AlertCircle, Check, Download } from 'lucide-react';

interface CSVUploaderProps {
  onDataLoaded: (expenses: Expense[], incomes: Income[]) => void;
  onSkip: () => void;
  existingExpenses?: Expense[];
  existingIncomes?: Income[];
}

export default function CSVUploader({ 
  onDataLoaded, 
  onSkip, 
  existingExpenses = [], 
  existingIncomes = [] 
}: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const { expenses, incomes } = parseCombinedCSV(csvContent);
        
        // Merge with existing data if any
        const allExpenses = [...existingExpenses, ...expenses];
        const allIncomes = [...existingIncomes, ...incomes];
        
        setSuccess(`Loaded ${expenses.length} expenses and ${incomes.length} income entries`);
        
        setTimeout(() => {
          onDataLoaded(allExpenses, allIncomes);
        }, 1000);
        
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
        console.error('CSV parsing error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const hasExistingData = existingExpenses.length > 0 || existingIncomes.length > 0;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-green-500">
          <div className="p-6 text-center">
            <Check className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-400 mb-2">CSV Loaded Successfully!</h2>
            <p className="text-green-300">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              {hasExistingData ? 'Load Additional Data from CSV' : 'Load Data from CSV'}
            </h2>
          </div>
          <p className="text-slate-400 mt-2">
            {hasExistingData 
              ? 'Upload a CSV file to add more expenses and income to your existing data'
              : 'Upload a CSV file to start tracking your expenses and income'
            }
          </p>
        </div>

        <div className="p-6">
          {hasExistingData && (
            <div className="mb-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <span className="font-medium text-blue-400">Existing Data Found</span>
              </div>
              <p className="text-blue-300 text-sm">
                Found {existingExpenses.length} expenses and {existingIncomes.length} income entries in browser storage.
                New CSV data will be merged with existing data.
              </p>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Drop your CSV file here
            </h3>
            <p className="text-slate-400 mb-4">
              or click to browse for a file
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="mb-4"
            >
              {isLoading ? 'Loading...' : 'Choose CSV File'}
            </Button>

            {error && (
              <div className="mt-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-white mb-2">CSV Format:</h4>
            <p className="text-sm text-slate-400 mb-2">
              Your CSV should contain sections for EXPENSES and INCOME (optional):
            </p>
            <div className="bg-slate-900 rounded p-3 text-xs text-slate-300 font-mono">
              <div>EXPENSES</div>
              <div>id,amount,category,description,date,createdAt,updatedAt</div>
              <div>"exp1",50.00,"Food","Lunch","2024-07-15",...,...</div>
              <div className="mt-2">INCOME</div>
              <div>id,amount,category,description,date,isRecurring,frequency,createdAt,updatedAt</div>
              <div>"inc1",3000.00,"Salary","Monthly salary","2024-07-01",true,"monthly",...,...</div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={onSkip}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              {hasExistingData ? 'Continue with Existing Data' : 'Skip and Start Fresh'}
            </Button>
            {hasExistingData && (
              <Button
                onClick={() => {
                  // Download existing data as CSV for backup
                  const csvContent = createCombinedCSV(existingExpenses, existingIncomes);
                  downloadCSV(csvContent, `expense-backup-${new Date().toISOString().split('T')[0]}.csv`);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Backup Current Data
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
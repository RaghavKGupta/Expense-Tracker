import { Expense, Income, ExpenseCategory, IncomeCategory } from '@/types/expense';

// CSV Headers
export const EXPENSE_CSV_HEADERS = [
  'id',
  'amount',
  'category',
  'description',
  'date',
  'createdAt',
  'updatedAt'
];

export const INCOME_CSV_HEADERS = [
  'id',
  'amount',
  'category',
  'description',
  'date',
  'isRecurring',
  'frequency',
  'createdAt',
  'updatedAt'
];

// Parse CSV string to expenses
export function parseExpensesFromCSV(csvContent: string): Expense[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return []; // Need at least header and one data row
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const expenses: Expense[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      
      const expense: Expense = {
        id: values[headers.indexOf('id')] || generateId(),
        amount: parseFloat(values[headers.indexOf('amount')] || '0'),
        category: (values[headers.indexOf('category')] || 'Other') as ExpenseCategory,
        description: values[headers.indexOf('description')] || '',
        date: values[headers.indexOf('date')] || new Date().toISOString().split('T')[0],
        createdAt: values[headers.indexOf('createdAt')] || new Date().toISOString(),
        updatedAt: values[headers.indexOf('updatedAt')] || new Date().toISOString()
      };
      
      expenses.push(expense);
    } catch (error) {
      console.warn(`Error parsing CSV line ${i + 1}:`, error);
    }
  }
  
  return expenses;
}

// Parse CSV string to income
export function parseIncomeFromCSV(csvContent: string): Income[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const incomes: Income[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;
      
      const income: Income = {
        id: values[headers.indexOf('id')] || generateId(),
        amount: parseFloat(values[headers.indexOf('amount')] || '0'),
        category: (values[headers.indexOf('category')] || 'Other') as IncomeCategory,
        description: values[headers.indexOf('description')] || '',
        date: values[headers.indexOf('date')] || new Date().toISOString().split('T')[0],
        isRecurring: values[headers.indexOf('isRecurring')] === 'true',
        frequency: values[headers.indexOf('frequency')] as Income['frequency'] || undefined,
        createdAt: values[headers.indexOf('createdAt')] || new Date().toISOString(),
        updatedAt: values[headers.indexOf('updatedAt')] || new Date().toISOString()
      };
      
      incomes.push(income);
    } catch (error) {
      console.warn(`Error parsing income CSV line ${i + 1}:`, error);
    }
  }
  
  return incomes;
}

// Convert expenses to CSV
export function expensesToCSV(expenses: Expense[]): string {
  const header = EXPENSE_CSV_HEADERS.join(',');
  const rows = expenses.map(expense => [
    `"${expense.id}"`,
    expense.amount.toString(),
    `"${expense.category}"`,
    `"${expense.description.replace(/"/g, '""')}"`,
    `"${expense.date}"`,
    `"${expense.createdAt}"`,
    `"${expense.updatedAt}"`
  ].join(','));
  
  return [header, ...rows].join('\n');
}

// Convert income to CSV
export function incomeToCSV(incomes: Income[]): string {
  const header = INCOME_CSV_HEADERS.join(',');
  const rows = incomes.map(income => [
    `"${income.id}"`,
    income.amount.toString(),
    `"${income.category}"`,
    `"${income.description.replace(/"/g, '""')}"`,
    `"${income.date}"`,
    income.isRecurring.toString(),
    `"${income.frequency || ''}"`,
    `"${income.createdAt}"`,
    `"${income.updatedAt}"`
  ].join(','));
  
  return [header, ...rows].join('\n');
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
}

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Download CSV file
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Create combined CSV with both expenses and income
export function createCombinedCSV(expenses: Expense[], incomes: Income[]): string {
  const expenseCSV = expensesToCSV(expenses);
  const incomeCSV = incomeToCSV(incomes);
  
  return `EXPENSES\n${expenseCSV}\n\nINCOME\n${incomeCSV}`;
}

// Parse combined CSV file
export function parseCombinedCSV(csvContent: string): { expenses: Expense[]; incomes: Income[] } {
  const lines = csvContent.split('\n');
  let expenses: Expense[] = [];
  let incomes: Income[] = [];
  
  let currentSection = '';
  let sectionLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === 'EXPENSES') {
      // Start of expenses section
      if (currentSection === 'INCOME' && sectionLines.length > 0) {
        // Process previous income section
        incomes = parseIncomeFromCSV(sectionLines.join('\n'));
      }
      currentSection = 'EXPENSES';
      sectionLines = [];
    } else if (trimmedLine === 'INCOME') {
      // Start of income section
      if (currentSection === 'EXPENSES' && sectionLines.length > 0) {
        // Process previous expenses section
        expenses = parseExpensesFromCSV(sectionLines.join('\n'));
      }
      currentSection = 'INCOME';
      sectionLines = [];
    } else if (trimmedLine && currentSection) {
      // Add line to current section
      sectionLines.push(line);
    }
  }
  
  // Process the last section
  if (currentSection === 'EXPENSES' && sectionLines.length > 0) {
    expenses = parseExpensesFromCSV(sectionLines.join('\n'));
  } else if (currentSection === 'INCOME' && sectionLines.length > 0) {
    incomes = parseIncomeFromCSV(sectionLines.join('\n'));
  }
  
  // Fallback: if no section headers found, try to detect by content
  if (expenses.length === 0 && incomes.length === 0) {
    const sections = csvContent.split(/\n\s*\n/);
    for (const section of sections) {
      const trimmedSection = section.trim();
      if (trimmedSection.includes('id,amount,category,description,date,createdAt,updatedAt')) {
        expenses = parseExpensesFromCSV(trimmedSection);
      } else if (trimmedSection.includes('isRecurring,frequency')) {
        incomes = parseIncomeFromCSV(trimmedSection);
      }
    }
  }
  
  return { expenses, incomes };
}
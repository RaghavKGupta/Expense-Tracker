'use client'

import { useState } from 'react'
import { csvStorage } from '@/lib/csvStorage'
import { db } from '@/lib/supabase/database'
import Button from '@/components/ui/Button'
import { Upload, Database, CheckCircle2, AlertCircle } from 'lucide-react'

export default function DataMigration() {
  const [migrationState, setMigrationState] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [counts, setCounts] = useState({ expenses: 0, incomes: 0 })

  const migrateData = async () => {
    setMigrationState('migrating')
    setMessage('Migrating your data...')

    try {
      // Get data from CSV storage
      const localData = csvStorage.migrateFromLocalStorage()
      const currentExpenses = csvStorage.getExpenses()
      const currentIncomes = csvStorage.getIncome()

      // Combine localStorage data with current session data
      const allExpenses = [...localData.expenses, ...currentExpenses]
      const allIncomes = [...localData.incomes, ...currentIncomes]

      setCounts({ expenses: allExpenses.length, incomes: allIncomes.length })

      if (allExpenses.length === 0 && allIncomes.length === 0) {
        setMessage('No data to migrate.')
        setMigrationState('success')
        return
      }

      // Migrate to database
      if (allExpenses.length > 0) {
        await db.bulkInsertExpenses(allExpenses.map(exp => ({
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          date: exp.date,
          paymentMethod: (exp as any).paymentMethod || undefined,
          tags: (exp as any).tags || [],
          receiptUrl: (exp as any).receiptUrl || undefined,
        })))
      }

      if (allIncomes.length > 0) {
        await db.bulkInsertIncomes(allIncomes.map(inc => ({
          amount: inc.amount,
          category: (inc as any).source || inc.category || 'Other',
          description: inc.description || '',
          date: inc.date,
          isRecurring: (inc as any).recurring || inc.isRecurring || false,
          frequency: (inc as any).recurringFrequency || inc.frequency || undefined,
        })))
      }

      // Clear local storage after successful migration
      csvStorage.clearLocalStorage()
      csvStorage.clearData()

      setMessage(`Successfully migrated ${allExpenses.length} expenses and ${allIncomes.length} incomes to the cloud!`)
      setMigrationState('success')
    } catch (error) {
      console.error('Migration error:', error)
      setMessage(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setMigrationState('error')
    }
  }

  const checkForData = () => {
    const localData = csvStorage.migrateFromLocalStorage()
    const currentExpenses = csvStorage.getExpenses()
    const currentIncomes = csvStorage.getIncome()
    
    const totalExpenses = localData.expenses.length + currentExpenses.length
    const totalIncomes = localData.incomes.length + currentIncomes.length
    
    return totalExpenses > 0 || totalIncomes > 0
  }

  if (!checkForData()) {
    return null
  }

  return (
    <div className="card p-6 border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Database className="h-6 w-6 text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            Migrate to Cloud Storage
          </h3>
          <p className="text-slate-400 mb-4">
            We found existing expense data. Migrate it to secure cloud storage to access it from anywhere and ensure it&apos;s always backed up.
          </p>

          {migrationState === 'idle' && (
            <Button
              onClick={migrateData}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Migrate Data to Cloud
            </Button>
          )}

          {migrationState === 'migrating' && (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span className="text-blue-400">Migrating...</span>
            </div>
          )}

          {migrationState === 'success' && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Migration Complete!</p>
                <p className="text-green-300/80 text-sm mt-1">{message}</p>
              </div>
            </div>
          )}

          {migrationState === 'error' && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Migration Failed</p>
                <p className="text-red-300/80 text-sm mt-1">{message}</p>
                <Button
                  onClick={migrateData}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
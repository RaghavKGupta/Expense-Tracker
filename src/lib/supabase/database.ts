import { createClient } from './client'
import { Expense, Income, CustomCategory } from '@/types/expense'

export class DatabaseService {
  private supabase = createClient()

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await this.supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      throw error
    }

    return data || []
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date,
        payment_method: expense.paymentMethod,
        tags: expense.tags,
        receipt_url: expense.receiptUrl,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding expense:', error)
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date,
      paymentMethod: data.payment_method,
      tags: data.tags || [],
      receiptUrl: data.receipt_url,
    }
  }

  async updateExpense(expense: Expense): Promise<Expense> {
    const { data, error } = await this.supabase
      .from('expenses')
      .update({
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date,
        payment_method: expense.paymentMethod,
        tags: expense.tags,
        receipt_url: expense.receiptUrl,
      })
      .eq('id', expense.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date,
      paymentMethod: data.payment_method,
      tags: data.tags || [],
      receiptUrl: data.receipt_url,
    }
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  // Income
  async getIncomes(): Promise<Income[]> {
    const { data, error } = await this.supabase
      .from('incomes')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching incomes:', error)
      throw error
    }

    return (data || []).map(item => ({
      id: item.id,
      amount: item.amount,
      category: item.source,
      description: item.description,
      date: item.date,
      isRecurring: item.recurring,
      frequency: item.recurring_frequency,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))
  }

  async addIncome(income: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>): Promise<Income> {
    const { data, error } = await this.supabase
      .from('incomes')
      .insert({
        amount: income.amount,
        source: income.category,
        description: income.description,
        date: income.date,
        recurring: income.isRecurring,
        recurring_frequency: income.frequency,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding income:', error)
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      category: data.source,
      description: data.description,
      date: data.date,
      isRecurring: data.recurring,
      frequency: data.recurring_frequency,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async updateIncome(income: Income): Promise<Income> {
    const { data, error } = await this.supabase
      .from('incomes')
      .update({
        amount: income.amount,
        source: income.category,
        description: income.description,
        date: income.date,
        recurring: income.isRecurring,
        recurring_frequency: income.frequency,
      })
      .eq('id', income.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating income:', error)
      throw error
    }

    return {
      id: data.id,
      amount: data.amount,
      category: data.source,
      description: data.description,
      date: data.date,
      isRecurring: data.recurring,
      frequency: data.recurring_frequency,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async deleteIncome(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('incomes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting income:', error)
      throw error
    }
  }

  // Custom Categories
  async getCustomCategories(): Promise<CustomCategory[]> {
    const { data, error } = await this.supabase
      .from('custom_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching custom categories:', error)
      throw error
    }

    return data || []
  }

  async addCustomCategory(category: Omit<CustomCategory, 'id'>): Promise<CustomCategory> {
    const { data, error } = await this.supabase
      .from('custom_categories')
      .insert(category)
      .select()
      .single()

    if (error) {
      console.error('Error adding custom category:', error)
      throw error
    }

    return data
  }

  async updateCustomCategory(category: CustomCategory): Promise<CustomCategory> {
    const { data, error } = await this.supabase
      .from('custom_categories')
      .update(category)
      .eq('id', category.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating custom category:', error)
      throw error
    }

    return data
  }

  async deleteCustomCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('custom_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting custom category:', error)
      throw error
    }
  }

  // Bulk operations for data migration
  async bulkInsertExpenses(expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const { error } = await this.supabase
      .from('expenses')
      .insert(expenses.map(expense => ({
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date,
        payment_method: expense.paymentMethod,
        tags: expense.tags,
        receipt_url: expense.receiptUrl,
      })))

    if (error) {
      console.error('Error bulk inserting expenses:', error)
      throw error
    }
  }

  async bulkInsertIncomes(incomes: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const { error } = await this.supabase
      .from('incomes')
      .insert(incomes.map(income => ({
        amount: income.amount,
        source: income.category,
        description: income.description,
        date: income.date,
        recurring: income.isRecurring,
        recurring_frequency: income.frequency,
      })))

    if (error) {
      console.error('Error bulk inserting incomes:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const db = new DatabaseService()
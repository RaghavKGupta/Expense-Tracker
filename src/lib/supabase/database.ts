import { createClient } from './client'
import { Expense, Income, CustomCategory } from '@/types/expense'
import { Asset, Liability, NetWorthSnapshot } from '@/types/financial'

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
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('expenses')
      .insert(expenses.map(expense => ({
        user_id: user.id,
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
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('incomes')
      .insert(incomes.map(income => ({
        user_id: user.id,
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

  // Assets
  async getAssets(): Promise<Asset[]> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching assets:', error)
      throw error
    }

    return (data || []).map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      currentValue: asset.value,
      description: asset.description,
      lastUpdated: asset.updated_at,
      isTracked: false,
      valuationHistory: [{
        date: asset.created_at.split('T')[0],
        value: asset.value,
        note: 'Initial valuation'
      }]
    }))
  }

  async addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await this.supabase
      .from('assets')
      .insert({
        user_id: user.id,
        name: asset.name,
        category: asset.category,
        value: asset.currentValue,
        description: asset.description,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding asset:', error)
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentValue: data.value,
      description: data.description,
      lastUpdated: data.updated_at,
      isTracked: false,
      valuationHistory: [{
        date: data.created_at.split('T')[0],
        value: data.value,
        note: 'Initial valuation'
      }]
    }
  }

  async updateAsset(asset: Asset): Promise<Asset> {
    const { data, error } = await this.supabase
      .from('assets')
      .update({
        name: asset.name,
        category: asset.category,
        value: asset.currentValue,
        description: asset.description,
      })
      .eq('id', asset.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset:', error)
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentValue: data.value,
      description: data.description,
      lastUpdated: data.updated_at,
      isTracked: asset.isTracked,
      valuationHistory: asset.valuationHistory
    }
  }

  async deleteAsset(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting asset:', error)
      throw error
    }
  }

  // Liabilities
  async getLiabilities(): Promise<Liability[]> {
    const { data, error } = await this.supabase
      .from('liabilities')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching liabilities:', error)
      throw error
    }

    return (data || []).map(liability => ({
      id: liability.id,
      name: liability.name,
      category: liability.category,
      currentBalance: liability.amount,
      interestRate: liability.interest_rate,
      minimumPayment: liability.minimum_payment,
      description: liability.description,
      startDate: liability.created_at.split('T')[0],
      lastUpdated: liability.updated_at,
      paymentHistory: []
    }))
  }

  async addLiability(liability: Omit<Liability, 'id'>): Promise<Liability> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await this.supabase
      .from('liabilities')
      .insert({
        user_id: user.id,
        name: liability.name,
        category: liability.category,
        amount: liability.currentBalance,
        interest_rate: liability.interestRate,
        minimum_payment: liability.minimumPayment,
        description: liability.description,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding liability:', error)
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentBalance: data.amount,
      interestRate: data.interest_rate,
      minimumPayment: data.minimum_payment,
      description: data.description,
      startDate: data.created_at.split('T')[0],
      lastUpdated: data.updated_at,
      paymentHistory: []
    }
  }

  async updateLiability(liability: Liability): Promise<Liability> {
    const { data, error } = await this.supabase
      .from('liabilities')
      .update({
        name: liability.name,
        category: liability.category,
        amount: liability.currentBalance,
        interest_rate: liability.interestRate,
        minimum_payment: liability.minimumPayment,
        description: liability.description,
      })
      .eq('id', liability.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating liability:', error)
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      currentBalance: data.amount,
      interestRate: data.interest_rate,
      minimumPayment: data.minimum_payment,
      description: data.description,
      startDate: liability.startDate,
      lastUpdated: data.updated_at,
      paymentHistory: liability.paymentHistory
    }
  }

  async deleteLiability(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('liabilities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting liability:', error)
      throw error
    }
  }

  // Networth Snapshots
  async getNetWorthSnapshots(): Promise<NetWorthSnapshot[]> {
    const { data, error } = await this.supabase
      .from('networth_snapshots')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching networth snapshots:', error)
      throw error
    }

    return (data || []).map(snapshot => ({
      date: snapshot.date,
      totalAssets: snapshot.total_assets,
      totalLiabilities: snapshot.total_liabilities,
      netWorth: snapshot.net_worth,
      assetBreakdown: snapshot.asset_breakdown || {},
      liabilityBreakdown: snapshot.liability_breakdown || {},
    }))
  }

  async saveNetWorthSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase
      .from('networth_snapshots')
      .upsert({
        user_id: user.id,
        date: snapshot.date,
        total_assets: snapshot.totalAssets,
        total_liabilities: snapshot.totalLiabilities,
        net_worth: snapshot.netWorth,
        asset_breakdown: snapshot.assetBreakdown,
        liability_breakdown: snapshot.liabilityBreakdown,
      })

    if (error) {
      console.error('Error saving networth snapshot:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const db = new DatabaseService()
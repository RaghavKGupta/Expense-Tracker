import { Expense } from '@/types/expense';
import { Subscription } from '@/types/financial';
import { storage } from '@/lib/storage';
import { financialStorage } from '@/lib/financialStorage';
import { calculateNextBillingDate, generateRecurringExpenses } from '@/lib/financialCalculations';
import { format, isAfter, isBefore, parseISO, addDays } from 'date-fns';

export class RecurringExpenseService {
  private static instance: RecurringExpenseService;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAutoGeneration();
  }

  public static getInstance(): RecurringExpenseService {
    if (!RecurringExpenseService.instance) {
      RecurringExpenseService.instance = new RecurringExpenseService();
    }
    return RecurringExpenseService.instance;
  }

  public startAutoGeneration(): void {
    // Check every hour for due subscriptions
    this.intervalId = setInterval(() => {
      this.processRecurringExpenses();
    }, 60 * 60 * 1000); // 1 hour

    // Also run immediately
    this.processRecurringExpenses();
  }

  public stopAutoGeneration(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public processRecurringExpenses(): void {
    try {
      const subscriptions = financialStorage.getSubscriptions();
      const expenses = storage.getExpenses();
      
      let generated = 0;
      const today = new Date();
      
      subscriptions
        .filter(sub => sub.isActive && sub.autoGenerate)
        .forEach(subscription => {
          const nextBilling = parseISO(subscription.nextBilling);
          
          // Generate if due today or overdue
          if (nextBilling <= today) {
            const generatedExpense = this.generateExpenseFromSubscription(subscription, expenses);
            if (generatedExpense) {
              storage.addExpense(generatedExpense);
              this.updateSubscriptionAfterBilling(subscription);
              generated++;
            }
          }
        });

      if (generated > 0) {
        console.log(`Auto-generated ${generated} recurring expenses`);
        this.notifyUser(generated);
      }
    } catch (error) {
      console.error('Error processing recurring expenses:', error);
    }
  }

  private generateExpenseFromSubscription(
    subscription: Subscription, 
    existingExpenses: Expense[]
  ): Expense | null {
    const billingDate = subscription.nextBilling;
    
    // Check if expense already exists for this billing period
    const existingExpense = existingExpenses.find(exp => 
      exp.date === billingDate &&
      exp.subscriptionId === subscription.id
    );

    if (existingExpense) {
      return null; // Already exists
    }

    // Check if subscription has ended
    if (subscription.endDate) {
      const endDate = parseISO(subscription.endDate);
      if (isAfter(parseISO(billingDate), endDate)) {
        // Subscription has ended, deactivate it
        const updatedSubscription = { ...subscription, isActive: false };
        financialStorage.updateSubscription(updatedSubscription);
        return null;
      }
    }

    return {
      id: `auto-${subscription.id}-${billingDate}`,
      description: `${subscription.name} (Auto-generated)`,
      amount: subscription.amount,
      category: subscription.category as any,
      date: billingDate,
      createdAt: new Date().toISOString(),
      isRecurring: true,
      subscriptionId: subscription.id
    };
  }

  private updateSubscriptionAfterBilling(subscription: Subscription): void {
    const updatedSubscription = {
      ...subscription,
      lastBilled: subscription.nextBilling,
      nextBilling: calculateNextBillingDate({
        ...subscription,
        lastBilled: subscription.nextBilling
      }),
      billingHistory: [
        ...subscription.billingHistory,
        {
          date: subscription.nextBilling,
          amount: subscription.amount,
          status: 'billed' as const
        }
      ]
    };

    financialStorage.updateSubscription(updatedSubscription);
  }

  public manuallyGenerateUpcoming(daysAhead: number = 7): number {
    const subscriptions = financialStorage.getSubscriptions();
    const expenses = storage.getExpenses();
    const cutoffDate = addDays(new Date(), daysAhead);
    
    let generated = 0;

    subscriptions
      .filter(sub => sub.isActive && sub.autoGenerate)
      .forEach(subscription => {
        const nextBilling = parseISO(subscription.nextBilling);
        
        if (nextBilling <= cutoffDate) {
          const generatedExpense = this.generateExpenseFromSubscription(subscription, expenses);
          if (generatedExpense) {
            storage.addExpense(generatedExpense);
            this.updateSubscriptionAfterBilling(subscription);
            generated++;
          }
        }
      });

    return generated;
  }

  public getUpcomingRecurringExpenses(daysAhead: number = 30): {
    subscription: Subscription;
    dueDate: string;
    amount: number;
    daysUntilDue: number;
  }[] {
    const subscriptions = financialStorage.getSubscriptions();
    const cutoffDate = addDays(new Date(), daysAhead);
    const today = new Date();

    return subscriptions
      .filter(sub => sub.isActive)
      .map(subscription => {
        const dueDate = parseISO(subscription.nextBilling);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          subscription,
          dueDate: subscription.nextBilling,
          amount: subscription.amount,
          daysUntilDue
        };
      })
      .filter(item => parseISO(item.dueDate) <= cutoffDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  private notifyUser(count: number): void {
    // In a real app, this could show a notification
    // For now, we'll just log to console
    console.log(`✅ Generated ${count} recurring expense${count === 1 ? '' : 's'}`);
  }

  public getRecurringExpenseStats(): {
    activeSubscriptions: number;
    autoGeneratingSubscriptions: number;
    monthlyRecurringTotal: number;
    nextUpcoming: { name: string; date: string; amount: number } | null;
  } {
    const subscriptions = financialStorage.getSubscriptions();
    const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
    const autoGenerating = activeSubscriptions.filter(sub => sub.autoGenerate);
    
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      switch (sub.frequency) {
        case 'weekly':
          return total + (sub.amount * 52 / 12);
        case 'monthly':
          return total + sub.amount;
        case 'quarterly':
          return total + (sub.amount / 3);
        case 'yearly':
          return total + (sub.amount / 12);
        default:
          return total;
      }
    }, 0);

    const upcoming = this.getUpcomingRecurringExpenses(30);
    const nextUpcoming = upcoming.length > 0 ? {
      name: upcoming[0].subscription.name,
      date: upcoming[0].dueDate,
      amount: upcoming[0].amount
    } : null;

    return {
      activeSubscriptions: activeSubscriptions.length,
      autoGeneratingSubscriptions: autoGenerating.length,
      monthlyRecurringTotal: monthlyTotal,
      nextUpcoming
    };
  }
}

// Initialize the service when this module is imported
export const recurringExpenseService = RecurringExpenseService.getInstance();
import { Asset, Liability, Subscription, NetWorthSnapshot } from '@/types/financial';

const ASSETS_STORAGE_KEY = 'expense-tracker-assets';
const LIABILITIES_STORAGE_KEY = 'expense-tracker-liabilities';
const SUBSCRIPTIONS_STORAGE_KEY = 'expense-tracker-subscriptions';
const NETWORTH_STORAGE_KEY = 'expense-tracker-networth-history';

export const financialStorage = {
  // Asset management
  getAssets(): Asset[] {
    try {
      const data = localStorage.getItem(ASSETS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAssets(assets: Asset[]): void {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  },

  addAsset(asset: Asset): void {
    const assets = this.getAssets();
    assets.push(asset);
    this.saveAssets(assets);
  },

  updateAsset(updatedAsset: Asset): void {
    const assets = this.getAssets();
    const index = assets.findIndex(asset => asset.id === updatedAsset.id);
    if (index !== -1) {
      assets[index] = updatedAsset;
      this.saveAssets(assets);
    }
  },

  deleteAsset(assetId: string): void {
    const assets = this.getAssets().filter(asset => asset.id !== assetId);
    this.saveAssets(assets);
  },

  // Liability management
  getLiabilities(): Liability[] {
    try {
      const data = localStorage.getItem(LIABILITIES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLiabilities(liabilities: Liability[]): void {
    localStorage.setItem(LIABILITIES_STORAGE_KEY, JSON.stringify(liabilities));
  },

  addLiability(liability: Liability): void {
    const liabilities = this.getLiabilities();
    liabilities.push(liability);
    this.saveLiabilities(liabilities);
  },

  updateLiability(updatedLiability: Liability): void {
    const liabilities = this.getLiabilities();
    const index = liabilities.findIndex(liability => liability.id === updatedLiability.id);
    if (index !== -1) {
      liabilities[index] = updatedLiability;
      this.saveLiabilities(liabilities);
    }
  },

  deleteLiability(liabilityId: string): void {
    const liabilities = this.getLiabilities().filter(liability => liability.id !== liabilityId);
    this.saveLiabilities(liabilities);
  },

  // Subscription management
  getSubscriptions(): Subscription[] {
    try {
      const data = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSubscriptions(subscriptions: Subscription[]): void {
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions));
  },

  addSubscription(subscription: Subscription): void {
    const subscriptions = this.getSubscriptions();
    subscriptions.push(subscription);
    this.saveSubscriptions(subscriptions);
  },

  updateSubscription(updatedSubscription: Subscription): void {
    const subscriptions = this.getSubscriptions();
    const index = subscriptions.findIndex(sub => sub.id === updatedSubscription.id);
    if (index !== -1) {
      subscriptions[index] = updatedSubscription;
      this.saveSubscriptions(subscriptions);
    }
  },

  deleteSubscription(subscriptionId: string): void {
    const subscriptions = this.getSubscriptions().filter(sub => sub.id !== subscriptionId);
    this.saveSubscriptions(subscriptions);
  },

  // Net worth tracking
  getNetWorthHistory(): NetWorthSnapshot[] {
    try {
      const data = localStorage.getItem(NETWORTH_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNetWorthSnapshot(snapshot: NetWorthSnapshot): void {
    const history = this.getNetWorthHistory();
    
    // Remove any existing snapshot for the same date
    const filteredHistory = history.filter(snap => snap.date !== snapshot.date);
    
    // Add new snapshot and sort by date
    filteredHistory.push(snapshot);
    filteredHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    localStorage.setItem(NETWORTH_STORAGE_KEY, JSON.stringify(filteredHistory));
  },

  clearNetWorthHistory(): void {
    localStorage.removeItem(NETWORTH_STORAGE_KEY);
  }
};
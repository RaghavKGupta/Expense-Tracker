'use client';

import { useEffect, useState } from 'react';
import { Asset, Liability, NetWorthSnapshot } from '@/types/financial';
import { financialStorage } from '@/lib/financialStorage';
import { generateNetWorthSnapshot } from '@/lib/financialCalculations';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { format, subMonths, startOfMonth } from 'date-fns';
import Link from 'next/link';

export default function NetWorthPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<NetWorthSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = () => {
    const loadedAssets = financialStorage.getAssets();
    const loadedLiabilities = financialStorage.getLiabilities();
    const history = financialStorage.getNetWorthHistory();
    
    setAssets(loadedAssets);
    setLiabilities(loadedLiabilities);
    setNetWorthHistory(history);
    
    // Generate current snapshot
    const previousSnapshot = history.length > 0 ? history[history.length - 1] : undefined;
    const snapshot = generateNetWorthSnapshot(loadedAssets, loadedLiabilities, previousSnapshot);
    setCurrentSnapshot(snapshot);
    
    setIsLoading(false);
  };

  const handleSaveSnapshot = () => {
    if (currentSnapshot) {
      financialStorage.saveNetWorthSnapshot(currentSnapshot);
      setNetWorthHistory(prev => {
        const filtered = prev.filter(snap => snap.date !== currentSnapshot.date);
        return [...filtered, currentSnapshot].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
    }
  };

  const getNetWorthTrend = () => {
    if (netWorthHistory.length < 2) return null;
    
    const latest = netWorthHistory[netWorthHistory.length - 1];
    const previous = netWorthHistory[netWorthHistory.length - 2];
    
    const change = latest.netWorth - previous.netWorth;
    const percentage = previous.netWorth !== 0 
      ? (change / Math.abs(previous.netWorth)) * 100 
      : 0;
    
    return { change, percentage };
  };

  const trend = getNetWorthTrend();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentSnapshot) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Financial Data</h3>
          <p className="text-slate-400 mb-6">Add assets and liabilities to track your net worth</p>
          <div className="flex gap-4 justify-center">
            <Link href="/assets">
              <Button>Add Assets</Button>
            </Link>
            <Link href="/liabilities">
              <Button variant="outline">Add Liabilities</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Net Worth Tracking
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Your complete financial picture
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadFinancialData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </Button>
          <Button
            onClick={handleSaveSnapshot}
            className="flex items-center gap-2"
          >
            <Calendar className="h-5 w-5" />
            Save Snapshot
          </Button>
        </div>
      </div>

      {/* Current Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2 card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${
              currentSnapshot.netWorth >= 0 
                ? 'bg-green-500 bg-opacity-20' 
                : 'bg-red-500 bg-opacity-20'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                currentSnapshot.netWorth >= 0 ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Current Net Worth</p>
              <p className={`text-3xl font-bold ${
                currentSnapshot.netWorth >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(currentSnapshot.netWorth)}
              </p>
            </div>
            {trend && (
              <div className="text-right">
                <div className={`flex items-center gap-1 text-sm ${
                  trend.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trend.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
                </div>
                <p className="text-xs text-slate-400">vs last snapshot</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <Plus className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(currentSnapshot.totalAssets)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
              <Minus className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Liabilities</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(currentSnapshot.totalLiabilities)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset & Liability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Assets Breakdown */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <PieChart className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Assets Breakdown</h3>
              <p className="text-sm text-slate-400">{assets.length} assets tracked</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(currentSnapshot.assetBreakdown)
              .filter(([, amount]) => amount > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = currentSnapshot.totalAssets > 0 
                  ? (amount / currentSnapshot.totalAssets) * 100 
                  : 0;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">{category}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(amount)}
                        </span>
                        <p className="text-xs text-slate-400">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <Link href="/assets">
              <Button variant="outline" className="w-full">
                Manage Assets
              </Button>
            </Link>
          </div>
        </div>

        {/* Liabilities Breakdown */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500 bg-opacity-20 rounded-xl">
              <PieChart className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Liabilities Breakdown</h3>
              <p className="text-sm text-slate-400">{liabilities.length} debts tracked</p>
            </div>
          </div>
          
          {currentSnapshot.totalLiabilities === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No liabilities tracked</p>
              <Link href="/liabilities">
                <Button variant="outline">Add Liabilities</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(currentSnapshot.liabilityBreakdown)
                .filter(([, amount]) => amount > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = currentSnapshot.totalLiabilities > 0 
                    ? (amount / currentSnapshot.totalLiabilities) * 100 
                    : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-300">{category}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(amount)}
                          </span>
                          <p className="text-xs text-slate-400">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-slate-700">
            <Link href="/liabilities">
              <Button variant="outline" className="w-full">
                Manage Liabilities
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Net Worth History */}
      {netWorthHistory.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500 bg-opacity-20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Net Worth History</h3>
              <p className="text-sm text-slate-400">{netWorthHistory.length} snapshots saved</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {netWorthHistory
              .slice(-10) // Show last 10 snapshots
              .reverse()
              .map((snapshot, index) => {
                const prevSnapshot = index < netWorthHistory.length - 1 
                  ? netWorthHistory[netWorthHistory.length - 2 - index] 
                  : null;
                
                let change = null;
                if (prevSnapshot) {
                  change = snapshot.netWorth - prevSnapshot.netWorth;
                }
                
                return (
                  <div key={snapshot.date} className="flex justify-between items-center p-4 bg-slate-700 bg-opacity-30 rounded-lg">
                    <div>
                      <p className="font-medium text-white">
                        {format(new Date(snapshot.date), 'MMM dd, yyyy')}
                      </p>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Assets: {formatCurrency(snapshot.totalAssets)}</span>
                        <span>Debts: {formatCurrency(snapshot.totalLiabilities)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        snapshot.netWorth >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(snapshot.netWorth)}
                      </p>
                      {change !== null && (
                        <div className={`flex items-center gap-1 text-sm ${
                          change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{formatCurrency(Math.abs(change))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
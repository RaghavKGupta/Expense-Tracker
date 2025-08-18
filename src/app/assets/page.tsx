'use client';

import { useEffect, useState } from 'react';
import { Asset, AssetCategory } from '@/types/financial';
import { db } from '@/lib/supabase/database';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Home,
  Car,
  Building2,
  Wallet,
  Edit2,
  Trash2,
  History
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { format } from 'date-fns';

const ASSET_CATEGORIES: { value: AssetCategory; label: string; icon: React.ElementType }[] = [
  { value: 'Cash & Bank Accounts', label: 'Cash & Bank Accounts', icon: Wallet },
  { value: 'Investments', label: 'Investments', icon: TrendingUp },
  { value: 'Real Estate', label: 'Real Estate', icon: Home },
  { value: 'Vehicles', label: 'Vehicles', icon: Car },
  { value: 'Personal Property', label: 'Personal Property', icon: Building2 },
  { value: 'Retirement Accounts', label: 'Retirement Accounts', icon: DollarSign },
  { value: 'Other Assets', label: 'Other Assets', icon: Building2 }
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showValuationModal, setShowValuationModal] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const loadedAssets = await db.getAssets();
      setAssets(loadedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async (assetData: Partial<Asset>) => {
    try {
      const newAsset = await db.addAsset({
        name: assetData.name || '',
        category: assetData.category || 'Other Assets',
        currentValue: assetData.currentValue || 0,
        purchasePrice: assetData.purchasePrice,
        purchaseDate: assetData.purchaseDate,
        description: assetData.description,
        lastUpdated: new Date().toISOString(),
        isTracked: assetData.isTracked || false,
        valuationHistory: [{
          date: new Date().toISOString().split('T')[0],
          value: assetData.currentValue || 0,
          note: 'Initial valuation'
        }]
      });
      
      setAssets(prev => [...prev, newAsset]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleUpdateAsset = async (updatedAsset: Asset) => {
    try {
      await db.updateAsset(updatedAsset);
      setAssets(prev => prev.map(asset => 
        asset.id === updatedAsset.id ? updatedAsset : asset
      ));
      setEditingAsset(null);
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await db.deleteAsset(assetId);
        setAssets(prev => prev.filter(asset => asset.id !== assetId));
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const handleUpdateValuation = (asset: Asset, newValue: number, note?: string) => {
    const updatedAsset = {
      ...asset,
      currentValue: newValue,
      lastUpdated: new Date().toISOString(),
      valuationHistory: [
        ...asset.valuationHistory,
        {
          date: new Date().toISOString().split('T')[0],
          value: newValue,
          note: note || ''
        }
      ]
    };
    
    handleUpdateAsset(updatedAsset);
    setShowValuationModal(null);
  };

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const assetsByCategory = assets.reduce((groups, asset) => {
    if (!groups[asset.category]) groups[asset.category] = [];
    groups[asset.category].push(asset);
    return groups;
  }, {} as Record<AssetCategory, Asset[]>);

  const categoryTotals = Object.entries(assetsByCategory).map(([category, categoryAssets]) => ({
    category: category as AssetCategory,
    total: categoryAssets.reduce((sum, asset) => sum + asset.currentValue, 0),
    count: categoryAssets.length,
    assets: categoryAssets
  })).sort((a, b) => b.total - a.total);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Asset Management
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Track and manage your assets
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 bg-opacity-20 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Assets</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalAssetValue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Categories</p>
              <p className="text-2xl font-bold text-white">
                {Object.keys(assetsByCategory).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 bg-opacity-20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Items</p>
              <p className="text-2xl font-bold text-white">
                {assets.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets by Category */}
      {categoryTotals.length === 0 ? (
        <div className="card p-12 text-center">
          <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Assets Added</h3>
          <p className="text-slate-400 mb-6">Start tracking your assets to monitor your net worth</p>
          <Button onClick={() => setShowAddModal(true)}>
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {categoryTotals.map(({ category, total, count, assets: categoryAssets }) => {
            const categoryInfo = ASSET_CATEGORIES.find(cat => cat.value === category);
            const Icon = categoryInfo?.icon || Building2;
            
            return (
              <div key={category} className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500 bg-opacity-20 rounded-xl">
                      <Icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{category}</h3>
                      <p className="text-sm text-slate-400">
                        {count} {count === 1 ? 'asset' : 'assets'} • {formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onEdit={() => setEditingAsset(asset)}
                      onDelete={() => handleDeleteAsset(asset.id)}
                      onUpdateValuation={() => setShowValuationModal(asset)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {(showAddModal || editingAsset) && (
        <AssetModal
          asset={editingAsset}
          onSave={editingAsset ? 
            (assetData: Partial<Asset>) => handleUpdateAsset({...editingAsset, ...assetData} as Asset) : 
            handleAddAsset
          }
          onClose={() => {
            setShowAddModal(false);
            setEditingAsset(null);
          }}
        />
      )}

      {/* Valuation Update Modal */}
      {showValuationModal && (
        <ValuationModal
          asset={showValuationModal}
          onSave={handleUpdateValuation}
          onClose={() => setShowValuationModal(null)}
        />
      )}
    </div>
  );
}

function AssetCard({ 
  asset, 
  onEdit, 
  onDelete, 
  onUpdateValuation 
}: { 
  asset: Asset; 
  onEdit: () => void; 
  onDelete: () => void;
  onUpdateValuation: () => void;
}) {
  const purchasePrice = asset.purchasePrice || 0;
  const currentValue = asset.currentValue;
  const gain = currentValue - purchasePrice;
  const gainPercentage = purchasePrice > 0 ? (gain / purchasePrice) * 100 : 0;

  return (
    <div className="p-4 bg-slate-700 bg-opacity-30 rounded-lg card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">{asset.name}</h4>
          <p className="text-sm text-slate-400">{asset.description}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpdateValuation}
            className="p-1 h-8 w-8"
            title="Update valuation"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="p-1 h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="p-1 h-8 w-8 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-lg font-bold text-white">
            {formatCurrency(currentValue)}
          </p>
          <p className="text-xs text-slate-400">
            Current Value
          </p>
        </div>
        
        {purchasePrice > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Purchase: {formatCurrency(purchasePrice)}
            </span>
            <div className={`flex items-center gap-1 ${
              gain >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {gain >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(gainPercentage).toFixed(1)}%</span>
            </div>
          </div>
        )}
        
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
          Updated: {format(new Date(asset.lastUpdated), 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
}

function AssetModal({ 
  asset, 
  onSave, 
  onClose 
}: { 
  asset?: Asset | null;
  onSave: (asset: Partial<Asset>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: asset?.category || 'Other Assets',
    currentValue: asset?.currentValue?.toString() || '',
    purchasePrice: asset?.purchasePrice?.toString() || '',
    purchaseDate: asset?.purchaseDate || '',
    description: asset?.description || '',
    isTracked: asset?.isTracked || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      currentValue: parseFloat(formData.currentValue),
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Asset Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g., Primary Residence"
            required
          />
          
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value as AssetCategory})}
            options={ASSET_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }))}
            required
          />
          
          <Input
            label="Current Value"
            type="number"
            step="0.01"
            value={formData.currentValue}
            onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
            placeholder="0.00"
            required
          />
          
          <Input
            label="Purchase Price (Optional)"
            type="number"
            step="0.01"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
            placeholder="0.00"
          />
          
          <Input
            label="Purchase Date (Optional)"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
          />
          
          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Brief description"
          />
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isTracked}
              onChange={(e) => setFormData({...formData, isTracked: e.target.checked})}
              className="rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Track value changes over time</span>
          </label>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {asset ? 'Update Asset' : 'Add Asset'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ValuationModal({ 
  asset, 
  onSave, 
  onClose 
}: { 
  asset: Asset;
  onSave: (asset: Asset, newValue: number, note?: string) => void;
  onClose: () => void;
}) {
  const [newValue, setNewValue] = useState(asset.currentValue.toString());
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(asset, parseFloat(newValue), note);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Update Valuation</h2>
          <p className="text-sm text-slate-400 mt-1">{asset.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">
              Current Value: {formatCurrency(asset.currentValue)}
            </p>
          </div>
          
          <Input
            label="New Value"
            type="number"
            step="0.01"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="0.00"
            required
          />
          
          <Input
            label="Note (Optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for valuation change"
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Update Valuation
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
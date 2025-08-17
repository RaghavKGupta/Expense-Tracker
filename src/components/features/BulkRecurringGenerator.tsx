'use client';

import { useState } from 'react';
import { 
  generateAllHistoricalEntries, 
  analyzeRecurringEntries, 
  validateBulkGeneration,
  cleanupDuplicateEntries,
  BulkGenerationResult 
} from '@/lib/bulkRecurringService';
import Button from '@/components/ui/Button';
import { 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  RefreshCw,
  Trash2,
  Eye,
  Play
} from 'lucide-react';

interface BulkRecurringGeneratorProps {
  onComplete?: () => void;
}

export default function BulkRecurringGenerator({ onComplete }: BulkRecurringGeneratorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeRecurringEntries> | null>(null);
  const [validation, setValidation] = useState<ReturnType<typeof validateBulkGeneration> | null>(null);
  const [result, setResult] = useState<BulkGenerationResult | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const analysisResult = analyzeRecurringEntries();
      const validationResult = validateBulkGeneration();
      
      setAnalysis(analysisResult);
      setValidation(validationResult);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error analyzing entries:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const previewResult = await generateAllHistoricalEntries({ dryRun: true });
      setResult(previewResult);
    } catch (error) {
      console.error('Error previewing generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generateResult = await generateAllHistoricalEntries({ skipExisting: true });
      setResult(generateResult);
      
      if (generateResult.success && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error generating entries:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const cleanupResult = await cleanupDuplicateEntries();
      if (cleanupResult.success) {
        alert(`Removed ${cleanupResult.duplicatesRemoved.income} duplicate income entries and ${cleanupResult.duplicatesRemoved.expenses} duplicate expense entries.`);
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center">
          <History className="h-5 w-5 mr-2 text-blue-400" />
          Bulk Historical Generation
        </h3>
        <p className="text-slate-400 text-sm">
          Generate historical entries for all existing recurring income and subscriptions
        </p>
      </div>

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            variant="outline"
            className="flex items-center"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Analyze Recurring Entries
          </Button>

          {showAnalysis && (
            <>
              <Button
                onClick={handlePreview}
                disabled={isGenerating}
                variant="outline"
                className="flex items-center"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview Generation
              </Button>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (validation ? !validation.isValid : true)}
                className="flex items-center bg-gradient-to-r from-green-500 to-blue-500"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Generate All Entries
              </Button>
            </>
          )}

          <Button
            onClick={handleCleanup}
            disabled={isCleaning}
            variant="outline"
            className="flex items-center text-orange-400"
          >
            {isCleaning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clean Duplicates
          </Button>
        </div>

        {/* Analysis Results */}
        {showAnalysis && analysis && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
            <h4 className="text-sm font-semibold text-white mb-3">Analysis Results</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-slate-400">Recurring Income:</span>
                <span className="text-green-400 font-medium ml-2">{analysis.recurringIncomes.length}</span>
              </div>
              <div>
                <span className="text-slate-400">Historical Subscriptions:</span>
                <span className="text-orange-400 font-medium ml-2">{analysis.historicalSubscriptions.length}</span>
              </div>
              <div>
                <span className="text-slate-400">Potential Income Entries:</span>
                <span className="text-white font-medium ml-2">{analysis.potentialEntries.income}</span>
              </div>
              <div>
                <span className="text-slate-400">Potential Expense Entries:</span>
                <span className="text-white font-medium ml-2">{analysis.potentialEntries.expenses}</span>
              </div>
            </div>

            <div className="text-center p-3 bg-slate-700 rounded-lg">
              <span className="text-slate-400">Total Potential Entries: </span>
              <span className="text-blue-400 font-bold text-lg">{analysis.potentialEntries.total}</span>
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validation && (validation.warnings.length > 0 || validation.recommendations.length > 0) && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mr-2" />
              <h4 className="text-sm font-semibold text-amber-400">Warnings & Recommendations</h4>
            </div>
            
            {validation.warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="text-amber-200 text-sm mb-1">
                • {warning}
              </div>
            ))}
            
            {validation.recommendations.map((rec, index) => (
              <div key={`rec-${index}`} className="text-amber-300 text-sm mb-1 ml-4">
                → {rec}
              </div>
            ))}
          </div>
        )}

        {/* Generation Results */}
        {result && (
          <div className={`rounded-lg p-4 border ${
            result.success 
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center mb-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <h4 className="text-sm font-semibold text-white">
                {result.success ? 'Generation Completed' : 'Generation Failed'}
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="text-slate-400">Income Entries:</span>
                <span className="text-green-400 font-medium ml-2">{result.generated.incomeEntries}</span>
              </div>
              <div>
                <span className="text-slate-400">Expense Entries:</span>
                <span className="text-red-400 font-medium ml-2">{result.generated.expenseEntries}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Added:</span>
                <span className="text-white font-medium ml-2">{result.totalEntriesAdded}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h5 className="text-red-400 text-sm font-medium mb-2">Errors:</h5>
                {result.errors.map((error, index) => (
                  <div key={index} className="text-red-300 text-xs mb-1">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
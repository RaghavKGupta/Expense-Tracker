'use client';

import { useState, useEffect } from 'react';
import { csvStorage } from '@/lib/csvStorage';
import Button from '@/components/ui/Button';
import { Download, X, Save } from 'lucide-react';

export default function SaveReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const [sessionChanges, setSessionChanges] = useState(0);

  useEffect(() => {
    // Subscribe to storage changes
    const unsubscribe = csvStorage.subscribe(() => {
      const changes = csvStorage.getSessionChanges();
      setSessionChanges(changes);
      setShowReminder(changes > 0);
    });

    // Initial check
    const changes = csvStorage.getSessionChanges();
    setSessionChanges(changes);
    setShowReminder(changes > 0);

    return unsubscribe;
  }, []);

  const handleExport = () => {
    csvStorage.exportToCSV();
    csvStorage.resetSessionChanges();
    setShowReminder(false);
    setSessionChanges(0);
  };

  const handleDismiss = () => {
    setShowReminder(false);
  };

  if (!showReminder) {
    return null;
  }

  return (
    <>
      {/* Floating save reminder */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg border border-orange-400 max-w-sm">
          <div className="flex items-start gap-3">
            <Save className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">Unsaved Changes</h4>
              <p className="text-xs text-orange-100 mt-1">
                You have {sessionChanges} unsaved change{sessionChanges !== 1 ? 's' : ''}. 
                Export your data to save progress.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleExport}
                  size="sm"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-10"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed header reminder for mobile */}
      <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center text-sm z-40 md:hidden">
        <div className="flex items-center justify-center gap-2">
          <Save className="h-4 w-4" />
          <span>{sessionChanges} unsaved changes</span>
          <Button
            onClick={handleExport}
            size="sm"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white ml-2 px-2 py-1 text-xs"
          >
            Export
          </Button>
        </div>
      </div>
    </>
  );
}
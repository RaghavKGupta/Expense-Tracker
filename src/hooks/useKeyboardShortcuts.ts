'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcuts {
  onQuickAdd?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts({ onQuickAdd, onSearch, onExport }: KeyboardShortcuts = {}) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Cmd/Ctrl + shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            router.push('/add');
            break;
          case 'e':
            event.preventDefault();
            router.push('/expenses');
            break;
          case 'd':
            event.preventDefault();
            router.push('/');
            break;
          case 'k':
            event.preventDefault();
            onSearch?.();
            break;
          case 's':
            event.preventDefault();
            onExport?.();
            break;
        }
      }

      // Simple key shortcuts
      switch (event.key) {
        case 'a':
          if (!event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onQuickAdd?.();
          }
          break;
        case '/':
          event.preventDefault();
          onSearch?.();
          break;
        case 'Escape':
          // Close any open modals or reset focus
          const activeElement = document.activeElement as HTMLElement;
          activeElement?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, onQuickAdd, onSearch, onExport]);
}

// KeyboardShortcutsHelp component moved to separate component file
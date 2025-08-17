'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, DollarSign, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { csvStorage } from '@/lib/csvStorage';
import Button from '@/components/ui/Button';
import LogoutButton from '@/components/auth/LogoutButton';

const primaryNavigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Add Expense', href: '/add' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Income', href: '/income' },
  { name: 'Analytics', href: '/analytics' },
];

const secondaryNavigation = [
  { name: 'Goals', href: '/goals' },
  { name: 'Net Worth', href: '/networth' },
  { name: 'Assets', href: '/assets' },
  { name: 'Debts', href: '/liabilities' },
  { name: 'Subscriptions', href: '/subscriptions' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleExport = () => {
    csvStorage.exportToCSV();
    csvStorage.resetSessionChanges();
  };

  return (
    <header className="bg-slate-800 bg-opacity-95 backdrop-blur-sm border-b border-slate-700 border-opacity-50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-105 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Baniye ka Hisaab
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">
            <div className="flex space-x-1">
              {primaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="w-px h-6 bg-slate-600"></div>
            
            <div className="flex space-x-1">
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center gap-3 ml-4">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="hidden lg:flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <LogoutButton />
            </div>
          </nav>

          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 border-opacity-50">
            <div className="px-2 pt-2 pb-3 space-y-2">
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Primary
                </div>
                {primaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                      pathname === item.href
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Finance
                </div>
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                      pathname === item.href
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700 hover:bg-opacity-50'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
'use client';

import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CruiseComparisonPage } from '@/components/cruise/CruiseComparisonPage';
import { CruiseAdminPage } from '@/components/admin/CruiseAdminPage';

export default function CruiseShipPlanner() {
  const [page, setPage] = useState('compare');

  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen font-sans">
        <nav className="bg-white shadow-md" role="navigation" aria-label="Main navigation">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-900">MSC Cruise Manager</div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPage('compare')} 
                  className={`px-4 py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    page === 'compare' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={page === 'compare'}
                >
                  Comparison Tool
                </button>
                <button 
                  onClick={() => setPage('admin')} 
                  className={`px-4 py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    page === 'admin' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={page === 'admin'}
                >
                  Admin Panel
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>
          {page === 'compare' ? <CruiseComparisonPage /> : <CruiseAdminPage />}
        </main>
      </div>
    </ErrorBoundary>
  );
} 
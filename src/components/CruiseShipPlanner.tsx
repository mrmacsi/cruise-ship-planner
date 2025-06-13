'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CruiseComparisonPage } from '@/components/cruise/CruiseComparisonPage';

export default function CruiseShipPlanner() {
  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen font-sans">
        <nav className="bg-white shadow-md" role="navigation" aria-label="Main navigation">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-900">MSC Cruise Manager</div>
            </div>
          </div>
        </nav>
        <main>
          <CruiseComparisonPage />
        </main>
      </div>
    </ErrorBoundary>
  );
} 
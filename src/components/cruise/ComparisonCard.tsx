'use client';

import React, { useCallback } from 'react';
import { CruiseData } from '@/types/cruise';
import { CloseIcon } from '@/components/ui/Icons';

interface ComparisonCardProps {
  cruise: CruiseData;
  onRemove: () => void;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ cruise, onRemove }) => {
  const formatPrice = useCallback((price: string) => {
    if (!price || typeof price !== 'string' || price.toLowerCase().includes('n/a')) {
      return 'N/A';
    }
    return price.split('(')[0].trim();
  }, []);

  return (
    <article className="bg-white rounded-2xl shadow-2xl p-6 relative ring-2 ring-blue-500 flex flex-col">
      <button 
        onClick={onRemove} 
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label={`Remove ${cruise['Ship Name']} from comparison`}
      >
        <CloseIcon />
      </button>

      <header className="mb-4 pr-8">
        <h3 className="text-2xl font-bold text-blue-900 mb-1">{cruise['Ship Name']}</h3>
        <p className="text-gray-600 text-sm">{cruise['Departure Date']}</p>
      </header>

      <div className="border-t border-gray-200 pt-4 flex-grow">
        <h4 className="font-semibold text-lg mb-3 text-gray-800">Pricing Details:</h4>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium">Departure:</dt>
            <dd className="text-right">{cruise['Departure Port']}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Duration:</dt>
            <dd>{cruise.Duration}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Interior:</dt>
            <dd className="font-semibold">{formatPrice(cruise['Interior Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Ocean View:</dt>
            <dd className="font-semibold">{formatPrice(cruise['Ocean View Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Balcony:</dt>
            <dd className="font-semibold">{formatPrice(cruise['Standard Balcony'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Suite:</dt>
            <dd className="font-semibold">{formatPrice(cruise['Suite Options'])}</dd>
          </div>
        </dl>
      </div>

      <a 
        href={cruise['Booking Link (Constructed)']} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-full text-center mt-6 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-semibold shadow-lg"
      >
        Book This Cruise
      </a>
    </article>
  );
}; 
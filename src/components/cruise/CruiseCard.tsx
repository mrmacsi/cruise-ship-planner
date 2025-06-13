'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { ProcessedCruise, ItineraryStop } from '@/types/cruise';
import { CalendarIcon, MapPinIcon, PoundIcon } from '@/components/ui/Icons';
import { MAX_COMPARISON_ITEMS } from '@/utils/constants';

interface CruiseCardProps {
  cruise: ProcessedCruise;
  onCompareToggle: (sailingId: string) => void;
  isComparing: boolean;
  canAddToComparison: boolean;
}

export const CruiseCard: React.FC<CruiseCardProps> = ({ 
  cruise, 
  onCompareToggle, 
  isComparing, 
  canAddToComparison 
}) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [imageError, setImageError] = useState(false);

  const priceToDisplay = useMemo(() => {
    return cruise.lowestPrice === Infinity ? 'N/A' : `from £${cruise.lowestPrice.toLocaleString()}`;
  }, [cruise.lowestPrice]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleCompareClick = useCallback(() => {
    if (!isComparing && !canAddToComparison) {
      alert(`You can only compare up to ${MAX_COMPARISON_ITEMS} cruises at once. Please remove one first.`);
      return;
    }
    onCompareToggle(cruise['Unique Sailing ID']);
  }, [isComparing, canAddToComparison, onCompareToggle, cruise]);

  const itinerary = useMemo(() => {
    return Array.isArray(cruise['Complete Itinerary']) ? cruise['Complete Itinerary'] : [];
  }, [cruise]);

  return (
    <article className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative">
        <Image 
          src={imageError ? `https://placehold.co/600x400/e2e8f0/4a5568?text=Map+Not+Available` : cruise['Itinerary Map'] || 'https://placehold.co/600x400/e2e8f0/4a5568?text=Map+Not+Available'} 
          alt={`Itinerary map for ${cruise['Ship Name']}`}
          className="w-full h-48 object-cover"
          onError={handleImageError}
          width={600}
          height={400}
          priority={false}
        />
        {cruise['Special Offers'] && cruise['Special Offers'] !== 'None' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Special Offer
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <header className="mb-4">
          <h3 className="text-2xl font-bold text-blue-900">{cruise['Ship Name']}</h3>
          <p className="text-sm text-gray-500">{cruise.Duration}</p>
        </header>

        <div className="space-y-3 mb-4 flex-grow">
          <div className="flex items-center text-gray-700">
            <CalendarIcon />
            <span>{cruise['Departure Date']}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPinIcon />
            <span className="truncate">Departs from {cruise['Departure Port']}</span>
          </div>
          <div className="flex items-center font-semibold text-green-600">
            <PoundIcon />
            <span>{priceToDisplay}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <button 
            onClick={() => setShowItinerary(!showItinerary)} 
            className="w-full text-left text-blue-600 font-semibold hover:underline mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-expanded={showItinerary}
            aria-controls={`itinerary-${cruise['Unique Sailing ID']}`}
          >
            {showItinerary ? 'Hide' : 'Show'} Full Itinerary ({itinerary.length} stops)
          </button>

          {showItinerary && (
            <div 
              id={`itinerary-${cruise['Unique Sailing ID']}`}
              className="text-sm text-gray-600 space-y-2 mb-4 max-h-40 overflow-y-auto pr-2"
              role="region"
              aria-label="Cruise itinerary"
            >
              {itinerary.length > 0 ? (
                itinerary.map((stop: ItineraryStop, index: number) => (
                  <p key={index}>
                    <strong>Day {stop.day}:</strong> {stop.port}
                    {stop.arrival && stop.arrival !== '-' && ` (arrives ${stop.arrival})`}
                  </p>
                ))
              ) : (
                <p className="text-gray-400 italic">No itinerary details available</p>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <a 
              href={cruise['Booking Link (Constructed)']} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 text-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold shadow-md"
            >
              Book Now
            </a>
            <button 
              onClick={handleCompareClick}
              className={`flex-1 text-center px-4 py-3 rounded-lg transition font-semibold shadow-md focus:outline-none focus:ring-2 ${
                isComparing 
                  ? 'bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-500' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
              } ${!canAddToComparison && !isComparing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canAddToComparison && !isComparing}
              aria-pressed={isComparing}
            >
              {isComparing ? 'Remove' : 'Compare'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}; 
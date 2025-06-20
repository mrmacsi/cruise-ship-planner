'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { CruiseData, ItineraryStop } from '@/types/cruise';
import { CloseIcon, CalendarIcon, MapPinIcon, PoundIcon } from '@/components/ui/Icons';
import Image from 'next/image';
import { parsePrice } from '@/utils/cruiseUtils';

interface ComparisonCardProps {
  cruise: CruiseData;
  onRemove: () => void;
  roomTypeFilter?: string;
  cheapestPrices?: {
    interior: number;
    oceanView: number;
    balcony: number;
    suite: number;
    yachtClub: number;
  };
  onNotesChange?: (sailingId: string, notes: string) => void;
  allNotesOpen?: boolean;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ 
  cruise, 
  onRemove, 
  roomTypeFilter, 
  cheapestPrices,
  onNotesChange,
  allNotesOpen = true
}) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [showNotes, setShowNotes] = useState(allNotesOpen);
  const [notes, setNotes] = useState(cruise['User Notes'] || '');
  const [imageError, setImageError] = useState(false);

  // Update showNotes when allNotesOpen changes
  useEffect(() => {
    setShowNotes(allNotesOpen);
  }, [allNotesOpen]);

  const formatPrice = useCallback((price: string) => {
    if (!price || typeof price !== 'string' || price.toLowerCase().includes('n/a')) {
      return 'N/A';
    }
    return price.split('(')[0].trim();
  }, []);

  const isPriceLowest = useCallback((price: string, category: 'interior' | 'oceanView' | 'balcony' | 'suite' | 'yachtClub') => {
    if (!cheapestPrices) return false;
    const numericPrice = parsePrice(price);
    return numericPrice > 0 && numericPrice === cheapestPrices[category];
  }, [cheapestPrices]);

  const getPriceClassName = useCallback((price: string, category: 'interior' | 'oceanView' | 'balcony' | 'suite' | 'yachtClub') => {
    const baseClass = "font-semibold";
    if (isPriceLowest(price, category)) {
      return `${baseClass} text-green-600 bg-green-50 px-1 rounded`;
    }
    return baseClass;
  }, [isPriceLowest]);

  const getCheapestBadges = useCallback(() => {
    const badges = [];
    if (isPriceLowest(cruise['Interior Price'], 'interior')) {
      badges.push({ type: 'Interior', color: 'bg-green-500' });
    }
    if (isPriceLowest(cruise['Ocean View Price'], 'oceanView')) {
      badges.push({ type: 'Ocean View', color: 'bg-blue-500' });
    }
    if (isPriceLowest(cruise['Standard Balcony'], 'balcony')) {
      badges.push({ type: 'Balcony', color: 'bg-purple-500' });
    }
    if (isPriceLowest(cruise['Suite Price'], 'suite')) {
      badges.push({ type: 'Suite', color: 'bg-yellow-500' });
    }
    if (isPriceLowest(cruise['Yacht Club Price'], 'yachtClub')) {
      badges.push({ type: 'Yacht Club', color: 'bg-red-500' });
    }
    return badges;
  }, [cruise, isPriceLowest]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (onNotesChange) {
      onNotesChange(cruise['Unique Sailing ID'], newNotes);
    }
  }, [cruise, onNotesChange]);

  const itinerary = Array.isArray(cruise['Complete Itinerary']) ? cruise['Complete Itinerary'] : [];
  const cheapestBadges = getCheapestBadges();

  const PlaceholderImage = () => (
    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
      <div className="text-center p-2">
        <div className="text-blue-600 mb-1">
          <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-xs text-blue-700 font-medium">{cruise['Ship Name']}</p>
      </div>
    </div>
  );

  return (
    <article className="bg-white rounded-xl shadow-lg p-4 ring-2 ring-blue-500 flex flex-col">
      {/* Close button above image */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={onRemove} 
          className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`Remove ${cruise['Ship Name']} from comparison`}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Route Image with Badges */}
      <div className="mb-3 relative">
        {imageError || !cruise['Itinerary Map'] ? (
          <PlaceholderImage />
        ) : (
          <div className="relative">
            <Image 
              src={cruise['Itinerary Map']} 
              alt={`Route map for ${cruise['Ship Name']}`}
              className="w-full h-32 object-contain rounded-lg border border-gray-200"
              onError={handleImageError}
              width={400}
              height={200}
              priority={false}
              unoptimized={true}
            />
          </div>
        )}
        
        {/* Cheapest Price Badges */}
        {cheapestBadges.length > 0 && (
          <div className="absolute top-1 left-1 flex flex-wrap gap-1">
            {cheapestBadges.map((badge, index) => (
              <span 
                key={index}
                className={`${badge.color} text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md`}
              >
                Best {badge.type}
              </span>
            ))}
          </div>
        )}
      </div>

      <header className="mb-3">
        <h3 className="text-lg font-bold text-blue-900 mb-1">{cruise['Ship Name']}</h3>
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <CalendarIcon />
          <span className="ml-1">{cruise['Departure Date']}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <MapPinIcon />
          <span className="ml-1 truncate">{cruise['Departure Port']}</span>
        </div>
      </header>

      <div className="border-t border-gray-200 pt-3 flex-grow">
        <h4 className="font-semibold text-sm mb-2 text-gray-800">All Pricing:</h4>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="font-medium">Duration:</dt>
            <dd>{cruise.Duration}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Interior:</dt>
            <dd className={getPriceClassName(cruise['Interior Price'], 'interior')}>{formatPrice(cruise['Interior Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Ocean View:</dt>
            <dd className={getPriceClassName(cruise['Ocean View Price'], 'oceanView')}>{formatPrice(cruise['Ocean View Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Balcony:</dt>
            <dd className={getPriceClassName(cruise['Standard Balcony'], 'balcony')}>{formatPrice(cruise['Standard Balcony'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Suite:</dt>
            <dd className={getPriceClassName(cruise['Suite Price'], 'suite')}>{formatPrice(cruise['Suite Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Yacht Club:</dt>
            <dd className={getPriceClassName(cruise['Yacht Club Price'], 'yachtClub')}>{formatPrice(cruise['Yacht Club Price'])}</dd>
          </div>
          {cruise['Special Offers'] && cruise['Special Offers'] !== 'None' && (
            <div className="flex justify-between">
              <dt className="font-medium">Special Offers:</dt>
              <dd className="text-green-600 font-semibold">{cruise['Special Offers']}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Notes Section */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button 
          onClick={() => setShowNotes(!showNotes)} 
          className="w-full text-left text-gray-600 font-medium hover:text-gray-800 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 text-xs flex items-center justify-between"
          aria-expanded={showNotes}
        >
          <span>Notes {notes && `(${notes.length > 15 ? notes.substring(0, 15) + '...' : notes})`}</span>
          <span className="text-xs">{showNotes ? '▼' : '▶'}</span>
        </button>

        {showNotes && (
          <div className="mt-3">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add your notes about this cruise..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px] max-h-[400px] text-sm"
              rows={5}
            />
          </div>
        )}
        
        {!showNotes && notes && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
            {notes.length > 40 ? notes.substring(0, 40) + '...' : notes}
          </div>
        )}
      </div>

      {/* Itinerary */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <button 
          onClick={() => setShowItinerary(!showItinerary)} 
          className="w-full text-left text-blue-600 font-semibold hover:underline text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
          aria-expanded={showItinerary}
        >
          {showItinerary ? 'Hide' : 'Show'} Itinerary ({itinerary.length} stops)
        </button>

        {showItinerary && (
          <div className="text-xs text-gray-600 space-y-1 mb-3">
            {itinerary.length > 0 ? (
              itinerary.map((stop: ItineraryStop, index: number) => (
                <div key={index} className="border-l-2 border-blue-200 pl-2 py-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Day {stop.day}: {stop.port}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-2">
                      {stop.arrival && stop.arrival !== '-' && (
                        <div>Arr: {stop.arrival}</div>
                      )}
                      {stop.departure && stop.departure !== '-' && (
                        <div>Dep: {stop.departure}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 italic">No itinerary details available</p>
            )}
          </div>
        )}
      </div>

      <a 
        href={cruise['Booking Link (Constructed)']} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="w-full text-center mt-3 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-semibold shadow-md text-sm"
      >
        Book This Cruise
      </a>
    </article>
  );
}; 
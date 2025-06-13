'use client';

import React, { useCallback, useState } from 'react';
import { CruiseData, ItineraryStop } from '@/types/cruise';
import { CloseIcon, CalendarIcon, MapPinIcon, PoundIcon } from '@/components/ui/Icons';
import Image from 'next/image';

interface ComparisonCardProps {
  cruise: CruiseData;
  onRemove: () => void;
  roomTypeFilter?: string;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ cruise, onRemove, roomTypeFilter }) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = useCallback((price: string) => {
    if (!price || typeof price !== 'string' || price.toLowerCase().includes('n/a')) {
      return 'N/A';
    }
    return price.split('(')[0].trim();
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const getHighlightedPrice = useCallback(() => {
    switch (roomTypeFilter?.toLowerCase()) {
      case 'interior':
        return formatPrice(cruise['Interior Price']);
      case 'ocean view':
        return formatPrice(cruise['Ocean View Price']);
      case 'balcony':
        return formatPrice(cruise['Standard Balcony']);
      case 'suite':
        return formatPrice(cruise['Suite Price']);
      default:
        return null;
    }
  }, [cruise, roomTypeFilter, formatPrice]);

  const itinerary = Array.isArray(cruise['Complete Itinerary']) ? cruise['Complete Itinerary'] : [];

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
    <article className="bg-white rounded-xl shadow-lg p-4 relative ring-2 ring-blue-500 flex flex-col">
      <button 
        onClick={onRemove} 
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 z-10"
        aria-label={`Remove ${cruise['Ship Name']} from comparison`}
      >
        <CloseIcon />
      </button>

      {/* Route Image */}
      <div className="mb-3 pr-8">
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
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Route Map
            </div>
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

      {/* Highlighted Price */}
      {getHighlightedPrice() && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-800">{roomTypeFilter}:</span>
            <span className="text-lg font-bold text-yellow-900">{getHighlightedPrice()}</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3 flex-grow">
        <h4 className="font-semibold text-sm mb-2 text-gray-800">All Pricing:</h4>
        <dl className="space-y-1 text-xs">
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
            <dd className="font-semibold">{formatPrice(cruise['Suite Price'])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Yacht Club:</dt>
            <dd className="font-semibold">{formatPrice(cruise['Yacht Club Price'])}</dd>
          </div>
          {cruise['Special Offers'] && cruise['Special Offers'] !== 'None' && (
            <div className="flex justify-between">
              <dt className="font-medium">Special Offers:</dt>
              <dd className="text-green-600 font-semibold">{cruise['Special Offers']}</dd>
            </div>
          )}
        </dl>
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
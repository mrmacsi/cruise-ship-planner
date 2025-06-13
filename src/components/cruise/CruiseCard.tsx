'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ProcessedCruise, ItineraryStop } from '@/types/cruise';
import { CalendarIcon, MapPinIcon, PoundIcon, EditIcon, TrashIcon } from '@/components/ui/Icons';
import { getShipDisplayName } from '@/utils/shipData';

interface CruiseCardProps {
  cruise: ProcessedCruise;
  onCompareToggle: (sailingId: string) => void;
  isComparing: boolean;
  canAddToComparison: boolean;
  onEdit?: (cruise: ProcessedCruise) => void;
  onDelete?: (sailingId: string) => void;
  onNotesChange?: (sailingId: string, notes: string) => void;
  showAdminButtons?: boolean;
  allNotesOpen?: boolean;
  cheapestPrices?: {
    interior: number;
    oceanView: number;
    balcony: number;
    suite: number;
    yachtClub: number;
  };
}

export const CruiseCard: React.FC<CruiseCardProps> = ({ 
  cruise, 
  onCompareToggle, 
  isComparing, 
  canAddToComparison,
  onEdit,
  onDelete,
  onNotesChange,
  showAdminButtons = false,
  allNotesOpen = true,
  cheapestPrices
}) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [showNotes, setShowNotes] = useState(allNotesOpen);
  const [notes, setNotes] = useState(cruise['User Notes'] || '');
  const [imageError, setImageError] = useState(false);
  const [useNextImage, setUseNextImage] = useState(true);

  // Update showNotes when allNotesOpen changes
  useEffect(() => {
    setShowNotes(allNotesOpen);
  }, [allNotesOpen]);

  const priceToDisplay = useMemo(() => {
    return cruise.lowestPrice === Infinity ? 'N/A' : `from £${cruise.lowestPrice.toLocaleString()}`;
  }, [cruise.lowestPrice]);

  const getImageUrl = useCallback(() => {
    if (imageError || !cruise['Itinerary Map']) {
      // Use a more reliable placeholder service
      return `https://via.placeholder.com/600x400/e2e8f0/4a5568?text=${encodeURIComponent(cruise['Ship Name'] || 'Cruise Map')}`;
    }
    return cruise['Itinerary Map'];
  }, [imageError, cruise]);

  const PlaceholderImage = () => (
    <div className="w-full min-h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
      <div className="text-center p-4">
        <div className="text-blue-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm text-blue-700 font-medium">{cruise['Ship Name']}</p>
        <p className="text-xs text-blue-600">Cruise Map</p>
      </div>
    </div>
  );

  const handleImageError = useCallback(() => {
    if (useNextImage) {
      setUseNextImage(false); // First try regular img tag
    } else {
      setImageError(true); // Finally use CSS placeholder
    }
  }, [useNextImage]);

  const handleCompareClick = useCallback(() => {
    onCompareToggle(cruise['Unique Sailing ID']);
  }, [onCompareToggle, cruise]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (onNotesChange) {
      onNotesChange(cruise['Unique Sailing ID'], newNotes);
    }
  }, [cruise, onNotesChange]);

  const handleEditClick = useCallback(() => {
    if (onEdit) {
      onEdit(cruise);
    }
  }, [cruise, onEdit]);

  const handleDeleteClick = useCallback(() => {
    if (onDelete) {
      onDelete(cruise['Unique Sailing ID']);
    }
  }, [cruise, onDelete]);

  const itinerary = useMemo(() => {
    return Array.isArray(cruise['Complete Itinerary']) ? cruise['Complete Itinerary'] : [];
  }, [cruise]);

  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative">
        {imageError ? (
          <PlaceholderImage />
        ) : useNextImage ? (
          <Image 
            src={getImageUrl()} 
            alt={`Itinerary map for ${cruise['Ship Name']}`}
            className="w-full object-contain"
            onError={handleImageError}
            width={600}
            height={400}
            priority={false}
            unoptimized={false}
            style={{ height: 'auto', minHeight: '200px' }}
          />
        ) : (
          <img 
            src={getImageUrl()} 
            alt={`Itinerary map for ${cruise['Ship Name']}`}
            className="w-full object-contain"
            onError={handleImageError}
            loading="lazy"
            style={{ height: 'auto', minHeight: '200px' }}
          />
        )}
        
        {showAdminButtons && (
          <div className="absolute top-2 left-2 flex space-x-1 z-10">
            <button
              onClick={handleEditClick}
              className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Edit ${cruise['Ship Name']}`}
              title="Edit cruise"
            >
              <EditIcon size={12} />
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Delete ${cruise['Ship Name']}`}
              title="Delete cruise"
            >
              <TrashIcon size={12} />
            </button>
          </div>
        )}
        
        {cruise['Special Offers'] && cruise['Special Offers'] !== 'None' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Special Offer
          </div>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <header className="mb-3">
          <h3 className="text-lg font-bold text-blue-900">{getShipDisplayName(cruise['Ship Name'])}</h3>
          <p className="text-xs text-gray-500">{cruise.Duration}</p>
        </header>

        <div className="space-y-2 mb-3 flex-grow">
          <div className="flex items-center text-gray-700 text-sm">
            <CalendarIcon />
            <span className="ml-1">{cruise['Departure Date']}</span>
          </div>
          <div className="flex items-center text-gray-700 text-sm">
            <MapPinIcon />
            <span className="ml-1 truncate">Departs from {cruise['Departure Port']}</span>
          </div>
          <div className="flex items-center font-semibold text-green-600 text-sm">
            <PoundIcon />
            <span className="ml-1">{priceToDisplay}</span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-200">
          <button 
            onClick={() => setShowItinerary(!showItinerary)} 
            className="w-full text-left text-blue-600 font-semibold hover:underline mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 text-sm"
            aria-expanded={showItinerary}
            aria-controls={`itinerary-${cruise['Unique Sailing ID']}`}
          >
            {showItinerary ? 'Hide' : 'Show'} Itinerary ({itinerary.length} stops)
          </button>

          {showItinerary && (
            <div 
              id={`itinerary-${cruise['Unique Sailing ID']}`}
              className="text-xs text-gray-600 space-y-1 mb-3"
              role="region"
              aria-label="Cruise itinerary"
            >
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

          <div className="flex space-x-2 mb-3">
            <a 
              href={cruise['Booking Link (Constructed)']} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold shadow-md text-sm"
            >
              Book Now
            </a>
            <button 
              onClick={handleCompareClick}
              className={`flex-1 text-center px-3 py-2 rounded-lg transition font-semibold shadow-md focus:outline-none focus:ring-2 text-sm ${
                isComparing 
                  ? 'bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-500' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500'
              }`}
              aria-pressed={isComparing}
            >
              {isComparing ? 'Remove' : 'Compare'}
            </button>
          </div>

          {/* Notes Section */}
          <div className="border-t border-gray-200 pt-3">
            <button 
              onClick={() => setShowNotes(!showNotes)} 
              className="w-full text-left text-gray-600 font-medium hover:text-gray-800 mb-2 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded p-1 text-sm flex items-center justify-between"
              aria-expanded={showNotes}
            >
              <span>Notes {notes && `(${notes.length > 20 ? notes.substring(0, 20) + '...' : notes})`}</span>
              <span className="text-xs">{showNotes ? '▼' : '▶'}</span>
            </button>

            {(allNotesOpen || showNotes) && (
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
                {notes.length > 50 ? notes.substring(0, 50) + '...' : notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}; 
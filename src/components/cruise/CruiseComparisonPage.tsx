'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CruiseData, ProcessedCruise } from '@/types/cruise';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { parsePrice, parseDepartureDate, parseArrivalDate, getAvailableDates, getAvailableCities, sanitizeInput } from '@/utils/cruiseUtils';
import { getShipDisplayName } from '@/utils/shipData';
import { API_BASE_URL, API_KEY, MIN_BUDGET_VALUE, MAX_BUDGET_VALUE } from '@/utils/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CruiseCard } from '@/components/cruise/CruiseCard';
import { ComparisonCard } from '@/components/cruise/ComparisonCard';

interface CruiseComparisonPageProps {
  allNotesOpen?: boolean;
  onEditCruise?: (cruise: CruiseData) => void;
  onBulkSaveReady?: (saveCallback: (data: CruiseData[]) => Promise<void>) => void;
  onDeleteAfterSep4Ready?: (deleteCallback: () => Promise<void>) => void;
}

export const CruiseComparisonPage: React.FC<CruiseComparisonPageProps> = ({ 
  allNotesOpen = true,
  onEditCruise,
  onBulkSaveReady,
  onDeleteAfterSep4Ready
}) => {
  const [allCruises, setAllCruises] = useState<CruiseData[]>([]);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [selectedShips, setSelectedShips] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [itineraryQueries, setItineraryQueries] = useState<string[]>([]);
  const [roomTypeFilters, setRoomTypeFilters] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const savingNotesRef = useRef(false);

  const { apiCall, isLoading, error } = useApi();
  
  const debouncedMaxBudget = useDebounce(maxBudget, 300);
  const debouncedNotes = useDebounce(notes, 1000);

  const fetchCruises = useCallback(async () => {
    try {
      const result = await apiCall(API_BASE_URL);
      if (result.status === 404 || result.status === 408) {
        setAllCruises([]);
      } else if (result.data?.caches?.[0]?.data) {
        setAllCruises(result.data.caches[0].data);
      } else {
        setAllCruises([]);
      }
    } catch (error) {
      console.error('Failed to fetch cruises:', error);
      setAllCruises([]);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchCruises();
  }, [fetchCruises]);

  // Silent background save for notes without any UI disruption
  useEffect(() => {
    if (Object.keys(debouncedNotes).length > 0 && !savingNotesRef.current) {
      // Check if there are actual changes before saving
      const hasActualChanges = allCruises.some(cruise => {
        const newNote = debouncedNotes[cruise['Unique Sailing ID']];
        const currentNote = cruise['User Notes'] || '';
        return newNote !== undefined && newNote !== currentNote;
      });

      if (!hasActualChanges) {
        return; // No actual changes, don't save
      }

      const saveNotes = async () => {
        savingNotesRef.current = true;
        try {
          // Get current cruises state to avoid stale closure
          const currentCruises = allCruises;
          const updatedCruises = currentCruises.map(cruise => ({
            ...cruise,
            'User Notes': debouncedNotes[cruise['Unique Sailing ID']] !== undefined 
              ? debouncedNotes[cruise['Unique Sailing ID']] 
              : cruise['User Notes'] || ''
          }));
          
          // Silent save - use direct fetch to avoid triggering global loading state
          await fetch(API_BASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              key: API_KEY, 
              data: updatedCruises, 
              ttl: null 
            }),
          });

          // Update local state silently
          setAllCruises(updatedCruises);
        } catch (error) {
          console.error('Failed to save notes:', error);
        } finally {
          savingNotesRef.current = false;
        }
      };
      
      saveNotes();
    }
  }, [debouncedNotes]);

  const processedCruises = useMemo((): ProcessedCruise[] => {
    if (!Array.isArray(allCruises)) return [];
    
    return allCruises.map(cruise => {
      try {
        return {
          ...cruise,
          lowestPrice: Math.min(
            parsePrice(cruise['Interior Price']),
            parsePrice(cruise['Ocean View Price']),
            parsePrice(cruise['Standard Balcony']),
            parsePrice(cruise['Suite Price']),
            parsePrice(cruise['Yacht Club Price'])
          ),
          departureDateObj: parseDepartureDate(cruise['Departure Date'])
        };
      } catch (error) {
        console.warn('Error processing cruise data:', error);
        return null;
      }
    }).filter((cruise): cruise is ProcessedCruise => cruise !== null);
  }, [allCruises]);

  // Calculate cheapest prices for each room type across all cruises
  const cheapestPrices = useMemo(() => {
    const prices = {
      interior: Infinity,
      oceanView: Infinity,
      balcony: Infinity,
      suite: Infinity,
      yachtClub: Infinity
    };

    processedCruises.forEach(cruise => {
      const interiorPrice = parsePrice(cruise['Interior Price']);
      const oceanViewPrice = parsePrice(cruise['Ocean View Price']);
      const balconyPrice = parsePrice(cruise['Standard Balcony']);
      const suitePrice = parsePrice(cruise['Suite Price']);
      const yachtClubPrice = parsePrice(cruise['Yacht Club Price']);

      if (interiorPrice < prices.interior && interiorPrice > 0) prices.interior = interiorPrice;
      if (oceanViewPrice < prices.oceanView && oceanViewPrice > 0) prices.oceanView = oceanViewPrice;
      if (balconyPrice < prices.balcony && balconyPrice > 0) prices.balcony = balconyPrice;
      if (suitePrice < prices.suite && suitePrice > 0) prices.suite = suitePrice;
      if (yachtClubPrice < prices.yachtClub && yachtClubPrice > 0) prices.yachtClub = yachtClubPrice;
    });

    return prices;
  }, [processedCruises]);

  const filteredCruises = useMemo(() => {
    let result = [...processedCruises];

    if (selectedShips.length > 0) {
      result = result.filter(c => selectedShips.includes(c['Ship Name']));
    }

    if (debouncedMaxBudget) {
      const budget = parseFloat(debouncedMaxBudget);
      if (!isNaN(budget) && budget >= MIN_BUDGET_VALUE && budget <= MAX_BUDGET_VALUE) {
        result = result.filter(c => c.lowestPrice <= budget);
      }
    }

    if (departureDate) {
      const filterDate = new Date(departureDate);
      if (!isNaN(filterDate.getTime())) {
        filterDate.setUTCHours(0, 0, 0, 0);
        result = result.filter(c => {
          // Parse the departure date from the "Departure Date" field (e.g., "29 Aug '25 - 05 Sep '25")
          const cruiseDepartureDate = parseDepartureDate(c['Departure Date']);
          if (!cruiseDepartureDate) return false;
          const cruiseDate = new Date(cruiseDepartureDate);
          cruiseDate.setUTCHours(0, 0, 0, 0);
          return cruiseDate.getTime() >= filterDate.getTime();
        });
      }
    }

    if (arrivalDate) {
      const filterDate = new Date(arrivalDate);
      if (!isNaN(filterDate.getTime())) {
        filterDate.setUTCHours(23, 59, 59, 999);
        result = result.filter(c => {
          // Parse the arrival date from the "Departure Date" field and duration
          const arrivalDateObj = parseArrivalDate(c['Departure Date'], c['Duration']);
          if (!arrivalDateObj) return false;
          const cruiseArrivalDate = new Date(arrivalDateObj);
          cruiseArrivalDate.setUTCHours(23, 59, 59, 999);
          return cruiseArrivalDate.getTime() <= filterDate.getTime();
        });
      }
    }

    if (selectedCities.length > 0) {
      result = result.filter(c => {
        return selectedCities.some(selectedCity => {
          const searchTerm = selectedCity.toLowerCase();
          
          // Check departure port
          if (c['Departure Port'] && c['Departure Port'].toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // Check all ports in complete itinerary
          if (Array.isArray(c['Complete Itinerary'])) {
            return c['Complete Itinerary'].some(stop => 
              stop?.port?.toLowerCase().includes(searchTerm)
            );
          }
          
          return false;
        });
      });
    }

    if (itineraryQueries.length > 0) {
      result = result.filter(c => {
        return itineraryQueries.some(query => {
          const searchTerm = sanitizeInput(query).toLowerCase();
          if (!searchTerm) return true;
          
          // Search in departure port
          if (c['Departure Port']?.toLowerCase().includes(searchTerm)) {
            return true;
          }
          
          // Search in all ports in complete itinerary
          if (Array.isArray(c['Complete Itinerary'])) {
            return c['Complete Itinerary'].some(stop => 
              stop?.port?.toLowerCase().includes(searchTerm)
            );
          }
          
          return false;
        });
      });
    }

    if (roomTypeFilters.length > 0) {
      result = result.filter(c => {
        const hasValidPrice = (price: string | undefined) => {
          return price && 
                 price.trim() !== '' && 
                 !price.toLowerCase().includes('n/a') && 
                 !price.toLowerCase().includes('not available') &&
                 parsePrice(price) > 0;
        };
        
        return roomTypeFilters.some(roomType => {
          switch (roomType.toLowerCase()) {
            case 'interior':
              return hasValidPrice(c['Interior Price']);
            case 'ocean view':
              return hasValidPrice(c['Ocean View Price']);
            case 'balcony':
              return hasValidPrice(c['Standard Balcony']);
            case 'suite':
              return hasValidPrice(c['Suite Price']) || hasValidPrice(c['Yacht Club Price']);
            default:
              return true;
          }
        });
      });
    }

    return result;
  }, [processedCruises, selectedShips, debouncedMaxBudget, departureDate, arrivalDate, selectedCities, itineraryQueries, roomTypeFilters]);

  const shipNames = useMemo(() => {
    const names = Array.from(new Set(processedCruises.map(c => c['Ship Name']).filter(Boolean)));
    return names.sort();
  }, [processedCruises]);

  const availableDates = useMemo(() => {
    return getAvailableDates(processedCruises);
  }, [processedCruises]);

  const availableCities = useMemo(() => {
    return getAvailableCities(processedCruises);
  }, [processedCruises]);

  const cruisesToCompare = useMemo(() => {
    const filtered = allCruises.filter(cruise => 
      comparisonList.includes(cruise['Unique Sailing ID'])
    );
    
    // Sort by departure date first, then by lowest price
    return filtered.sort((a, b) => {
      const dateA = parseDepartureDate(a['Departure Date']);
      const dateB = parseDepartureDate(b['Departure Date']);
      
      if (dateA && dateB) {
        const dateDiff = dateA.getTime() - dateB.getTime();
        if (dateDiff !== 0) return dateDiff;
      }
      
      // If dates are equal or missing, sort by price
      const priceA = Math.min(
        parsePrice(a['Interior Price']),
        parsePrice(a['Ocean View Price']),
        parsePrice(a['Standard Balcony']),
        parsePrice(a['Suite Price']),
        parsePrice(a['Yacht Club Price'])
      );
      const priceB = Math.min(
        parsePrice(b['Interior Price']),
        parsePrice(b['Ocean View Price']),
        parsePrice(b['Standard Balcony']),
        parsePrice(b['Suite Price']),
        parsePrice(b['Yacht Club Price'])
      );
      
      return priceA - priceB;
    });
  }, [comparisonList, allCruises]);

  const handleToggleCompare = useCallback((sailingId: string) => {
    setComparisonList(prev => {
      if (prev.includes(sailingId)) {
        return prev.filter(id => id !== sailingId);
      }
      return [...prev, sailingId];
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedShips([]);
    setMaxBudget('');
    setDepartureDate('');
    setArrivalDate('');
    setSelectedCities([]);
    setItineraryQueries([]);
    setRoomTypeFilters([]);
  }, []);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= MIN_BUDGET_VALUE && parseFloat(value) <= MAX_BUDGET_VALUE)) {
      setMaxBudget(value);
    }
  }, []);

  const handleNotesChange = useCallback((sailingId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [sailingId]: value
    }));
  }, []);

  const handleDelete = useCallback(async (sailingId: string) => {
    const cruiseToDelete = allCruises.find(c => c['Unique Sailing ID'] === sailingId);
    const confirmMessage = `Are you sure you want to delete "${cruiseToDelete?.['Ship Name'] || 'this cruise'}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const updatedCruises = allCruises.filter(c => c['Unique Sailing ID'] !== sailingId);
        
        await apiCall(API_BASE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            key: API_KEY, 
            data: updatedCruises, 
            ttl: null 
          }),
        });

        setAllCruises(updatedCruises);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [allCruises, apiCall]);

  const handleDeleteAfterSeptember4 = useCallback(async () => {
    const september4 = new Date('2024-09-04');
    const cruisesToDelete = allCruises.filter(cruise => {
      const departureDate = parseDepartureDate(cruise['Departure Date']);
      return departureDate && departureDate > september4;
    });

    if (cruisesToDelete.length === 0) {
      alert('No cruises found after September 4, 2024');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${cruisesToDelete.length} cruises departing after September 4, 2024? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const updatedCruises = allCruises.filter(cruise => {
          const departureDate = parseDepartureDate(cruise['Departure Date']);
          return !departureDate || departureDate <= september4;
        });
        
        await apiCall(API_BASE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            key: API_KEY, 
            data: updatedCruises, 
            ttl: null 
          }),
        });

        setAllCruises(updatedCruises);
        alert(`Successfully deleted ${cruisesToDelete.length} cruises`);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete cruises');
      }
    }
  }, [allCruises, apiCall]);

  const handleOpenEditForm = useCallback((cruise: CruiseData) => {
    if (onEditCruise) {
      onEditCruise(cruise);
    }
  }, [onEditCruise]);

  const handleBulkSave = useCallback(async (data: CruiseData[]) => {
    try {
      await apiCall(API_BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: API_KEY, 
          data: data, 
          ttl: null 
        }),
      });

      setAllCruises(data);
    } catch (error) {
      console.error('Bulk save failed:', error);
      throw error;
    }
  }, [apiCall]);

  // Expose bulk save callback to parent
  useEffect(() => {
    if (onBulkSaveReady) {
      onBulkSaveReady(handleBulkSave);
    }
  }, [onBulkSaveReady, handleBulkSave]);

  // Expose delete after Sep 4 callback to parent
  useEffect(() => {
    if (onDeleteAfterSep4Ready) {
      onDeleteAfterSep4Ready(handleDeleteAfterSeptember4);
    }
  }, [onDeleteAfterSep4Ready, handleDeleteAfterSeptember4]);

  // Multi-select handlers
  const handleShipSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedShips.includes(value)) {
      setSelectedShips(prev => [...prev, value]);
    }
  }, [selectedShips]);

  const handleCitySelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedCities.includes(value)) {
      setSelectedCities(prev => [...prev, value]);
    }
  }, [selectedCities]);

  const handleDepartureCitySelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !itineraryQueries.includes(value)) {
      setItineraryQueries(prev => [...prev, value]);
    }
  }, [itineraryQueries]);

  const handleRoomTypeSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !roomTypeFilters.includes(value)) {
      setRoomTypeFilters(prev => [...prev, value]);
    }
  }, [roomTypeFilters]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">
            Cruise Comparison Tool
          </h1>
          <p className="text-lg text-gray-600">
            Find and compare your perfect MSC cruise vacation.
          </p>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-lg mb-8" aria-labelledby="filter-heading">
          <h2 id="filter-heading" className="text-2xl font-semibold mb-4 text-blue-800">
            Filter Options
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label htmlFor="ship-select" className="mb-1 font-medium text-gray-700">
                Ship Name
              </label>
              <select 
                id="ship-select" 
                value="" 
                onChange={handleShipSelect} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="ship-select-desc"
              >
                <option value="">Select ships...</option>
                {shipNames.map(name => (
                  <option key={name} value={name}>{getShipDisplayName(name)}</option>
                ))}
              </select>
              {selectedShips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedShips.map(ship => (
                    <span key={ship} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center">
                      {ship}
                      <button 
                        onClick={() => setSelectedShips(prev => prev.filter(s => s !== ship))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <span id="ship-select-desc" className="sr-only">
                Select multiple ships to filter by
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="budget-input" className="mb-1 font-medium text-gray-700">
                Max Budget (£)
              </label>
              <input 
                id="budget-input" 
                type="number" 
                min={MIN_BUDGET_VALUE}
                max={MAX_BUDGET_VALUE}
                value={maxBudget} 
                onChange={handleBudgetChange} 
                placeholder="e.g., 1500" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="budget-input-desc"
              />
              <span id="budget-input-desc" className="sr-only">
                Enter maximum budget in British pounds
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="departure-date-input" className="mb-1 font-medium text-gray-700">
                Departure From
              </label>
              <input 
                id="departure-date-input" 
                type="date" 
                value={departureDate} 
                onChange={(e) => setDepartureDate(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="departure-date-input-desc"
              />
              <span id="departure-date-input-desc" className="sr-only">
                Select earliest departure date
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="arrival-date-input" className="mb-1 font-medium text-gray-700">
                Arrival By
              </label>
              <input 
                id="arrival-date-input" 
                type="date" 
                value={arrivalDate} 
                onChange={(e) => setArrivalDate(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="arrival-date-input-desc"
              />
              <span id="arrival-date-input-desc" className="sr-only">
                Select latest arrival date
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="city-select" className="mb-1 font-medium text-gray-700">
                City/Port
              </label>
              <select 
                id="city-select" 
                value="" 
                onChange={handleCitySelect} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="city-select-desc"
              >
                <option value="">Select cities...</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {selectedCities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCities.map(city => (
                    <span key={city} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center">
                      {city}
                      <button 
                        onClick={() => setSelectedCities(prev => prev.filter(c => c !== city))}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <span id="city-select-desc" className="sr-only">
                Select multiple cities or ports
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="departure-city-select" className="mb-1 font-medium text-gray-700">
                Departure City
              </label>
              <select 
                id="departure-city-select" 
                value="" 
                onChange={handleDepartureCitySelect} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="departure-city-select-desc"
              >
                <option value="">Select departure cities...</option>
                {Array.from(new Set(processedCruises.map(c => c['Departure Port']).filter(Boolean))).sort().map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
              {itineraryQueries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {itineraryQueries.map(query => (
                    <span key={query} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center">
                      {query}
                      <button 
                        onClick={() => setItineraryQueries(prev => prev.filter(q => q !== query))}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <span id="departure-city-select-desc" className="sr-only">
                Select multiple departure cities
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="room-type-select" className="mb-1 font-medium text-gray-700">
                Room Type
              </label>
              <select 
                id="room-type-select" 
                value="" 
                onChange={handleRoomTypeSelect} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="room-type-select-desc"
              >
                <option value="">Select room types...</option>
                <option value="Interior">Interior</option>
                <option value="Ocean View">Ocean View</option>
                <option value="Balcony">Balcony</option>
                <option value="Suite">Suite</option>
              </select>
              {roomTypeFilters.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {roomTypeFilters.map(roomType => (
                    <span key={roomType} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs flex items-center">
                      {roomType}
                      <button 
                        onClick={() => setRoomTypeFilters(prev => prev.filter(r => r !== roomType))}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <span id="room-type-select-desc" className="sr-only">
                Select multiple room types for comparison
              </span>
            </div>

          </div>
          <div className="mt-4 flex justify-between">
            <button 
              onClick={handleDeleteAfterSeptember4} 
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 font-semibold shadow-md"
              aria-label="Delete all cruises after September 4, 2024"
            >
              Delete After Sep 4
            </button>
            <button 
              onClick={handleResetFilters} 
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 font-semibold shadow-md"
              aria-label="Clear all filters"
            >
              Reset All Filters
            </button>
          </div>
        </section>

        {cruisesToCompare.length > 0 && (
          <section className="mb-8" aria-labelledby="comparison-heading">
            <h2 id="comparison-heading" className="text-3xl font-bold text-center mb-6 text-blue-800">
              Comparison ({cruisesToCompare.length} cruises)
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${cruisesToCompare.length > 2 ? 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6' : 'lg:grid-cols-2'} gap-4`}>
              {cruisesToCompare.map(cruise => (
                <ComparisonCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onRemove={() => handleToggleCompare(cruise['Unique Sailing ID'])} 
                  roomTypeFilter={roomTypeFilters[0]}
                  cheapestPrices={cheapestPrices}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-3xl font-bold mb-6 text-blue-800">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              `${filteredCruises.length} ${filteredCruises.length === 1 ? 'Cruise' : 'Cruises'} Found`
            )}
          </h2>

          {error && (
            <div className="text-center py-10 bg-red-100 text-red-700 rounded-lg shadow-md mb-6" role="alert">
              <p>{error}</p>
              <button 
                onClick={fetchCruises}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && filteredCruises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCruises.map(cruise => (
                <CruiseCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onCompareToggle={handleToggleCompare} 
                  isComparing={comparisonList.includes(cruise['Unique Sailing ID'])}
                  canAddToComparison={true}
                  onEdit={handleOpenEditForm}
                  onDelete={handleDelete}
                  onNotesChange={handleNotesChange}
                  showAdminButtons={true}
                  allNotesOpen={allNotesOpen}
                  cheapestPrices={cheapestPrices}
                />
              ))}
            </div>
          ) : !isLoading && !error && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <p className="text-xl text-gray-500">
                No cruises match your criteria. Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}; 
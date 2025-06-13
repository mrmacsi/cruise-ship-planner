'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CruiseData, ProcessedCruise } from '@/types/cruise';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { parsePrice, parseDepartureDate, parseArrivalDate, getAvailableDates, getAvailableCities, sanitizeInput } from '@/utils/cruiseUtils';
import { API_BASE_URL, API_KEY, MIN_BUDGET_VALUE, MAX_BUDGET_VALUE } from '@/utils/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CruiseCard } from '@/components/cruise/CruiseCard';
import { ComparisonCard } from '@/components/cruise/ComparisonCard';

export const CruiseComparisonPage: React.FC = () => {
  const [allCruises, setAllCruises] = useState<CruiseData[]>([]);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [itineraryQuery, setItineraryQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

  const { apiCall, isLoading, error } = useApi();
  
  const debouncedItineraryQuery = useDebounce(itineraryQuery, 300);
  const debouncedMaxBudget = useDebounce(maxBudget, 300);

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

  const processedCruises = useMemo((): ProcessedCruise[] => {
    if (!Array.isArray(allCruises)) return [];
    
    return allCruises.map(cruise => {
      try {
        return {
          ...cruise,
          lowestPrice: Math.min(
            parsePrice(cruise['Interior Price']),
            parsePrice(cruise['Ocean View Price']),
            parsePrice(cruise['Standard Balcony'])
          ),
          departureDateObj: parseDepartureDate(cruise['Departure Date'])
        };
      } catch (error) {
        console.warn('Error processing cruise data:', error);
        return null;
      }
    }).filter((cruise): cruise is ProcessedCruise => cruise !== null);
  }, [allCruises]);

  const filteredCruises = useMemo(() => {
    let result = [...processedCruises];

    if (selectedShip) {
      result = result.filter(c => c['Ship Name'] === selectedShip);
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
          if (!c.departureDateObj) return false;
          const cruiseDate = new Date(c.departureDateObj);
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
          const arrivalDateObj = parseArrivalDate(c['Departure Date']);
          if (!arrivalDateObj) return false;
          const cruiseArrivalDate = new Date(arrivalDateObj);
          cruiseArrivalDate.setUTCHours(23, 59, 59, 999);
          return cruiseArrivalDate.getTime() <= filterDate.getTime();
        });
      }
    }

    if (selectedCity) {
      result = result.filter(c => {
        // Check departure port
        if (c['Departure Port'] && c['Departure Port'].toLowerCase().includes(selectedCity.toLowerCase())) {
          return true;
        }
        // Check itinerary
        if (Array.isArray(c['Complete Itinerary'])) {
          return c['Complete Itinerary'].some(stop => 
            stop?.port?.toLowerCase().includes(selectedCity.toLowerCase())
          );
        }
        return false;
      });
    }

    if (debouncedItineraryQuery) {
      const query = sanitizeInput(debouncedItineraryQuery).toLowerCase();
      if (query) {
        result = result.filter(c => 
          Array.isArray(c['Complete Itinerary']) && 
          c['Complete Itinerary'].some(stop => 
            stop?.port?.toLowerCase().includes(query)
          )
        );
      }
    }

    return result;
  }, [processedCruises, selectedShip, debouncedMaxBudget, departureDate, debouncedItineraryQuery]);

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
        parsePrice(a['Standard Balcony'])
      );
      const priceB = Math.min(
        parsePrice(b['Interior Price']),
        parsePrice(b['Ocean View Price']),
        parsePrice(b['Standard Balcony'])
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
    setSelectedShip('');
    setMaxBudget('');
    setDepartureDate('');
    setArrivalDate('');
    setSelectedCity('');
    setItineraryQuery('');
    setRoomTypeFilter('');
  }, []);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= MIN_BUDGET_VALUE && parseFloat(value) <= MAX_BUDGET_VALUE)) {
      setMaxBudget(value);
    }
  }, []);

  const handleNotesChange = useCallback(async (sailingId: string, notes: string) => {
    // Update local state immediately
    setAllCruises(prev => prev.map(cruise => 
      cruise['Unique Sailing ID'] === sailingId 
        ? { ...cruise, 'User Notes': notes }
        : cruise
    ));

    // Save to API
    try {
      const updatedCruises = allCruises.map(cruise => 
        cruise['Unique Sailing ID'] === sailingId 
          ? { ...cruise, 'User Notes': notes }
          : cruise
      );
      
      await apiCall(API_BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: API_KEY, 
          data: updatedCruises, 
          ttl: null 
        }),
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
      // Optionally show user feedback about save failure
    }
  }, [allCruises, apiCall]);

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
                value={selectedShip} 
                onChange={(e) => setSelectedShip(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="ship-select-desc"
              >
                <option value="">All Ships</option>
                {shipNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <span id="ship-select-desc" className="sr-only">
                Select a specific ship or leave as all ships
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
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="city-select-desc"
              >
                <option value="">All Cities</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <span id="city-select-desc" className="sr-only">
                Select a specific city or port
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="itinerary-input" className="mb-1 font-medium text-gray-700">
                Destination
              </label>
              <input 
                id="itinerary-input" 
                type="text" 
                value={itineraryQuery} 
                onChange={(e) => setItineraryQuery(sanitizeInput(e.target.value))} 
                placeholder="e.g., Rome" 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="itinerary-input-desc"
              />
              <span id="itinerary-input-desc" className="sr-only">
                Search for cruises visiting specific destinations
              </span>
            </div>

            <div className="flex flex-col">
              <label htmlFor="room-type-select" className="mb-1 font-medium text-gray-700">
                Room Type
              </label>
              <select 
                id="room-type-select" 
                value={roomTypeFilter} 
                onChange={(e) => setRoomTypeFilter(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="room-type-select-desc"
              >
                <option value="">All Room Types</option>
                <option value="Interior">Interior</option>
                <option value="Ocean View">Ocean View</option>
                <option value="Balcony">Balcony</option>
                <option value="Suite">Suite</option>
              </select>
              <span id="room-type-select-desc" className="sr-only">
                Filter by specific room type for comparison
              </span>
            </div>

          </div>
          <div className="mt-4 flex justify-end">
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
            <div className={`grid grid-cols-1 md:grid-cols-2 ${cruisesToCompare.length > 2 ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
              {cruisesToCompare.map(cruise => (
                <ComparisonCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onRemove={() => handleToggleCompare(cruise['Unique Sailing ID'])} 
                  roomTypeFilter={roomTypeFilter}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCruises.map(cruise => (
                <CruiseCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onCompareToggle={handleToggleCompare} 
                  isComparing={comparisonList.includes(cruise['Unique Sailing ID'])}
                  canAddToComparison={true}
                  onNotesChange={handleNotesChange}
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
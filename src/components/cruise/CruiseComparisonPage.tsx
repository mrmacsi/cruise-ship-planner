'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CruiseData, ProcessedCruise } from '@/types/cruise';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { parsePrice, parseDepartureDate, sanitizeInput } from '@/utils/cruiseUtils';
import { API_BASE_URL, API_KEY, MAX_COMPARISON_ITEMS, MIN_BUDGET_VALUE, MAX_BUDGET_VALUE } from '@/utils/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CruiseCard } from '@/components/cruise/CruiseCard';
import { ComparisonCard } from '@/components/cruise/ComparisonCard';

export const CruiseComparisonPage: React.FC = () => {
  const [allCruises, setAllCruises] = useState<CruiseData[]>([]);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [itineraryQuery, setItineraryQuery] = useState('');

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
          return cruiseDate.getTime() === filterDate.getTime();
        });
      }
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

  const cruisesToCompare = useMemo(() => {
    return allCruises.filter(cruise => 
      comparisonList.includes(cruise['Unique Sailing ID'])
    );
  }, [comparisonList, allCruises]);

  const handleToggleCompare = useCallback((sailingId: string) => {
    setComparisonList(prev => {
      if (prev.includes(sailingId)) {
        return prev.filter(id => id !== sailingId);
      }
      return prev.length < MAX_COMPARISON_ITEMS ? [...prev, sailingId] : prev;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedShip('');
    setMaxBudget('');
    setDepartureDate('');
    setItineraryQuery('');
  }, []);

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= MIN_BUDGET_VALUE && parseFloat(value) <= MAX_BUDGET_VALUE)) {
      setMaxBudget(value);
    }
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label htmlFor="date-input" className="mb-1 font-medium text-gray-700">
                Departure Date
              </label>
              <input 
                id="date-input" 
                type="date" 
                value={departureDate} 
                onChange={(e) => setDepartureDate(e.target.value)} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-describedby="date-input-desc"
              />
              <span id="date-input-desc" className="sr-only">
                Select specific departure date
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

            <div className="flex items-end">
              <button 
                onClick={handleResetFilters} 
                className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 font-semibold shadow-md"
                aria-label="Clear all filters"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {cruisesToCompare.length > 0 && (
          <section className="mb-8" aria-labelledby="comparison-heading">
            <h2 id="comparison-heading" className="text-3xl font-bold text-center mb-6 text-blue-800">
              Comparison ({cruisesToCompare.length}/{MAX_COMPARISON_ITEMS})
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${cruisesToCompare.length > 2 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
              {cruisesToCompare.map(cruise => (
                <ComparisonCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onRemove={() => handleToggleCompare(cruise['Unique Sailing ID'])} 
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
                  canAddToComparison={comparisonList.length < MAX_COMPARISON_ITEMS}
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
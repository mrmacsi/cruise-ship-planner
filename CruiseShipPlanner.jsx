import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import CruiseForm from './src/components/CruiseForm';
import BulkImportForm from './src/components/BulkImportForm';

// --- Constants ---
const API_BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
const API_KEY = 'cruises';
const MAX_COMPARISON_ITEMS = 4;
const MAX_BUDGET_VALUE = 999999;
const MIN_BUDGET_VALUE = 0;

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">The application encountered an unexpected error.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Utility Functions ---
const parsePrice = (priceStr) => {
  if (!priceStr || typeof priceStr !== 'string' || priceStr.toLowerCase().includes('n/a')) {
    return Infinity;
  }
  const numericStr = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numericStr);
  return isNaN(parsed) || parsed < 0 ? Infinity : parsed;
};

const parseDepartureDate = (dateRangeStr) => {
  if (!dateRangeStr || typeof dateRangeStr !== 'string') return null;
  
  try {
    const startDateStr = dateRangeStr.split(' - ')[0];
    if (!startDateStr) return null;
    
    // Handle various date formats
    let parsableDateStr = startDateStr.replace(/'/g, '20');
    const date = new Date(parsableDateStr);
    
    if (isNaN(date.getTime())) {
      // Try alternative parsing
      const parts = startDateStr.split(' ');
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1];
        const year = parts[2].replace(/'/g, '20');
        parsableDateStr = `${day} ${month} ${year}`;
        const altDate = new Date(parsableDateStr);
        return isNaN(altDate.getTime()) ? null : altDate;
      }
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// --- Icon Components ---
const ShipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5" aria-hidden="true">
    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9-.5 2.5-1"/>
    <path d="M19.38 20A11.4 11.4 0 0 0 22 12V9l-8-4-8 4v3c0 2.9.92 5.33 2.62 7.18"/>
    <path d="M12 12V2"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5" aria-hidden="true">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const PoundIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5" aria-hidden="true">
    <path d="M18 7c0-1.7-1.3-3-3-3h-7a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h7c1.7 0 3-1.3 3-3"/>
    <path d="M8 17V7"/>
    <path d="M6 11h8"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

// --- Custom Hooks ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const apiCall = useCallback(async (url, options = {}) => {
    setIsLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { data: null, status: 404 };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { data: null, status: 'aborted' };
      }
      
      let errorMessage = error.message;
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { apiCall, isLoading, error };
};

// --- Cruise Comparison Page ---
function CruiseComparisonPage() {
  const [allCruises, setAllCruises] = useState([]);
  const [comparisonList, setComparisonList] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [itineraryQuery, setItineraryQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingCruise, setEditingCruise] = useState(null);
  const [notes, setNotes] = useState({});
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);

  const { apiCall, isLoading, error } = useApi();
  
  const debouncedItineraryQuery = useDebounce(itineraryQuery, 300);
  const debouncedMaxBudget = useDebounce(maxBudget, 300);
  const debouncedNotes = useDebounce(notes, 1000);

  const fetchCruises = useCallback(async () => {
    try {
      const result = await apiCall(`${API_BASE_URL}?key=${API_KEY}`);
      if (result.status === 404) {
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

  // Background save for notes without disrupting the UI
  useEffect(() => {
    if (Object.keys(debouncedNotes).length > 0) {
      const saveNotes = async () => {
        setIsBackgroundSaving(true);
        try {
          const updatedCruises = allCruises.map(cruise => ({
            ...cruise,
            notes: debouncedNotes[cruise['Unique Sailing ID']] || cruise.notes || ''
          }));
          
          const result = await apiCall(API_BASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              key: API_KEY, 
              data: updatedCruises, 
              ttl: null 
            }),
          });

          if (result.status !== 'aborted') {
            setAllCruises(updatedCruises);
          }
        } catch (error) {
          console.error('Failed to save notes:', error);
        } finally {
          setIsBackgroundSaving(false);
        }
      };
      
      saveNotes();
    }
  }, [debouncedNotes, allCruises, apiCall]);

  const processedCruises = useMemo(() => {
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
    }).filter(Boolean);
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
    const names = [...new Set(processedCruises.map(c => c['Ship Name']).filter(Boolean))];
    return names.sort();
  }, [processedCruises]);

  const cruisesToCompare = useMemo(() => {
    return allCruises.filter(cruise => 
      comparisonList.includes(cruise['Unique Sailing ID'])
    );
  }, [comparisonList, allCruises]);

  const handleToggleCompare = useCallback((sailingId) => {
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

  const handleBudgetChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '' || (parseFloat(value) >= MIN_BUDGET_VALUE && parseFloat(value) <= MAX_BUDGET_VALUE)) {
      setMaxBudget(value);
    }
  }, []);

  const handleNotesChange = useCallback((sailingId, value) => {
    setNotes(prev => ({
      ...prev,
      [sailingId]: value
    }));
  }, []);

  const handleSaveCruises = useCallback(async (updatedCruises) => {
    try {
      updatedCruises.forEach((cruise, index) => {
        if (!cruise['Ship Name'] || !cruise['Ship Name'].toString().trim()) {
          throw new Error(`Ship Name is required`);
        }
        
        // Add default values for missing fields
        cruise['Departure Port'] = cruise['Departure Port'] || 'TBD';
        cruise['Departure Date'] = cruise['Departure Date'] || 'TBD';
        cruise['Duration'] = cruise['Duration'] || '7 Nights';
        cruise['Interior Price'] = cruise['Interior Price'] || 'N/A';
        cruise['Ocean View Price'] = cruise['Ocean View Price'] || 'N/A';
        cruise['Standard Balcony'] = cruise['Standard Balcony'] || 'N/A';
        cruise['Suite Price'] = cruise['Suite Price'] || 'N/A';
        cruise['Yacht Club Price'] = cruise['Yacht Club Price'] || 'N/A';
        cruise['Special Offers'] = cruise['Special Offers'] || 'None';
        cruise['Itinerary Map'] = cruise['Itinerary Map'] || '';
        cruise['Booking Link (Constructed)'] = cruise['Booking Link (Constructed)'] || '';
        
        if (!Array.isArray(cruise['Complete Itinerary'])) {
          cruise['Complete Itinerary'] = [];
        }
        
        if (!cruise['Unique Sailing ID']) {
          cruise['Unique Sailing ID'] = `cruise_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;
        }
      });

      const method = allCruises.length > 0 ? 'PUT' : 'POST';
      
      const result = await apiCall(API_BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: API_KEY, 
          data: updatedCruises, 
          ttl: null 
        }),
      });

      if (result.status !== 'aborted') {
        setAllCruises(updatedCruises);
        setShowForm(false);
        setEditingCruise(null);
        setShowBulkImport(false);
      }
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  }, [apiCall, allCruises.length]);

  const handleAdd = useCallback((newCruise) => {
    const cruiseWithId = { 
      ...newCruise, 
      "Unique Sailing ID": `cruise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    const updatedCruises = [...allCruises, cruiseWithId];
    handleSaveCruises(updatedCruises);
  }, [allCruises, handleSaveCruises]);

  const handleEdit = useCallback((updatedCruise) => {
    const updatedCruises = allCruises.map(c => 
      c['Unique Sailing ID'] === updatedCruise['Unique Sailing ID'] ? updatedCruise : c
    );
    handleSaveCruises(updatedCruises);
  }, [allCruises, handleSaveCruises]);

  const handleDelete = useCallback((sailingId) => {
    const cruiseToDelete = allCruises.find(c => c['Unique Sailing ID'] === sailingId);
    const confirmMessage = `Are you sure you want to delete "${cruiseToDelete?.['Ship Name'] || 'this cruise'}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      const updatedCruises = allCruises.filter(c => c['Unique Sailing ID'] !== sailingId);
      handleSaveCruises(updatedCruises);
    }
  }, [allCruises, handleSaveCruises]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingCruise(null);
  }, []);

  const handleOpenEditForm = useCallback((cruise) => {
    setEditingCruise(cruise);
    setShowForm(true);
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
          {isBackgroundSaving && (
            <div className="mt-2 text-sm text-green-600 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              Saving notes...
            </div>
          )}
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-lg mb-8" aria-labelledby="filter-heading">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 id="filter-heading" className="text-2xl font-semibold text-blue-800">
              Filter Options
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowBulkImport(true)} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-semibold shadow-md"
                disabled={isLoading}
              >
                Bulk Import
              </button>
              <button 
                onClick={() => { setEditingCruise(null); setShowForm(true); }} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold shadow-md flex items-center"
                disabled={isLoading}
              >
                <PlusIcon /> Add New
              </button>
            </div>
          </div>
          
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
              >
                <option value="">All Ships</option>
                {shipNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
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
              />
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
              />
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
              />
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleResetFilters} 
                className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 font-semibold shadow-md"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCruises.map(cruise => (
                <CruiseCard 
                  key={cruise['Unique Sailing ID']} 
                  cruise={cruise} 
                  onCompareToggle={handleToggleCompare} 
                  isComparing={comparisonList.includes(cruise['Unique Sailing ID'])}
                  canAddToComparison={comparisonList.length < MAX_COMPARISON_ITEMS}
                  onEdit={handleOpenEditForm}
                  onDelete={handleDelete}
                  notes={notes[cruise['Unique Sailing ID']] || cruise.notes || ''}
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

      {showForm && (
        <CruiseForm 
          cruise={editingCruise} 
          onSave={editingCruise ? handleEdit : handleAdd}
          onClose={handleCloseForm}
          isLoading={isLoading}
        />
      )}
      
      {showBulkImport && (
        <BulkImportForm
          onSave={handleSaveCruises}
          onClose={() => setShowBulkImport(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// --- Card Components ---
const CruiseCard = ({ cruise, onCompareToggle, isComparing, canAddToComparison, onEdit, onDelete, notes, onNotesChange }) => {
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

  const handleNotesChange = useCallback((e) => {
    onNotesChange(cruise['Unique Sailing ID'], e.target.value);
  }, [cruise, onNotesChange]);

  const itinerary = useMemo(() => {
    return Array.isArray(cruise['Complete Itinerary']) ? cruise['Complete Itinerary'] : [];
  }, [cruise]);

  return (
    <article className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative">
        <img 
          src={imageError ? `https://placehold.co/600x400/e2e8f0/4a5568?text=Map+Not+Available` : cruise['Itinerary Map']} 
          alt={`Itinerary map for ${cruise['Ship Name']}`}
          className="w-full h-48 object-cover"
          onError={handleImageError}
          loading="lazy"
        />
        {cruise['Special Offers'] && cruise['Special Offers'] !== 'None' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Special Offer
          </div>
        )}        <div className="absolute top-2 left-2 flex space-x-1">
          <button 
            onClick={() => onEdit(cruise)} 
            className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Edit ${cruise['Ship Name']}`}
          >
            <EditIcon />
          </button>
          <button 
            onClick={() => onDelete(cruise['Unique Sailing ID'])} 
            className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-lg transition focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Delete ${cruise['Ship Name']}`}
          >
            <TrashIcon />
          </button>
        </div>
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Add your notes here..."
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
          />
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
                itinerary.map((stop, index) => (
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

const ComparisonCard = ({ cruise, onRemove }) => {
  const [imageError, setImageError] = useState(false);
  
  const formatPrice = useCallback((price) => {
    if (!price || typeof price !== 'string' || price.toLowerCase().includes('n/a')) {
      return 'N/A';
    }
    return price.split('(')[0].trim();
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <article className="bg-white rounded-2xl shadow-2xl overflow-hidden relative ring-2 ring-blue-500 flex flex-col">
      <button 
        onClick={onRemove} 
        className="absolute top-3 right-3 z-10 text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label={`Remove ${cruise['Ship Name']} from comparison`}
      >
        <CloseIcon />
      </button>

      <div className="relative">
        <img 
          src={imageError ? `https://placehold.co/600x400/e2e8f0/4a5568?text=${encodeURIComponent(cruise['Ship Name'])}` : cruise['Itinerary Map']} 
          alt={`Itinerary map for ${cruise['Ship Name']}`}
          className="w-full h-32 object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      <div className="p-6 flex-grow">
        <header className="mb-4 pr-8">
          <h3 className="text-xl font-bold text-blue-900 mb-1">{cruise['Ship Name']}</h3>
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
              <dd className="font-semibold">{formatPrice(cruise['Suite Price'])}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Yacht Club:</dt>
              <dd className="font-semibold">{formatPrice(cruise['Yacht Club Price'])}</dd>
            </div>
          </dl>
        </div>

        <a 
          href={cruise['Booking Link (Constructed)']} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full text-center mt-6 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-semibold shadow-lg"
        >
          Book This Cruise
        </a>
      </div>
    </article>
  );
};

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
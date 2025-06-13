import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

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

const validateCruiseData = (cruise) => {
  // More lenient validation - only check for absolute essentials
  if (!cruise || typeof cruise !== 'object') {
    throw new Error('Invalid cruise data - must be an object');
  }
  
  if (!cruise['Ship Name'] || !cruise['Ship Name'].toString().trim()) {
    throw new Error('Ship Name is required');
  }
  
  // Validate itinerary format if provided
  if (cruise['Complete Itinerary'] && typeof cruise['Complete Itinerary'] === 'string') {
    try {
      JSON.parse(cruise['Complete Itinerary']);
    } catch {
      throw new Error('Complete Itinerary must be valid JSON format');
    }
  }
  
  return true;
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

// --- Main App Component ---
function App() {
  const [page, setPage] = useState('compare');

  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen font-sans">
        <nav className="bg-white shadow-md" role="navigation" aria-label="Main navigation">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-900">MSC Cruise Manager</div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPage('compare')} 
                  className={`px-4 py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    page === 'compare' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={page === 'compare'}
                >
                  Comparison Tool
                </button>
                <button 
                  onClick={() => setPage('admin')} 
                  className={`px-4 py-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    page === 'admin' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-pressed={page === 'admin'}
                >
                  Admin Panel
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>
          {page === 'compare' ? <CruiseComparisonPage /> : <CruiseAdminPage />}
        </main>
      </div>
    </ErrorBoundary>
  );
}

// --- Cruise Comparison Page ---
function CruiseComparisonPage() {
  const [allCruises, setAllCruises] = useState([]);
  const [comparisonList, setComparisonList] = useState([]);
  const [selectedShip, setSelectedShip] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [itineraryQuery, setItineraryQuery] = useState('');

  const { apiCall, isLoading, error } = useApi();
  
  const debouncedItineraryQuery = useDebounce(itineraryQuery, 300);
  const debouncedMaxBudget = useDebounce(maxBudget, 300);

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

  const processedCruises = useMemo(() => {
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
}

// --- Admin Panel Page ---
function CruiseAdminPage() {
  const [cruises, setCruises] = useState([]);
  const [isKeyInCache, setIsKeyInCache] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingCruise, setEditingCruise] = useState(null);

  const { apiCall, isLoading, error } = useApi();

  const fetchCruisesFromAPI = useCallback(async () => {
    try {
      const result = await apiCall(`${API_BASE_URL}?key=${API_KEY}`);
      if (result.status === 404) {
        setCruises([]);
        setIsKeyInCache(false);
      } else if (result.data?.caches?.[0]?.data) {
        setCruises(result.data.caches[0].data);
        setIsKeyInCache(true);
      } else {
        setCruises([]);
        setIsKeyInCache(false);
      }
    } catch (error) {
      console.error('Failed to fetch cruises:', error);
      setCruises([]);
      setIsKeyInCache(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchCruisesFromAPI();
  }, [fetchCruisesFromAPI]);

  const handleSaveCruises = useCallback(async (updatedCruises) => {
    console.log('handleSaveCruises called with:', updatedCruises.length, 'cruises');
    
    try {
      // More lenient validation for bulk import
      updatedCruises.forEach((cruise, index) => {
        try {
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
          cruise['Suite Options'] = cruise['Suite Options'] || 'N/A';
          cruise['Special Offers'] = cruise['Special Offers'] || 'None';
          cruise['Itinerary Map'] = cruise['Itinerary Map'] || '';
          cruise['Booking Link (Constructed)'] = cruise['Booking Link (Constructed)'] || '';
          
          // Ensure Complete Itinerary is an array
          if (!Array.isArray(cruise['Complete Itinerary'])) {
            cruise['Complete Itinerary'] = [];
          }
          
          // Generate ID if missing
          if (!cruise['Unique Sailing ID']) {
            cruise['Unique Sailing ID'] = `cruise_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;
          }
          
        } catch (error) {
          throw new Error(`Cruise ${index + 1}: ${error.message}`);
        }
      });

      console.log('Validation passed, making API call...');
      const method = isKeyInCache ? 'PUT' : 'POST';
      console.log('Using method:', method, 'isKeyInCache:', isKeyInCache);
      
      const result = await apiCall(API_BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: API_KEY, 
          data: updatedCruises, 
          ttl: null 
        }),
      });

      console.log('API call result:', result);

      if (result.status !== 'aborted') {
        console.log('Setting cruise data and closing forms...');
        setCruises(updatedCruises);
        setIsKeyInCache(true);
        setShowForm(false);
        setEditingCruise(null);
        setShowBulkImport(false);
        console.log('Save completed successfully');
      }
    } catch (error) {
      console.error('Save failed:', error);
      throw error; // Re-throw so the form can handle it
    }
  }, [apiCall, isKeyInCache]);

  const handleAdd = useCallback((newCruise) => {
    const cruiseWithId = { 
      ...newCruise, 
      "Unique Sailing ID": `cruise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    const updatedCruises = [...cruises, cruiseWithId];
    handleSaveCruises(updatedCruises);
  }, [cruises, handleSaveCruises]);

  const handleEdit = useCallback((updatedCruise) => {
    const updatedCruises = cruises.map(c => 
      c['Unique Sailing ID'] === updatedCruise['Unique Sailing ID'] ? updatedCruise : c
    );
    handleSaveCruises(updatedCruises);
  }, [cruises, handleSaveCruises]);

  const handleDelete = useCallback((sailingId) => {
    const cruiseToDelete = cruises.find(c => c['Unique Sailing ID'] === sailingId);
    const confirmMessage = `Are you sure you want to delete "${cruiseToDelete?.['Ship Name'] || 'this cruise'}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      const updatedCruises = cruises.filter(c => c['Unique Sailing ID'] !== sailingId);
      handleSaveCruises(updatedCruises);
    }
  }, [cruises, handleSaveCruises]);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingCruise(null);
  }, []);

  const handleOpenEditForm = useCallback((cruise) => {
    setEditingCruise(cruise);
    setShowForm(true);
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">Admin Panel</h1>
        <p className="text-lg text-gray-600">Manage Cruise Listings</p>
      </header>

      {isLoading && <LoadingSpinner />}
      
      {error && (
        <div className="text-center font-semibold text-red-600 bg-red-100 p-4 rounded-lg mb-6" role="alert">
          <p>{error}</p>
          <button 
            onClick={fetchCruisesFromAPI}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry
          </button>
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-lg mb-8" aria-labelledby="listings-heading">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <h2 id="listings-heading" className="text-2xl font-semibold text-blue-800">
            Current Listings ({cruises.length})
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

        {cruises.length === 0 && !isLoading && !error && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">No cruises found. Add your first cruise or use Bulk Import.</p>
          </div>
        )}

        <div className="space-y-3">
          {cruises.map(cruise => (
            <div 
              key={cruise['Unique Sailing ID']} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-grow min-w-0">
                <p className="font-bold text-lg text-gray-800 truncate">
                  {cruise['Ship Name'] || 'Unnamed Ship'}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {cruise['Departure Date'] || 'No date'} | {cruise['Departure Port'] || 'No port'}
                </p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <button 
                  onClick={() => handleOpenEditForm(cruise)} 
                  className="text-blue-500 hover:text-blue-700 p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Edit ${cruise['Ship Name'] || 'cruise'}`}
                  disabled={isLoading}
                >
                  <EditIcon />
                </button>
                <button 
                  onClick={() => handleDelete(cruise['Unique Sailing ID'])} 
                  className="text-red-500 hover:text-red-700 p-2 rounded-full bg-red-100 hover:bg-red-200 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Delete ${cruise['Ship Name'] || 'cruise'}`}
                  disabled={isLoading}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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

// --- Form Components ---
const CruiseForm = ({ cruise, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialData = {
      'Ship Name': '',
      'Duration': '7 Nights',
      'Departure Port': '',
      'Departure Date': '',
      'Interior Price': '',
      'Ocean View Price': '',
      'Standard Balcony': '',
      'Suite Options': '',
      'Special Offers': 'None',
      'Itinerary Map': '',
      'Booking Link (Constructed)': '',
      'Complete Itinerary': '[]',
      ...cruise
    };

    if (Array.isArray(initialData['Complete Itinerary'])) {
      initialData['Complete Itinerary'] = JSON.stringify(initialData['Complete Itinerary'], null, 2);
    }

    setFormData(initialData);
    setValidationErrors({});
  }, [cruise]);

  const validateForm = useCallback((data) => {
    const errors = {};

    if (!data['Ship Name']?.trim()) {
      errors['Ship Name'] = 'Ship name is required';
    }

    if (!data['Departure Port']?.trim()) {
      errors['Departure Port'] = 'Departure port is required';
    }

    if (!data['Departure Date']?.trim()) {
      errors['Departure Date'] = 'Departure date is required';
    }

    try {
      if (data['Complete Itinerary']) {
        const parsed = JSON.parse(data['Complete Itinerary']);
        if (!Array.isArray(parsed)) {
          errors['Complete Itinerary'] = 'Must be a valid JSON array';
        }
      }
    } catch {
      errors['Complete Itinerary'] = 'Must be valid JSON format';
    }

    // Validate URLs if provided
    const urlFields = ['Itinerary Map', 'Booking Link (Constructed)'];
    urlFields.forEach(field => {
      if (data[field] && data[field].trim()) {
        try {
          new URL(data[field]);
        } catch {
          errors[field] = 'Must be a valid URL';
        }
      }
    });

    return errors;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, []);

  const handleLoadSample = useCallback(() => {
    const sampleData = [
      {
        "Unique Sailing ID": "sample_cruise_1",
        "Ship Name": "MSC Seaview",
        "Duration": "7 Nights",
        "Departure Port": "Genoa (Portofino), Italy",
        "Interior Price": "£ 1,313",
        "Ocean View Price": "£ 1,463",
        "Standard Balcony": "£ 1,563",
        "Suite Options": "Suite: £ 1,993, Yacht Club: £ 3,157",
        "Special Offers": "None",
        "Itinerary Map": "https://placehold.co/600x400/4f46e5/ffffff?text=Sample+Map",
        "Booking Link (Constructed)": "https://www.msccruises.co.uk/booking#cruise/sample",
        "Complete Itinerary": [
          { "day": "1", "date": "Monday, 01 Sep 2025", "port": "Genoa (Portofino), Italy", "arrival": "-", "departure": "18:00" },
          { "day": "2", "date": "Tuesday, 02 Sep 2025", "port": "La Spezia (Cinque Terre), Italy", "arrival": "07:00", "departure": "18:00" },
          { "day": "3", "date": "Wednesday, 03 Sep 2025", "port": "Civitavecchia (Rome), Italy", "arrival": "07:00", "departure": "19:00" }
        ],
        "Departure Date": "01 Sep '25 - 08 Sep '25"
      },
      {
        "Unique Sailing ID": "sample_cruise_2",
        "Ship Name": "MSC Fantasia",
        "Duration": "10 Nights",
        "Departure Port": "Barcelona, Spain",
        "Interior Price": "£ 1,899",
        "Ocean View Price": "£ 2,199",
        "Standard Balcony": "£ 2,599",
        "Suite Options": "Suite: £ 3,299, Yacht Club: £ 4,999",
        "Special Offers": "Early Bird 15% Off",
        "Itinerary Map": "https://placehold.co/600x400/4f46e5/ffffff?text=Sample+Map+2",
        "Booking Link (Constructed)": "https://www.msccruises.co.uk/booking#cruise/sample2",
        "Complete Itinerary": [
          { "day": "1", "date": "Friday, 15 Nov 2025", "port": "Barcelona, Spain", "arrival": "-", "departure": "18:00" },
          { "day": "2", "date": "Saturday, 16 Nov 2025", "port": "Palma, Mallorca", "arrival": "08:00", "departure": "18:00" },
          { "day": "3", "date": "Sunday, 17 Nov 2025", "port": "At Sea", "arrival": "-", "departure": "-" },
          { "day": "4", "date": "Monday, 18 Nov 2025", "port": "Naples, Italy", "arrival": "08:00", "departure": "19:00" }
        ],
        "Departure Date": "15 Nov '25 - 25 Nov '25"
      }
    ];
    
    setJsonText(JSON.stringify(sampleData, null, 2));
    setValidationError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = { 
        ...formData, 
        'Complete Itinerary': JSON.parse(formData['Complete Itinerary'] || '[]')
      };
      await onSave(finalData);
    } catch (error) {
      console.error('Form submission error:', error);
      setValidationErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave]);

  const inputClasses = useCallback((fieldName) => {
    const baseClasses = "p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    const errorClasses = validationErrors[fieldName] ? "border-red-500" : "border-gray-300";
    return `${baseClasses} ${errorClasses}`;
  }, [validationErrors]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="form-title" className="text-2xl font-bold text-blue-900">
            {cruise ? 'Edit Cruise' : 'Add New Cruise'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close form"
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        {validationErrors.submit && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {validationErrors.submit}
          </div>
        )}

        <div onKeyDown={handleKeyDown} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ship-name" className="block text-sm font-medium text-gray-700 mb-1">
                Ship Name *
              </label>
              <input 
                id="ship-name"
                name="Ship Name" 
                value={formData['Ship Name'] || ''} 
                onChange={handleChange} 
                placeholder="Enter ship name" 
                className={inputClasses('Ship Name')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Ship Name'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Ship Name']}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input 
                id="duration"
                name="Duration" 
                value={formData.Duration || ''} 
                onChange={handleChange} 
                placeholder="e.g., 7 Nights" 
                className={inputClasses('Duration')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="departure-port" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Port *
              </label>
              <input 
                id="departure-port"
                name="Departure Port" 
                value={formData['Departure Port'] || ''} 
                onChange={handleChange} 
                placeholder="Enter departure port" 
                className={inputClasses('Departure Port')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Departure Port'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Departure Port']}</p>
              )}
            </div>

            <div>
              <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date *
              </label>
              <input 
                id="departure-date"
                name="Departure Date" 
                value={formData['Departure Date'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., 01 Sep '25 - 08 Sep '25" 
                className={inputClasses('Departure Date')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Departure Date'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Departure Date']}</p>
              )}
            </div>

            <div>
              <label htmlFor="interior-price" className="block text-sm font-medium text-gray-700 mb-1">
                Interior Price
              </label>
              <input 
                id="interior-price"
                name="Interior Price" 
                value={formData['Interior Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,313" 
                className={inputClasses('Interior Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="ocean-view-price" className="block text-sm font-medium text-gray-700 mb-1">
                Ocean View Price
              </label>
              <input 
                id="ocean-view-price"
                name="Ocean View Price" 
                value={formData['Ocean View Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,463" 
                className={inputClasses('Ocean View Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="balcony-price" className="block text-sm font-medium text-gray-700 mb-1">
                Standard Balcony Price
              </label>
              <input 
                id="balcony-price"
                name="Standard Balcony" 
                value={formData['Standard Balcony'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,563" 
                className={inputClasses('Standard Balcony')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="suite-options" className="block text-sm font-medium text-gray-700 mb-1">
                Suite Options
              </label>
              <input 
                id="suite-options"
                name="Suite Options" 
                value={formData['Suite Options'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., Suite: £ 1,993, Yacht Club: £ 3,157" 
                className={inputClasses('Suite Options')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="itinerary-map" className="block text-sm font-medium text-gray-700 mb-1">
                Itinerary Map URL
              </label>
              <input 
                id="itinerary-map"
                name="Itinerary Map" 
                type="url"
                value={formData['Itinerary Map'] || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/map.jpg" 
                className={inputClasses('Itinerary Map')}
                disabled={isSubmitting}
              />
              {validationErrors['Itinerary Map'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Itinerary Map']}</p>
              )}
            </div>

            <div>
              <label htmlFor="booking-link" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Link URL
              </label>
              <input 
                id="booking-link"
                name="Booking Link (Constructed)" 
                type="url"
                value={formData['Booking Link (Constructed)'] || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/booking" 
                className={inputClasses('Booking Link (Constructed)')}
                disabled={isSubmitting}
              />
              {validationErrors['Booking Link (Constructed)'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Booking Link (Constructed)']}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="complete-itinerary" className="block text-sm font-medium text-gray-700 mb-1">
              Complete Itinerary (JSON format)
            </label>
            <textarea 
              id="complete-itinerary"
              name="Complete Itinerary" 
              value={formData['Complete Itinerary'] || '[]'} 
              onChange={handleChange} 
              rows="8" 
              className={`w-full font-mono text-sm ${inputClasses('Complete Itinerary')}`}
              placeholder='[{"day": "1", "date": "Monday, 01 Sep 2025", "port": "Genoa, Italy", "arrival": "-", "departure": "18:00"}]'
              disabled={isSubmitting}
            />
            {validationErrors['Complete Itinerary'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['Complete Itinerary']}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter itinerary as a JSON array of objects with day, date, port, arrival, and departure fields.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 self-center mr-auto">
              Tip: Press Ctrl+Enter to save quickly
            </p>
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSubmit}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Saving...' : 'Save Cruise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkImportForm = ({ onSave, onClose, isLoading }) => {
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateJson = useCallback((text) => {
    if (!text.trim()) {
      return 'Please enter JSON data';
    }

    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        return 'Data must be a JSON array';
      }

      if (data.length === 0) {
        return 'Array cannot be empty';
      }

      // Basic validation for each cruise object
      data.forEach((cruise, index) => {
        if (!cruise || typeof cruise !== 'object') {
          throw new Error(`Item ${index + 1} is not a valid object`);
        }
        
        // Check for required fields with more lenient validation
        const requiredFields = ['Ship Name'];
        const missing = requiredFields.filter(field => !cruise[field] || !cruise[field].toString().trim());
        
        if (missing.length > 0) {
          throw new Error(`Item ${index + 1}: Missing required fields: ${missing.join(', ')}`);
        }
      });

      return null;
    } catch (error) {
      return `JSON Error: ${error.message}`;
    }
  }, []);

  const handleTextChange = useCallback((e) => {
    const value = e.target.value;
    setJsonText(value);
    
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  const handleSubmit = useCallback(async () => {
    console.log('Import button clicked, validating JSON...');
    
    const error = validateJson(jsonText);
    if (error) {
      console.log('Validation error:', error);
      setValidationError(error);
      return;
    }

    console.log('JSON validation passed');
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      setValidationError(`Failed to parse JSON: ${parseError.message}`);
      return;
    }

    const confirmMessage = `This will replace all existing cruise data with ${data.length} new entries. Are you sure?`;
    console.log('Showing confirmation dialog...');
    
    if (!window.confirm(confirmMessage)) {
      console.log('User cancelled import');
      return;
    }

    console.log('User confirmed import, starting save...');
    setIsSubmitting(true);
    setValidationError('');
    
    try {
      console.log('Calling onSave with data:', data);
      await onSave(data);
      console.log('Save completed successfully');
    } catch (error) {
      console.error('Save error:', error);
      setValidationError(`Import failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [jsonText, validateJson, onSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 id="bulk-import-title" className="text-2xl font-bold text-blue-900">
            Bulk Import from JSON
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close bulk import"
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600">
              Paste a valid JSON array of cruise objects below. This will replace all current data.
            </p>
            <button
              onClick={handleLoadSample}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Load Sample Data
            </button>
          </div>
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Example format</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`[
  {
    "Ship Name": "MSC Seaview",
    "Duration": "7 Nights",
    "Departure Port": "Genoa, Italy",
    "Departure Date": "01 Sep '25 - 08 Sep '25",
    "Interior Price": "£ 1,313",
    "Complete Itinerary": [...]
  }
]`}
            </pre>
          </details>
        </div>

        {validationError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {validationError}
          </div>
        )}

        <div className="flex-grow flex flex-col">
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 mb-2">
            JSON Data
          </label>
          <textarea 
            id="json-input"
            value={jsonText}
            onChange={handleTextChange}
            placeholder='[
  {
    "Ship Name": "Example Ship",
    "Duration": "7 Nights",
    "Departure Port": "Example Port",
    "Departure Date": "01 Jan 25 - 08 Jan 25"
  }
]'
            className="flex-grow min-h-80 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 font-semibold transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Card Components ---
const CruiseCard = ({ cruise, onCompareToggle, isComparing, canAddToComparison }) => {
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
  const formatPrice = useCallback((price) => {
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

export default CruiseShipPlanner;
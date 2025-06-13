import React, { useState, useEffect, useRef } from 'react';

const SchengenTravelPlanner = () => {
  const defaultTrips = [
    { id: 0, location: 'UK', isSchengen: false, startDate: '2025-01-01', endDate: '2025-07-09', color: 'bg-red-500' },
    { id: 1, location: 'Spain', isSchengen: true, startDate: '2025-07-10', endDate: '2025-08-31', color: 'bg-blue-500' },
    { id: 2, location: 'Mediterranean Cruise', isSchengen: true, startDate: '2025-09-01', endDate: '2025-09-07', color: 'bg-teal-500' },
    { id: 3, location: 'Turkey', isSchengen: false, startDate: '2025-09-08', endDate: '2025-09-22', color: 'bg-amber-500' },
    { id: 4, location: 'Spain', isSchengen: true, startDate: '2025-09-23', endDate: '2025-10-03', color: 'bg-blue-500' },
    { id: 5, location: 'UK', isSchengen: false, startDate: '2025-10-04', endDate: '2025-12-14', color: 'bg-red-500' },
    { id: 6, location: 'Spain', isSchengen: true, startDate: '2025-12-15', endDate: '2025-12-25', color: 'bg-blue-500' },
    { id: 7, location: 'US/Singapore', isSchengen: false, startDate: '2025-12-26', endDate: '2026-01-14', color: 'bg-purple-500' },
    { id: 8, location: 'UK', isSchengen: false, startDate: '2026-01-15', endDate: '2026-01-31', color: 'bg-red-500' },
    { id: 9, location: 'Dubai', isSchengen: false, startDate: '2026-02-01', endDate: '2026-04-30', color: 'bg-yellow-500' },
    { id: 10, location: 'Turkey', isSchengen: false, startDate: '2026-05-01', endDate: '2026-07-01', color: 'bg-amber-500' },
    { id: 11, location: 'Spain', isSchengen: true, startDate: '2026-07-02', endDate: '2026-09-19', color: 'bg-blue-500' },
  ];

  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('planner');
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState('');
  const [allCacheData, setAllCacheData] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  
  const [newTrip, setNewTrip] = useState({
    location: '',
    isSchengen: false,
    startDate: '',
    endDate: '',
  });
  
  const [draggedTrip, setDraggedTrip] = useState(null);
  const [dragType, setDragType] = useState(null); // 'move', 'resize-start', or 'resize-end'
  const [dragStartPos, setDragStartPos] = useState(null);
  const [dragStartDate, setDragStartDate] = useState(null);
  const timelineRef = useRef(null);
  
  const [locations, setLocations] = useState([
    {name: 'Spain', isSchengen: true, color: 'bg-blue-500'},
    {name: 'UK', isSchengen: false, color: 'bg-red-500'},
    {name: 'Turkey', isSchengen: false, color: 'bg-amber-500'},
    {name: 'Dubai', isSchengen: false, color: 'bg-yellow-500'},
    {name: 'US/Singapore', isSchengen: false, color: 'bg-purple-500'},
    {name: 'Mediterranean Cruise', isSchengen: true, color: 'bg-teal-500'},
    {name: 'Gibraltar', isSchengen: false, color: 'bg-gray-500'}
  ]);
  
  const [schengenStats, setSchengenStats] = useState({
    totalDays: 0,
    validDays: []
  });

  const [cityLimits, setCityLimits] = useState({});
  const [ukTaxYearStats, setUkTaxYearStats] = useState({});

  const BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
  const CACHE_KEY = 'planner';

  // Cache API functions
  const loadTripsFromCache = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}?key=${CACHE_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.caches && data.caches.length > 0) {
          setTrips(data.caches[0].data);
        } else {
          // If no data in cache, save default trips
          await saveTripsToCache(defaultTrips);
          setTrips(defaultTrips);
        }
      } else if (response.status === 404) {
        // Key not found, save default trips
        await saveTripsToCache(defaultTrips);
        setTrips(defaultTrips);
      } else {
        console.error('Failed to load trips from cache');
        setTrips(defaultTrips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setTrips(defaultTrips);
    } finally {
      setLoading(false);
    }
  };

  const saveTripsToCache = async (tripsData) => {
    try {
      // Check if key exists first
      const checkResponse = await fetch(`${BASE_URL}?key=${CACHE_KEY}`);
      const method = checkResponse.ok ? 'PUT' : 'POST';
      
      const response = await fetch(BASE_URL, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: CACHE_KEY,
          data: tripsData,
          ttl: 86400 // 24 hours
        }),
      });

      if (response.ok) {
        setSaveStatus('✅ Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        setSaveStatus('❌ Save failed');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      console.error('Error saving trips:', error);
      setSaveStatus('❌ Save failed');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const resetToDefaultTrips = async () => {
    setTrips(defaultTrips);
    await saveTripsToCache(defaultTrips);
  };

  const loadAllCacheData = async () => {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        const data = await response.json();
        setAllCacheData(data);
        
        // Find planner data and set it for admin editing
        const plannerCache = data.caches?.find(cache => cache.key === CACHE_KEY);
        if (plannerCache) {
          setAdminData(JSON.stringify(plannerCache.data, null, 2));
        }
      }
    } catch (error) {
      console.error('Error loading all cache data:', error);
    }
  };

  const saveAdminData = async () => {
    try {
      const parsedData = JSON.parse(adminData);
      await saveTripsToCache(parsedData);
      setTrips(parsedData);
      await loadAllCacheData(); // Refresh admin view
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  // Load trips from cache on component mount
  useEffect(() => {
    loadTripsFromCache();
  }, []);

  // Auto-save trips whenever they change (except during initial load)
  useEffect(() => {
    if (!loading && trips.length > 0) {
      saveTripsToCache(trips);
    }
  }, [trips, loading]);

  // Load all cache data when admin tab is selected
  useEffect(() => {
    if (activeTab === 'admin') {
      loadAllCacheData();
    }
  }, [activeTab]);
  
  // Calculate days between two dates
  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  };
  
  // Sort trips by start date
  const sortTrips = (tripsToSort) => {
    return [...tripsToSort].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  };
  
  // Calculate Schengen days in a rolling 180-day window
  const calculateSchengenDays = () => {
    const sortedTrips = sortTrips(trips);
    const schengenDays = [];
    
    // For each day in a Schengen area, calculate the rolling 180-day window
    sortedTrips.forEach(trip => {
      if (trip.isSchengen) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const currentDay = new Date(day);
          const rollingWindowStart = new Date(currentDay);
          rollingWindowStart.setDate(rollingWindowStart.getDate() - 179); // 180 days including today
          
          // Count days in Schengen within the 180-day window before this day
          let daysInWindow = 0;
          sortedTrips.forEach(t => {
            if (t.isSchengen) {
              const tStart = new Date(t.startDate);
              const tEnd = new Date(t.endDate);
              
              // For each day of this trip
              for (let tDay = new Date(tStart); tDay <= tEnd; tDay.setDate(tDay.getDate() + 1)) {
                // If this day is within the rolling window and not after our current day
                if (tDay >= rollingWindowStart && tDay <= currentDay) {
                  daysInWindow++;
                }
              }
            }
          });
          
          schengenDays.push({
            date: new Date(currentDay),
            daysInWindow: daysInWindow,
            isOverLimit: daysInWindow > 90,
            location: trip.location
          });
        }
      }
    });
    
    setSchengenStats({
      totalDays: schengenDays.length,
      validDays: schengenDays
    });

    // City-specific calculations
    const cityDaysMap = {};
    
    // Get unique Schengen cities
    const schengenCities = [...new Set(
      trips.filter(trip => trip.isSchengen).map(trip => trip.location)
    )];
    
    // Calculate for each city
    schengenCities.forEach(city => {
      const cityDays = [];
      
      sortedTrips.forEach(trip => {
        if (trip.isSchengen && trip.location === city) {
          const start = new Date(trip.startDate);
          const end = new Date(trip.endDate);
          
          for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
            const currentDay = new Date(day);
            const rollingWindowStart = new Date(currentDay);
            rollingWindowStart.setDate(rollingWindowStart.getDate() - 179);
            
            // Count days for this city within the 180-day window
            let daysInWindow = 0;
            sortedTrips.forEach(t => {
              if (t.isSchengen && t.location === city) {
                const tStart = new Date(t.startDate);
                const tEnd = new Date(t.endDate);
                
                for (let tDay = new Date(tStart); tDay <= tEnd; tDay.setDate(tDay.getDate() + 1)) {
                  if (tDay >= rollingWindowStart && tDay <= currentDay) {
                    daysInWindow++;
                  }
                }
              }
            });
            
            cityDays.push({
              date: new Date(currentDay),
              daysInWindow: daysInWindow,
              isOverLimit: daysInWindow > 90
            });
          }
        }
      });
      
      // Check if any day exceeds the limit
      const hasOverLimit = cityDays.some(day => day.isOverLimit);
      const maxDays = cityDays.length > 0 ? Math.max(...cityDays.map(day => day.daysInWindow)) : 0;
      
      cityDaysMap[city] = {
        totalDays: cityDays.length,
        maxInAnyWindow: maxDays,
        hasOverLimit: hasOverLimit
      };
    });
    
    setCityLimits(cityDaysMap);
  };

  // Calculate UK tax year statistics
  const calculateUkTaxYearStats = () => {
    // Define the UK tax years we're interested in
    const taxYears = [
      { name: '2024-2025', start: '2024-04-06', end: '2025-04-05' },
      { name: '2025-2026', start: '2025-04-06', end: '2026-04-05' },
      { name: '2026-2027', start: '2026-04-06', end: '2027-04-05' },
    ];
    
    const ukStats = {};
    
    taxYears.forEach(taxYear => {
      let daysInUk = 0;
      const taxYearStart = new Date(taxYear.start);
      const taxYearEnd = new Date(taxYear.end);
      
      // Filter trips that are in the UK
      const ukTrips = trips.filter(trip => trip.location === 'UK');
      
      ukTrips.forEach(trip => {
        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
        
        // Check if trip overlaps with tax year
        if (tripEnd >= taxYearStart && tripStart <= taxYearEnd) {
          // Calculate overlap
          const overlapStart = tripStart > taxYearStart ? tripStart : taxYearStart;
          const overlapEnd = tripEnd < taxYearEnd ? tripEnd : taxYearEnd;
          
          // Add days
          daysInUk += calculateDays(overlapStart.toISOString().split('T')[0], overlapEnd.toISOString().split('T')[0]);
        }
      });
      
      ukStats[taxYear.name] = {
        daysInUk: daysInUk,
        meetsRequirement: daysInUk >= 90,
        daysNeeded: Math.max(0, 90 - daysInUk)
      };
    });
    
    setUkTaxYearStats(ukStats);
  };
  
  // Update calculations whenever trips change
  useEffect(() => {
    calculateSchengenDays();
    calculateUkTaxYearStats();
  }, [trips]);
  
  // Handle adding a new trip
  const handleAddTrip = () => {
    if (newTrip.location && newTrip.startDate && newTrip.endDate) {
      // Check if this is a custom location not in our list
      const isCustomLocation = !locations.some(loc => loc.name === newTrip.location);
      
      let tripColor = 'bg-gray-500';
      let isSchengenArea = newTrip.isSchengen || false;
      
      if (isCustomLocation) {
        // Add the new location to our locations list
        const newLocation = {
          name: newTrip.location,
          isSchengen: newTrip.isSchengen,
          color: newTrip.customColor || 'bg-gray-500'
        };
        
        setLocations([...locations, newLocation]);
        tripColor = newLocation.color;
        isSchengenArea = newLocation.isSchengen;
      } else {
        // Find the corresponding location object
        const locationObj = locations.find(loc => loc.name === newTrip.location);
        if (locationObj) {
          tripColor = locationObj.color;
          isSchengenArea = locationObj.isSchengen;
        }
      }
      
      const newTripWithId = {
        id: Date.now(), // Use timestamp for unique ID
        location: newTrip.location,
        isSchengen: isSchengenArea,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        color: tripColor
      };
      
      const updatedTrips = [...trips, newTripWithId];
      setTrips(sortTrips(updatedTrips));
      
      // Reset form
      setNewTrip({
        location: '',
        isSchengen: false,
        startDate: '',
        endDate: '',
        customColor: 'bg-gray-500'
      });
    }
  };
  
  // Handle editing a trip
  const handleEditTrip = (id, field, value) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id === id) {
        // If location is changing, update the Schengen status and color
        if (field === 'location') {
          const locationObj = locations.find(loc => loc.name === value);
          return { 
            ...trip, 
            [field]: value,
            isSchengen: locationObj ? locationObj.isSchengen : trip.isSchengen,
            color: locationObj ? locationObj.color : trip.color
          };
        }
        
        // For other fields, just update the value
        return { ...trip, [field]: value };
      }
      return trip;
    });
    
    setTrips(sortTrips(updatedTrips));
  };
  
  // Handle deleting a trip
  const handleDeleteTrip = (id) => {
    const updatedTrips = trips.filter(trip => trip.id !== id);
    setTrips(updatedTrips);
  };
  
  // Handle drag start for timeline items
  const handleTimelineDragStart = (e, trip, type) => {
    e.stopPropagation();
    setDraggedTrip(trip);
    setDragType(type);
    setDragStartPos(e.clientX);
    
    if (type === 'resize-start') {
      setDragStartDate(new Date(trip.startDate));
    } else if (type === 'resize-end') {
      setDragStartDate(new Date(trip.endDate));
    } else {
      // For moving the whole trip
      setDragStartDate({
        start: new Date(trip.startDate),
        end: new Date(trip.endDate)
      });
    }
  };
  
  // Handle timeline drag for a better UX
  const handleTimelineDrag = (e) => {
    e.preventDefault();
    if (!draggedTrip || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos;
    
    // Calculate the time scale - how many pixels per day
    const timelineStart = new Date('2025-01-01');  // Extended to include the January start
    const timelineEnd = new Date('2026-12-31');
    const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);
    const pixelsPerDay = rect.width / totalDays;
    
    const daysDelta = Math.round(deltaX / pixelsPerDay);
    
    if (Math.abs(daysDelta) === 0) return; // No change
    
    let newStartDate, newEndDate;
    const trip = trips.find(t => t.id === draggedTrip.id);
    if (!trip) return;
    
    if (dragType === 'move') {
      // Move the whole trip
      newStartDate = new Date(dragStartDate.start);
      newStartDate.setDate(newStartDate.getDate() + daysDelta);
      
      newEndDate = new Date(dragStartDate.end);
      newEndDate.setDate(newEndDate.getDate() + daysDelta);
    } else if (dragType === 'resize-start') {
      // Resize from the start
      newStartDate = new Date(dragStartDate);
      newStartDate.setDate(newStartDate.getDate() + daysDelta);
      
      // Don't allow start date to go past end date
      const endDate = new Date(trip.endDate);
      if (newStartDate > endDate) {
        newStartDate = new Date(endDate);
      }
      
      newEndDate = new Date(trip.endDate);
    } else if (dragType === 'resize-end') {
      // Resize from the end
      newEndDate = new Date(dragStartDate);
      newEndDate.setDate(newEndDate.getDate() + daysDelta);
      
      // Don't allow end date to go before start date
      const startDate = new Date(trip.startDate);
      if (newEndDate < startDate) {
        newEndDate = new Date(startDate);
      }
      
      newStartDate = new Date(trip.startDate);
    }
    
    // Format dates
    const formattedStartDate = newStartDate.toISOString().split('T')[0];
    const formattedEndDate = newEndDate.toISOString().split('T')[0];
    
    // Update the trip
    const updatedTrips = trips.map(t => {
      if (t.id === draggedTrip.id) {
        return {
          ...t,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        };
      }
      return t;
    });
    
    setTrips(updatedTrips);
  };
  
  // Handle dropping for timeline items
  const handleTimelineDragEnd = () => {
    setDraggedTrip(null);
    setDragType(null);
    setDragStartPos(null);
    setDragStartDate(null);
  };
  
  // Handle location change
  const handleLocationChange = (e, id) => {
    const location = e.target.value;
    const locationObj = locations.find(loc => loc.name === location);
    
    handleEditTrip(id, 'location', location);
    handleEditTrip(id, 'isSchengen', locationObj ? locationObj.isSchengen : false);
  };
  
  return (
    <div className="flex flex-col p-4 max-w-full">
      <h2 className="text-xl font-bold mb-4">Schengen Travel Planner</h2>
      
      {/* Tab Navigation */}
      <div className="flex mb-4 border-b">
        <button 
          className={`px-4 py-2 ${activeTab === 'planner' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('planner')}
        >
          Travel Planner
        </button>
        <button 
          className={`px-4 py-2 ml-4 ${activeTab === 'admin' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('admin')}
        >
          Admin
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p>Loading trips from cache...</p>
        </div>
      )}

      {/* Travel Planner Tab */}
      {!loading && activeTab === 'planner' && (
        <>
          {/* Status and Reset Button */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              {saveStatus && <span className="text-sm">{saveStatus}</span>}
              <button 
                onClick={resetToDefaultTrips}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
              >
                Reset to Default Trips
              </button>
            </div>
          </div>
          
          {/* Information Panel */}
          <div className="mb-6 p-4 bg-gray-100 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Schengen Area Rules</h3>
            <p className="text-sm mb-2">You can stay a maximum of 90 days in any 180-day period in the Schengen Area.</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs">Within limit</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-xs">Over 90-day limit</span>
              </div>
            </div>
          </div>
          
          {/* Trip Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white rounded shadow-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Location</th>
                  <th className="py-2 px-4 text-left">Schengen</th>
                  <th className="py-2 px-4 text-left">Start Date</th>
                  <th className="py-2 px-4 text-left">End Date</th>
                  <th className="py-2 px-4 text-left">Days</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortTrips(trips).map((trip) => (
                  <tr key={trip.id} className="border-t">
                    <td className="py-2 px-4">
                      <select 
                        value={trip.location}
                        onChange={(e) => handleLocationChange(e, trip.id)}
                        className="border p-1 rounded w-full"
                      >
                        {locations.map(loc => (
                          <option key={loc.name} value={loc.name}>{loc.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-block w-4 h-4 rounded-full ${trip.isSchengen ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </td>
                    <td className="py-2 px-4">
                      <input 
                        type="date" 
                        value={trip.startDate}
                        onChange={(e) => handleEditTrip(trip.id, 'startDate', e.target.value)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <input 
                        type="date" 
                        value={trip.endDate}
                        onChange={(e) => handleEditTrip(trip.id, 'endDate', e.target.value)}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className="py-2 px-4">
                      {calculateDays(trip.startDate, trip.endDate)}
                    </td>
                    <td className="py-2 px-4">
                      <button 
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Add Trip Form */}
          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <h3 className="font-semibold mb-2">Add New Trip</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm mb-1">Location</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={newTrip.location}
                    onChange={(e) => {
                      const locationValue = e.target.value;
                      
                      // Always update the location in state, even for custom location
                      if (locationValue === "custom-new-location") {
                        setNewTrip({
                          ...newTrip,
                          location: locationValue,
                          customColor: 'bg-gray-500'
                        });
                        return;
                      }
                      
                      const locationObj = locations.find(loc => loc.name === locationValue);
                      setNewTrip({
                        ...newTrip, 
                        location: locationValue,
                        isSchengen: locationObj ? locationObj.isSchengen : false
                      });
                    }}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select location</option>
                    {locations.map(loc => (
                      <option key={loc.name} value={loc.name}>{loc.name}</option>
                    ))}
                    <option value="custom-new-location">+ Add custom location</option>
                  </select>
                  
                  {newTrip.location === "custom-new-location" && (
                    <div className="mt-2 space-y-2">
                      <input 
                        type="text" 
                        placeholder="Enter location name"
                        className="border p-2 rounded w-full"
                        onChange={(e) => {
                          setNewTrip({
                            ...newTrip,
                            location: e.target.value
                          });
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-sm flex items-center gap-1">
                          <input 
                            type="checkbox" 
                            checked={newTrip.isSchengen}
                            onChange={(e) => {
                              setNewTrip({
                                ...newTrip,
                                isSchengen: e.target.checked
                              });
                            }}
                          />
                          Schengen Area
                        </label>
                        <select 
                          className="border p-1 rounded ml-2"
                          defaultValue="bg-gray-500"
                          onChange={(e) => {
                            setNewTrip({
                              ...newTrip,
                              customColor: e.target.value
                            });
                          }}
                        >
                          <option value="bg-gray-500">Gray</option>
                          <option value="bg-blue-500">Blue</option>
                          <option value="bg-green-500">Green</option>
                          <option value="bg-red-500">Red</option>
                          <option value="bg-yellow-500">Yellow</option>
                          <option value="bg-purple-500">Purple</option>
                          <option value="bg-pink-500">Pink</option>
                          <option value="bg-indigo-500">Indigo</option>
                          <option value="bg-teal-500">Teal</option>
                          <option value="bg-orange-500">Orange</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={newTrip.startDate}
                  onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">End Date</label>
                <input 
                  type="date" 
                  value={newTrip.endDate}
                  onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleAddTrip}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Add Trip
                </button>
              </div>
            </div>
          </div>
          
          {/* Timeline Visualization */}
          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <h3 className="font-semibold mb-2">Timeline Visualization</h3>
            <p className="text-xs mb-2">Drag trips to move them. Drag edges to resize. Changes sync with the table above.</p>
            <div 
              ref={timelineRef}
              className="relative h-64 border border-gray-300 rounded p-2 overflow-x-auto"
              onMouseMove={handleTimelineDrag}
              onMouseUp={handleTimelineDragEnd}
              onMouseLeave={handleTimelineDragEnd}
            >
              {/* Month markers */}
              <div className="absolute top-0 left-0 right-0 h-6 flex text-xs">
                {Array.from({ length: 24 }).map((_, i) => {
                  const date = new Date('2025-01-01');
                  date.setMonth(date.getMonth() + i);
                  return (
                    <div 
                      key={i} 
                      className="flex-1 border-l border-gray-300 pl-1"
                    >
                      {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  );
                })}
              </div>
              
              {/* Trips as blocks */}
              <div className="absolute top-8 left-0 right-0 bottom-0">
                {sortTrips(trips).map((trip, index) => {
                  // Calculate position
                  const start = new Date(trip.startDate);
                  const end = new Date(trip.endDate);
                  const timelineStart = new Date('2025-01-01');
                  const timelineEnd = new Date('2026-12-31');
                  const totalDays = (timelineEnd - timelineStart) / (1000 * 60 * 60 * 24);
                  
                  const startOffset = (start - timelineStart) / (1000 * 60 * 60 * 24);
                  const tripDays = (end - start) / (1000 * 60 * 60 * 24) + 1;
                  
                  const left = (startOffset / totalDays) * 100;
                  const width = (tripDays / totalDays) * 100;
                  
                  return (
                    <div 
                      key={trip.id}
                      className={`absolute ${trip.color} rounded px-2 overflow-hidden cursor-move shadow-sm hover:shadow transition-shadow`}
                      style={{ 
                        left: `${left}%`, 
                        width: `${width}%`, 
                        top: `${(index % 4) * 20}%`, 
                        height: '20%',
                        zIndex: draggedTrip && draggedTrip.id === trip.id ? 20 : 10 
                      }}
                      onMouseDown={(e) => handleTimelineDragStart(e, trip, 'move')}
                    >
                      <div className="flex justify-between items-center h-full">
                        <span className="text-white text-xs truncate">{trip.location}</span>
                        <span className="text-white text-xs">
                          {calculateDays(trip.startDate, trip.endDate)}d
                        </span>
                      </div>
                      
                      {/* Drag handles */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-2 bg-black bg-opacity-20 cursor-w-resize hover:bg-opacity-40"
                        onMouseDown={(e) => handleTimelineDragStart(e, trip, 'resize-start')}
                      ></div>
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-2 bg-black bg-opacity-20 cursor-e-resize hover:bg-opacity-40"
                        onMouseDown={(e) => handleTimelineDragStart(e, trip, 'resize-end')}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* City-specific Schengen Checklist */}
          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <h3 className="font-semibold mb-2">City-Specific Schengen Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(cityLimits).map(([city, stats]) => (
                <div key={city} className={`p-3 rounded border ${stats.hasOverLimit ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={!stats.hasOverLimit} 
                      readOnly
                      className="mr-2"
                    />
                    <span className="font-medium">{city}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Total days: {stats.totalDays}</p>
                    <p>Max in any 180-day period: {stats.maxInAnyWindow}/90</p>
                    {stats.hasOverLimit && (
                      <p className="text-red-600 font-semibold mt-1">
                        Exceeds 90-day limit! Reduce stay by {stats.maxInAnyWindow - 90} days.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* UK Tax Year Requirement Checklist */}
          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <h3 className="font-semibold mb-2">UK Tax Residency Requirement (91 days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(ukTaxYearStats).map(([taxYear, stats]) => (
                <div key={taxYear} className={`p-3 rounded border ${stats.meetsRequirement ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={stats.meetsRequirement} 
                      readOnly
                      className="mr-2"
                    />
                    <span className="font-medium">Tax Year {taxYear}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Days in UK: {stats.daysInUk}/90 required</p>
                    {!stats.meetsRequirement && (
                      <p className="text-yellow-600 font-semibold mt-1">
                        Need {stats.daysNeeded} more days in UK
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Schengen Day Calculator */}
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-2">Schengen Days Used</h3>
            <div className="mb-4">
              <p className="font-medium">Total Schengen days: {schengenStats.totalDays}</p>
              {schengenStats.validDays.some(day => day.isOverLimit) && (
                <p className="text-red-500 font-medium mt-2">
                  Warning: You exceed the 90-day limit in some periods!
                </p>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <div className="flex flex-nowrap min-w-full">
                {sortTrips(trips).filter(trip => trip.isSchengen).map(trip => {
                  const days = calculateDays(trip.startDate, trip.endDate);
                  const start = new Date(trip.startDate);
                  const windowEnd = new Date(start);
                  windowEnd.setDate(windowEnd.getDate() + 179);
                  
                  // Find if any days in this trip exceed the limit
                  const hasOverLimit = schengenStats.validDays.some(day => {
                    const dayDate = new Date(day.date);
                    const tripStart = new Date(trip.startDate);
                    const tripEnd = new Date(trip.endDate);
                    return dayDate >= tripStart && dayDate <= tripEnd && day.isOverLimit;
                  });
                  
                  return (
                    <div key={trip.id} className="mr-4 mb-2 flex-none">
                      <div className={`p-2 rounded ${hasOverLimit ? 'bg-red-100' : 'bg-green-100'}`}>
                        <p className="font-medium">{trip.location}</p>
                        <p className="text-sm">{trip.startDate} to {trip.endDate}</p>
                        <p className="text-sm">{days} days</p>
                        <p className="text-xs mt-1">
                          180-day window ends: {windowEnd.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-4">Edit Planner Data (JSON)</h3>
            <textarea
              value={adminData}
              onChange={(e) => setAdminData(e.target.value)}
              className="w-full h-64 p-3 border rounded font-mono text-sm"
              placeholder="JSON data will appear here..."
            />
            <div className="mt-4 flex gap-2">
              <button 
                onClick={saveAdminData}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
              <button 
                onClick={loadAllCacheData}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-4">All Cache Data</h3>
            <div className="space-y-4">
              {allCacheData.caches ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Total keys: {allCacheData.total_keys} | Retrieved: {new Date(allCacheData.retrieved_at).toLocaleString()}
                  </p>
                  {allCacheData.caches.map((cache, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{cache.key}</h4>
                        <span className="text-xs text-gray-500">{cache.type}</span>
                      </div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(cache.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No cache data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CruiseShipPlanner;
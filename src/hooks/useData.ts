import { useState, useEffect } from 'react';
import type { Trip, Location } from '@/utils/constants';
import { DEFAULT_TRIPS, DEFAULT_LOCATIONS } from '@/utils/constants';
import { sortTrips } from '@/utils/dateUtils';
import { useCache } from './useCache';

export const useData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  const { loadTripsFromCache, saveTripsToCache, loading, saveStatus } = useCache();

  // Load trips from cache on component mount
  useEffect(() => {
    const loadData = async () => {
      const cachedTrips = await loadTripsFromCache();
      if (cachedTrips.length > 0) {
        setTrips(cachedTrips);
      } else {
        setTrips(DEFAULT_TRIPS);
        await saveTripsToCache(DEFAULT_TRIPS);
      }
    };
    loadData();
  }, []);

  // Auto-save trips whenever they change (except during initial load)
  useEffect(() => {
    if (!loading && trips.length > 0) {
      saveTripsToCache(trips);
    }
  }, [trips, loading]);

  const addTrip = (newTrip: Omit<Trip, 'id'>) => {
    // Check if this is a custom location not in our list
    const isCustomLocation = !locations.some(loc => loc.name === newTrip.location);
    
    let tripColor = newTrip.color || 'bg-gray-500';
    let isSchengenArea = newTrip.isSchengen;
    
    if (isCustomLocation) {
      // Add the new location to our locations list
      const newLocation: Location = {
        name: newTrip.location,
        isSchengen: newTrip.isSchengen,
        color: tripColor
      };
      
      setLocations(prev => [...prev, newLocation]);
    } else {
      // Find the corresponding location object
      const locationObj = locations.find(loc => loc.name === newTrip.location);
      if (locationObj) {
        tripColor = locationObj.color;
        isSchengenArea = locationObj.isSchengen;
      }
    }
    
    const newTripWithId: Trip = {
      id: Date.now(), // Use timestamp for unique ID
      location: newTrip.location,
      isSchengen: isSchengenArea,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      color: tripColor
    };
    
    const updatedTrips = [...trips, newTripWithId];
    setTrips(sortTrips(updatedTrips));
  };

  const editTrip = (id: number, field: keyof Trip, value: string | boolean | number) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id === id) {
        // If location is changing, update the Schengen status and color
        if (field === 'location' && typeof value === 'string') {
          const locationObj = locations.find(loc => loc.name === value);
          return { 
            ...trip, 
            [field]: value,
            isSchengen: locationObj ? locationObj.isSchengen : trip.isSchengen,
            color: locationObj ? locationObj.color : trip.color
          };
        }
        
        // For other fields, just update the value
        return { ...trip, [field]: value as never };
      }
      return trip;
    });
    
    setTrips(sortTrips(updatedTrips));
  };

  const deleteTrip = (id: number) => {
    const updatedTrips = trips.filter(trip => trip.id !== id);
    setTrips(updatedTrips);
  };

  const resetToDefaultTrips = async () => {
    setTrips(DEFAULT_TRIPS);
    await saveTripsToCache(DEFAULT_TRIPS);
  };

  return {
    trips,
    locations,
    loading,
    saveStatus,
    addTrip,
    editTrip,
    deleteTrip,
    resetToDefaultTrips,
    setTrips,
  };
}; 
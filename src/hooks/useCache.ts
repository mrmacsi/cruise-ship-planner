import { useState } from 'react';
import type { Trip } from '@/utils/constants';
import { BASE_URL, CACHE_KEY } from '@/utils/api';

export const useCache = () => {
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTripsFromCache = async (): Promise<Trip[]> => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}?key=${CACHE_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.caches && data.caches.length > 0) {
          return data.caches[0].data;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveTripsToCache = async (tripsData: Trip[]): Promise<void> => {
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

  const loadAllCacheData = async () => {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error loading all cache data:', error);
      return null;
    }
  };

  return {
    saveStatus,
    loading,
    loadTripsFromCache,
    saveTripsToCache,
    loadAllCacheData,
  };
}; 
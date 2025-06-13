import { useState } from 'react';
import type { Trip } from '@/utils/constants';
import { useCache } from './useCache';

interface CacheData {
  total_keys: number;
  retrieved_at: string;
  caches: Array<{
    key: string;
    type: string;
    data: unknown;
  }>;
}

export const useAdminData = () => {
  const [adminData, setAdminData] = useState('');
  const [allCacheData, setAllCacheData] = useState<CacheData | Record<string, never>>({});
  const { loadAllCacheData, saveTripsToCache } = useCache();

  const loadAllCache = async () => {
    try {
      const data = await loadAllCacheData();
      if (data) {
        setAllCacheData(data);
        
        // Find planner data and set it for admin editing
        const plannerCache = 'caches' in data ? data.caches?.find((cache: { key: string }) => cache.key === 'planner') : null;
        if (plannerCache) {
          setAdminData(JSON.stringify(plannerCache.data, null, 2));
        }
      }
    } catch (error) {
      console.error('Error loading cache data:', error);
    }
  };

  const saveAdminData = async (setTrips: (trips: Trip[]) => void) => {
    try {
      const parsedData = JSON.parse(adminData);
      await saveTripsToCache(parsedData);
      setTrips(parsedData);
      await loadAllCache(); // Refresh admin view
      return true;
          } catch {
        alert('Invalid JSON format');
        return false;
      }
  };

  return {
    adminData,
    setAdminData,
    allCacheData,
    loadAllCache,
    saveAdminData,
  };
}; 
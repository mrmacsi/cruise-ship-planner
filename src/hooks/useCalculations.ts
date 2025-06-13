import { useState, useEffect } from 'react';
import type { Trip, SchengenDay, CityLimitStats, UkTaxYearStats } from '@/utils/constants';
import { calculateSchengenDays, calculateCityLimits, calculateUkTaxYearStats } from '@/utils/calculations';

export const useCalculations = (trips: Trip[]) => {
  const [schengenStats, setSchengenStats] = useState<{
    totalDays: number;
    validDays: SchengenDay[];
  }>({
    totalDays: 0,
    validDays: []
  });
  
  const [cityLimits, setCityLimits] = useState<Record<string, CityLimitStats>>({});
  const [ukTaxYearStats, setUkTaxYearStats] = useState<Record<string, UkTaxYearStats>>({});

  // Update calculations whenever trips change
  useEffect(() => {
    if (trips.length > 0) {
      const schengenResults = calculateSchengenDays(trips);
      setSchengenStats(schengenResults);
      
      const cityResults = calculateCityLimits(trips);
      setCityLimits(cityResults);
      
      const ukResults = calculateUkTaxYearStats(trips);
      setUkTaxYearStats(ukResults);
    }
  }, [trips]);

  return {
    schengenStats,
    cityLimits,
    ukTaxYearStats,
  };
}; 
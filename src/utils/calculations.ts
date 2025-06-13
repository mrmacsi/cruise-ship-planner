import type { Trip, SchengenDay, CityLimitStats, UkTaxYearStats } from './constants';
import { TAX_YEARS, SCHENGEN_LIMIT_DAYS, SCHENGEN_WINDOW_DAYS, UK_TAX_RESIDENCY_DAYS } from './constants';
import { calculateDays, sortTrips, getDateRangeOverlap } from './dateUtils';

/**
 * Calculate Schengen days in a rolling 180-day window
 */
export const calculateSchengenDays = (trips: Trip[]) => {
  const sortedTrips = sortTrips(trips);
  const schengenDays: SchengenDay[] = [];
  
  // For each day in a Schengen area, calculate the rolling 180-day window
  sortedTrips.forEach(trip => {
    if (trip.isSchengen) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      
      for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        const currentDay = new Date(day);
        const rollingWindowStart = new Date(currentDay);
        rollingWindowStart.setDate(rollingWindowStart.getDate() - (SCHENGEN_WINDOW_DAYS - 1)); // 180 days including today
        
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
          isOverLimit: daysInWindow > SCHENGEN_LIMIT_DAYS,
          location: trip.location
        });
      }
    }
  });
  
  return {
    totalDays: schengenDays.length,
    validDays: schengenDays
  };
};

/**
 * Calculate city-specific Schengen limits
 */
export const calculateCityLimits = (trips: Trip[]): Record<string, CityLimitStats> => {
  const sortedTrips = sortTrips(trips);
  const cityDaysMap: Record<string, CityLimitStats> = {};
  
  // Get unique Schengen cities
  const schengenCities = [...new Set(
    trips.filter(trip => trip.isSchengen).map(trip => trip.location)
  )];
  
  // Calculate for each city
  schengenCities.forEach(city => {
    const cityDays: SchengenDay[] = [];
    
    sortedTrips.forEach(trip => {
      if (trip.isSchengen && trip.location === city) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const currentDay = new Date(day);
          const rollingWindowStart = new Date(currentDay);
          rollingWindowStart.setDate(rollingWindowStart.getDate() - (SCHENGEN_WINDOW_DAYS - 1));
          
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
            isOverLimit: daysInWindow > SCHENGEN_LIMIT_DAYS,
            location: city
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
  
  return cityDaysMap;
};

/**
 * Calculate UK tax year statistics
 */
export const calculateUkTaxYearStats = (trips: Trip[]): Record<string, UkTaxYearStats> => {
  const ukStats: Record<string, UkTaxYearStats> = {};
  
  TAX_YEARS.forEach(taxYear => {
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
        const overlap = getDateRangeOverlap(
          trip.startDate,
          trip.endDate,
          taxYear.start,
          taxYear.end
        );
        
        if (overlap) {
          daysInUk += calculateDays(overlap.start, overlap.end);
        }
      }
    });
    
    ukStats[taxYear.name] = {
      daysInUk: daysInUk,
      meetsRequirement: daysInUk >= UK_TAX_RESIDENCY_DAYS,
      daysNeeded: Math.max(0, UK_TAX_RESIDENCY_DAYS - daysInUk)
    };
  });
  
  return ukStats;
}; 
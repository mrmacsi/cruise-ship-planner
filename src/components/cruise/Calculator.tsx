import type { Trip, SchengenDay } from '@/utils/constants';
import { calculateDays, sortTrips } from '@/utils/dateUtils';

interface CalculatorProps {
  trips: Trip[];
  schengenStats: {
    totalDays: number;
    validDays: SchengenDay[];
  };
}

export default function Calculator({ trips, schengenStats }: CalculatorProps) {
  return (
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
  );
} 
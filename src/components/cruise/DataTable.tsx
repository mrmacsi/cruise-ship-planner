import type { Trip, Location } from '@/utils/constants';
import { calculateDays, sortTrips } from '@/utils/dateUtils';

interface DataTableProps {
  trips: Trip[];
  locations: Location[];
  onEditTrip: (id: number, field: keyof Trip, value: string | boolean | number) => void;
  onDeleteTrip: (id: number) => void;
}

export default function DataTable({ trips, locations, onEditTrip, onDeleteTrip }: DataTableProps) {
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
    const location = e.target.value;
    const locationObj = locations.find(loc => loc.name === location);
    
    onEditTrip(id, 'location', location);
    if (locationObj) {
      onEditTrip(id, 'isSchengen', locationObj.isSchengen);
      onEditTrip(id, 'color', locationObj.color);
    }
  };

  return (
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
                  onChange={(e) => onEditTrip(trip.id, 'startDate', e.target.value)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="py-2 px-4">
                <input 
                  type="date" 
                  value={trip.endDate}
                  onChange={(e) => onEditTrip(trip.id, 'endDate', e.target.value)}
                  className="border p-1 rounded w-full"
                />
              </td>
              <td className="py-2 px-4">
                {calculateDays(trip.startDate, trip.endDate)}
              </td>
              <td className="py-2 px-4">
                <button 
                  onClick={() => onDeleteTrip(trip.id)}
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
  );
} 
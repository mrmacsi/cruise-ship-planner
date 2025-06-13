import { useState } from 'react';
import type { Trip, Location } from '@/utils/constants';
import { COLOR_OPTIONS } from '@/utils/constants';

interface DataFormProps {
  locations: Location[];
  onAddTrip: (trip: Omit<Trip, 'id'>) => void;
}

export default function DataForm({ locations, onAddTrip }: DataFormProps) {
  const [newTrip, setNewTrip] = useState({
    location: '',
    isSchengen: false,
    startDate: '',
    endDate: '',
    color: 'bg-gray-500',
  });

  const handleSubmit = () => {
    if (newTrip.location && newTrip.startDate && newTrip.endDate) {
      onAddTrip(newTrip);
      
      // Reset form
      setNewTrip({
        location: '',
        isSchengen: false,
        startDate: '',
        endDate: '',
        color: 'bg-gray-500',
      });
    }
  };

  const handleLocationChange = (value: string) => {
    if (value === "custom-new-location") {
      setNewTrip({
        ...newTrip,
        location: value,
        color: 'bg-gray-500'
      });
      return;
    }
    
    const locationObj = locations.find(loc => loc.name === value);
    setNewTrip({
      ...newTrip, 
      location: value,
      isSchengen: locationObj ? locationObj.isSchengen : false,
      color: locationObj ? locationObj.color : 'bg-gray-500'
    });
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm mb-6">
      <h3 className="font-semibold mb-2">Add New Trip</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm mb-1">Location</label>
          <div className="flex flex-col gap-2">
            <select 
              value={newTrip.location}
              onChange={(e) => handleLocationChange(e.target.value)}
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
                    value={newTrip.color}
                    onChange={(e) => {
                      setNewTrip({
                        ...newTrip,
                        color: e.target.value
                      });
                    }}
                  >
                    {COLOR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
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
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Trip
          </button>
        </div>
      </div>
    </div>
  );
} 
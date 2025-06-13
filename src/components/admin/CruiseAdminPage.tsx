'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CruiseData } from '@/types/cruise';
import { useApi } from '@/hooks/useApi';
import { API_BASE_URL, API_KEY } from '@/utils/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/ui/Icons';
import { CruiseForm } from '@/components/admin/CruiseForm';
import { BulkImportForm } from '@/components/admin/BulkImportForm';
import { CruiseCard } from '@/components/cruise/CruiseCard';
import { parsePrice, parseDepartureDate } from '@/utils/cruiseUtils';

export const CruiseAdminPage: React.FC = () => {
  const [cruises, setCruises] = useState<CruiseData[]>([]);
  const [isKeyInCache, setIsKeyInCache] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingCruise, setEditingCruise] = useState<CruiseData | null>(null);

  const { apiCall, isLoading, error } = useApi();

  const fetchCruisesFromAPI = useCallback(async () => {
    try {
      const result = await apiCall(API_BASE_URL);
      if (result.status === 404) {
        setCruises([]);
        setIsKeyInCache(false);
      } else if (result.status === 408) {
        // Handle timeout - show empty state but indicate it's a temporary issue
        setCruises([]);
        setIsKeyInCache(true); // Keep true so save operations still work
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

  const handleSaveCruises = useCallback(async (updatedCruises: CruiseData[]) => {
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
          
        } catch (error: any) {
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

  const handleAdd = useCallback(async (newCruise: CruiseData) => {
    const cruiseWithId = { 
      ...newCruise, 
      "Unique Sailing ID": `cruise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
    const updatedCruises = [...cruises, cruiseWithId];
    await handleSaveCruises(updatedCruises);
  }, [cruises, handleSaveCruises]);

  const handleEdit = useCallback(async (updatedCruise: CruiseData) => {
    const updatedCruises = cruises.map(c => 
      c['Unique Sailing ID'] === updatedCruise['Unique Sailing ID'] ? updatedCruise : c
    );
    await handleSaveCruises(updatedCruises);
  }, [cruises, handleSaveCruises]);

  const handleDelete = useCallback((sailingId: string) => {
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

  const handleOpenEditForm = useCallback((cruise: CruiseData) => {
    setEditingCruise(cruise);
    setShowForm(true);
  }, []);

  const handleNotesChange = useCallback(async (sailingId: string, notes: string) => {
    // Update local state immediately
    setCruises(prev => prev.map(cruise => 
      cruise['Unique Sailing ID'] === sailingId 
        ? { ...cruise, 'User Notes': notes }
        : cruise
    ));

    // Save to API
    try {
      const updatedCruises = cruises.map(cruise => 
        cruise['Unique Sailing ID'] === sailingId 
          ? { ...cruise, 'User Notes': notes }
          : cruise
      );
      
      await handleSaveCruises(updatedCruises);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }, [cruises, handleSaveCruises]);

  const processedCruises = cruises.map(cruise => ({
    ...cruise,
    lowestPrice: Math.min(
      parsePrice(cruise['Interior Price']),
      parsePrice(cruise['Ocean View Price']),
      parsePrice(cruise['Standard Balcony'])
    ),
    departureDateObj: parseDepartureDate(cruise['Departure Date'])
  }));

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedCruises.map(cruise => (
            <CruiseCard
              key={cruise['Unique Sailing ID']}
              cruise={cruise}
              onCompareToggle={() => {}} // No comparison in admin
              isComparing={false}
              canAddToComparison={false}
              onEdit={handleOpenEditForm}
              onDelete={handleDelete}
              onNotesChange={handleNotesChange}
              showAdminButtons={true}
            />
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
}; 
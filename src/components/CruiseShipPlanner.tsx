'use client';

import { useState, useEffect } from 'react';

// UI Components
import TabNavigation from './ui/TabNavigation';
import LoadingSpinner from './ui/LoadingSpinner';
import StatusIndicator from './ui/StatusIndicator';

// Cruise Components
import InfoPanel from './cruise/InfoPanel';
import DataTable from './cruise/DataTable';
import DataForm from './cruise/DataForm';
import Visualization from './cruise/Visualization';
import Statistics from './cruise/Statistics';
import Calculator from './cruise/Calculator';

// Admin Components
import AdminPanel from './admin/AdminPanel';
import DataViewer from './admin/DataViewer';

// Custom Hooks
import { useData } from '@/hooks/useData';
import { useCalculations } from '@/hooks/useCalculations';
import { useInteractions } from '@/hooks/useInteractions';
import { useAdminData } from '@/hooks/useAdminData';

export default function CruiseShipPlanner() {
  const [activeTab, setActiveTab] = useState('planner');

  // Data management
  const {
    trips,
    locations,
    loading,
    saveStatus,
    addTrip,
    editTrip,
    deleteTrip,
    resetToDefaultTrips,
    setTrips,
  } = useData();

  // Calculations
  const { schengenStats, cityLimits, ukTaxYearStats } = useCalculations(trips);

  // Timeline interactions
  const {
    draggedTrip,
    timelineRef,
    handleTimelineDragStart,
    handleTimelineDrag,
    handleTimelineDragEnd,
  } = useInteractions(trips, setTrips);

  // Admin data management
  const {
    adminData,
    setAdminData,
    allCacheData,
    loadAllCache,
    saveAdminData,
  } = useAdminData();

  // Load admin data when admin tab is selected
  useEffect(() => {
    if (activeTab === 'admin') {
      loadAllCache();
    }
  }, [activeTab]);

  if (loading) {
    return <LoadingSpinner message="Loading trips from cache..." />;
  }

  return (
    <div className="flex flex-col p-4 max-w-full">
      <h2 className="text-xl font-bold mb-4">Schengen Travel Planner</h2>
      
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Travel Planner Tab */}
      {activeTab === 'planner' && (
        <>
          {/* Status and Reset Button */}
          <StatusIndicator saveStatus={saveStatus} onReset={resetToDefaultTrips} />
          
          {/* Information Panel */}
          <InfoPanel />
          
          {/* Trip Table */}
          <DataTable 
            trips={trips}
            locations={locations}
            onEditTrip={editTrip}
            onDeleteTrip={deleteTrip}
          />
          
          {/* Add Trip Form */}
          <DataForm locations={locations} onAddTrip={addTrip} />
          
          {/* Timeline Visualization */}
          <Visualization
            trips={trips}
            draggedTrip={draggedTrip}
            timelineRef={timelineRef}
            onTimelineDragStart={handleTimelineDragStart}
            onTimelineDrag={handleTimelineDrag}
            onTimelineDragEnd={handleTimelineDragEnd}
          />
          
          {/* Statistics */}
          <Statistics cityLimits={cityLimits} ukTaxYearStats={ukTaxYearStats} />
          
          {/* Schengen Day Calculator */}
          <Calculator trips={trips} schengenStats={schengenStats} />
        </>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <AdminPanel
            adminData={adminData}
            setAdminData={setAdminData}
            onSave={saveAdminData}
            onRefresh={loadAllCache}
            setTrips={setTrips}
          />

          <DataViewer allCacheData={allCacheData} />
        </div>
      )}
    </div>
  );
} 
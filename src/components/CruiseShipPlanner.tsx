'use client';

import React, { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PlusIcon } from '@/components/ui/Icons';
import { CruiseComparisonPage } from '@/components/cruise/CruiseComparisonPage';
import { CruiseForm } from '@/components/admin/CruiseForm';
import { BulkImportForm } from '@/components/admin/BulkImportForm';
import { CruiseData } from '@/types/cruise';

export default function CruiseShipPlanner() {
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingCruise, setEditingCruise] = useState<CruiseData | null>(null);
  const [allNotesOpen, setAllNotesOpen] = useState(true);
  const [bulkSaveCallback, setBulkSaveCallback] = useState<((data: CruiseData[]) => Promise<void>) | null>(null);

  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen font-sans">
        <nav className="bg-white shadow-md sticky top-0 z-40" role="navigation" aria-label="Main navigation">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="text-2xl font-bold text-blue-900">MSC Cruise Manager</div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setAllNotesOpen(!allNotesOpen)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition font-semibold shadow-md text-sm"
                >
                  {allNotesOpen ? 'Close All Notes' : 'Open All Notes'}
                </button>
                <button 
                  onClick={() => setShowBulkImport(true)} 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-semibold shadow-md"
                >
                  Bulk Import
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('This will clear all cached cruise data from Redis. Continue?')) {
                      try {
                        const response = await fetch('https://uno-game-eta.vercel.app/api/redis-cache?key=cruise_data', {
                          method: 'DELETE'
                        });
                        if (response.ok) {
                          alert('Cache cleared successfully!');
                          window.location.reload();
                        } else {
                          alert('Failed to clear cache');
                        }
                      } catch (error) {
                        console.error('Cache clear error:', error);
                        alert('Error clearing cache');
                      }
                    }
                  }} 
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition font-semibold shadow-md"
                >
                  Reset Cache
                </button>
                <button 
                  onClick={() => { setEditingCruise(null); setShowForm(true); }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold shadow-md flex items-center"
                >
                  <PlusIcon /> Add New
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main>
          <CruiseComparisonPage 
            allNotesOpen={allNotesOpen}
            onEditCruise={(cruise) => { setEditingCruise(cruise); setShowForm(true); }}
            onBulkSaveReady={(saveCallback) => setBulkSaveCallback(() => saveCallback)}
          />
        </main>

        {showForm && (
          <CruiseForm 
            cruise={editingCruise} 
            onSave={async (cruise) => {
              // This will be handled by the CruiseComparisonPage
              setShowForm(false);
              setEditingCruise(null);
            }}
            onClose={() => { setShowForm(false); setEditingCruise(null); }}
            isLoading={false}
          />
        )}
        
        {showBulkImport && (
          <BulkImportForm
            onSave={async (cruises) => {
              if (bulkSaveCallback) {
                await bulkSaveCallback(cruises);
              }
              setShowBulkImport(false);
            }}
            onClose={() => setShowBulkImport(false)}
            isLoading={false}
          />
        )}
      </div>
    </ErrorBoundary>
  );
} 
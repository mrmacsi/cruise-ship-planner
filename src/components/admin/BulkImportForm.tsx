'use client';

import React, { useState, useCallback } from 'react';
import { CruiseData } from '@/types/cruise';
import { CloseIcon } from '@/components/ui/Icons';

interface BulkImportFormProps {
  onSave: (data: CruiseData[]) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export const BulkImportForm: React.FC<BulkImportFormProps> = ({ onSave, onClose, isLoading }) => {
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateJson = useCallback((text: string) => {
    if (!text.trim()) {
      return 'Please enter JSON data';
    }

    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        return 'Data must be a JSON array';
      }

      if (data.length === 0) {
        return 'Array cannot be empty';
      }

      // Basic validation for each cruise object
      data.forEach((cruise, index) => {
        if (!cruise || typeof cruise !== 'object') {
          throw new Error(`Item ${index + 1} is not a valid object`);
        }
        
        // Check for required fields with more lenient validation
        const requiredFields = ['Ship Name'];
        const missing = requiredFields.filter(field => !cruise[field] || !cruise[field].toString().trim());
        
        if (missing.length > 0) {
          throw new Error(`Item ${index + 1}: Missing required fields: ${missing.join(', ')}`);
        }
      });

      return null;
    } catch (error: any) {
      return `JSON Error: ${error.message}`;
    }
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonText(value);
    
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  const handleLoadSample = useCallback(() => {
    const sampleData = [
      {
        "Unique Sailing ID": "sample_cruise_1",
        "Ship Name": "MSC Seaview",
        "Duration": "7 Nights",
        "Departure Port": "Genoa (Portofino), Italy",
        "Interior Price": "£ 1,313",
        "Ocean View Price": "£ 1,463",
        "Standard Balcony": "£ 1,563",
        "Suite Options": "Suite: £ 1,993, Yacht Club: £ 3,157",
        "Special Offers": "None",
        "Itinerary Map": "https://placehold.co/600x400/4f46e5/ffffff?text=Sample+Map",
        "Booking Link (Constructed)": "https://www.msccruises.co.uk/booking#cruise/sample",
        "Complete Itinerary": [
          { "day": "1", "date": "Monday, 01 Sep 2025", "port": "Genoa (Portofino), Italy", "arrival": "-", "departure": "18:00" },
          { "day": "2", "date": "Tuesday, 02 Sep 2025", "port": "La Spezia (Cinque Terre), Italy", "arrival": "07:00", "departure": "18:00" },
          { "day": "3", "date": "Wednesday, 03 Sep 2025", "port": "Civitavecchia (Rome), Italy", "arrival": "07:00", "departure": "19:00" }
        ],
        "Departure Date": "01 Sep '25 - 08 Sep '25"
      },
      {
        "Unique Sailing ID": "sample_cruise_2",
        "Ship Name": "MSC Fantasia",
        "Duration": "10 Nights",
        "Departure Port": "Barcelona, Spain",
        "Interior Price": "£ 1,899",
        "Ocean View Price": "£ 2,199",
        "Standard Balcony": "£ 2,599",
        "Suite Options": "Suite: £ 3,299, Yacht Club: £ 4,999",
        "Special Offers": "Early Bird 15% Off",
        "Itinerary Map": "https://placehold.co/600x400/4f46e5/ffffff?text=Sample+Map+2",
        "Booking Link (Constructed)": "https://www.msccruises.co.uk/booking#cruise/sample2",
        "Complete Itinerary": [
          { "day": "1", "date": "Friday, 15 Nov 2025", "port": "Barcelona, Spain", "arrival": "-", "departure": "18:00" },
          { "day": "2", "date": "Saturday, 16 Nov 2025", "port": "Palma, Mallorca", "arrival": "08:00", "departure": "18:00" },
          { "day": "3", "date": "Sunday, 17 Nov 2025", "port": "At Sea", "arrival": "-", "departure": "-" },
          { "day": "4", "date": "Monday, 18 Nov 2025", "port": "Naples, Italy", "arrival": "08:00", "departure": "19:00" }
        ],
        "Departure Date": "15 Nov '25 - 25 Nov '25"
      }
    ];
    
    setJsonText(JSON.stringify(sampleData, null, 2));
    setValidationError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log('Import button clicked, validating JSON...');
    
    const error = validateJson(jsonText);
    if (error) {
      console.log('Validation error:', error);
      setValidationError(error);
      return;
    }

    console.log('JSON validation passed');
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('Parse error:', parseError);
      setValidationError(`Failed to parse JSON: ${parseError.message}`);
      return;
    }

    const confirmMessage = `This will replace all existing cruise data with ${data.length} new entries. Are you sure?`;
    console.log('Showing confirmation dialog...');
    
    if (!window.confirm(confirmMessage)) {
      console.log('User cancelled import');
      return;
    }

    console.log('User confirmed import, starting save...');
    setIsSubmitting(true);
    setValidationError('');
    
    try {
      console.log('Calling onSave with data:', data);
      await onSave(data);
      console.log('Save completed successfully');
    } catch (error: any) {
      console.error('Save error:', error);
      setValidationError(`Import failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [jsonText, validateJson, onSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 id="bulk-import-title" className="text-2xl font-bold text-blue-900">
            Bulk Import from JSON
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close bulk import"
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600">
              Paste a valid JSON array of cruise objects below. This will replace all current data.
            </p>
            <button
              onClick={handleLoadSample}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Load Sample Data
            </button>
          </div>
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Example format</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`[
  {
    "Ship Name": "MSC Seaview",
    "Duration": "7 Nights",
    "Departure Port": "Genoa, Italy",
    "Departure Date": "01 Sep '25 - 08 Sep '25",
    "Interior Price": "£ 1,313",
    "Complete Itinerary": [...]
  }
]`}
            </pre>
          </details>
        </div>

        {validationError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {validationError}
          </div>
        )}

        <div className="flex-grow flex flex-col">
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 mb-2">
            JSON Data
          </label>
          <textarea 
            id="json-input"
            value={jsonText}
            onChange={handleTextChange}
            placeholder='[
  {
    "Ship Name": "Example Ship",
    "Duration": "7 Nights",
    "Departure Port": "Example Port",
    "Departure Date": "01 Jan 25 - 08 Jan 25"
  }
]'
            className="flex-grow min-h-80 p-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 font-semibold transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}; 
import React, { useState, useCallback } from 'react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BulkImportForm = ({ onSave, onClose, isLoading }) => {
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoadSample = useCallback(() => {
    const sampleData = [
      {
        "Unique Sailing ID": "eu20250829bcnbcn",
        "Ship Name": "MSC World Europa",
        "Duration": "7 Nights",
        "Departure Port": "Barcelona, Spain",
        "Interior Price": "£ 1,109 (Best Price)",
        "Ocean View Price": "£ 1,489",
        "Standard Balcony": "£ 1,509",
        "Suite Price": "£ 3,129",
        "Yacht Club Price": "£ 3,539",
        "Special Offers": "None",
        "Itinerary Map": "https://www.msccruises.co.uk/images/msc/iti/itin/UU2N.jpg",
        "Booking Link (Constructed)": "https://www.msccruises.co.uk/booking#cruise/eu20250829bcnbcn",
        "Complete Itinerary": [
          {
            "day": "1",
            "date": "Friday, 29 Aug 2025",
            "port": "Barcelona, Spain",
            "arrival": "-",
            "departure": "18:00"
          },
          {
            "day": "2",
            "date": "Saturday, 30 Aug 2025",
            "port": "Marseille (Provence), France",
            "arrival": "07:00",
            "departure": "18:00"
          },
          {
            "day": "3",
            "date": "Sunday, 31 Aug 2025",
            "port": "Genoa (Portofino), Italy",
            "arrival": "08:00",
            "departure": "16:00"
          },
          {
            "day": "4",
            "date": "Monday, 01 Sep 2025",
            "port": "Naples (Pompeii), Italy",
            "arrival": "13:00",
            "departure": "20:00"
          },
          {
            "day": "5",
            "date": "Tuesday, 02 Sep 2025",
            "port": "Messina (Taormina), Italy",
            "arrival": "09:00",
            "departure": "18:00"
          },
          {
            "day": "6",
            "date": "Wednesday, 03 Sep 2025",
            "port": "Valletta, Malta",
            "arrival": "08:00",
            "departure": "17:00"
          },
          {
            "day": "7",
            "date": "Thursday, 04 Sep 2025",
            "port": "At sea",
            "arrival": "-",
            "departure": "-"
          },
          {
            "day": "8",
            "date": "Friday, 05 Sep 2025",
            "port": "Barcelona, Spain",
            "arrival": "08:00",
            "departure": "-"
          }
        ],
        "Sept 4th Activity": "Port: At sea (Arrival: -, Departure: -)",
        "Departure Date": "29 Aug '25 - 05 Sep '25"
      }
    ];
    
    setJsonText(JSON.stringify(sampleData, null, 2));
    setValidationError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!jsonText.trim()) {
      setValidationError('Please enter JSON data or load a sample.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      
      if (!Array.isArray(parsed)) {
        setValidationError('Data must be an array of cruise objects.');
        return;
      }

      if (parsed.length === 0) {
        setValidationError('Array cannot be empty.');
        return;
      }

      // Validate each cruise object
      for (let i = 0; i < parsed.length; i++) {
        const cruise = parsed[i];
        if (!cruise['Ship Name']) {
          setValidationError(`Cruise ${i + 1}: Ship Name is required.`);
          return;
        }
      }

      setValidationError('');
      setIsSubmitting(true);
      
      try {
        await onSave(parsed);
      } catch (error) {
        setValidationError(error.message);
      } finally {
        setIsSubmitting(false);
      }
      
    } catch (error) {
      setValidationError('Invalid JSON format. Please check your syntax.');
    }
  }, [jsonText, onSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-import-title">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="bulk-import-title" className="text-2xl font-bold text-blue-900">
            Bulk Import Cruises
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

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Import multiple cruises at once by pasting JSON data. Each cruise should have the following structure:
          </p>
          <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            <pre>{`{
  "Unique Sailing ID": "eu20250829bcnbcn",
  "Ship Name": "MSC World Europa",
  "Duration": "7 Nights",
  "Departure Port": "Barcelona, Spain",
  "Interior Price": "£ 1,109 (Best Price)",
  "Ocean View Price": "£ 1,489",
  "Standard Balcony": "£ 1,509",
  "Suite Price": "£ 3,129",
  "Yacht Club Price": "£ 3,539",
  "Special Offers": "None",
  "Itinerary Map": "https://example.com/map.jpg",
  "Booking Link (Constructed)": "https://example.com/booking",
  "Complete Itinerary": [...],
  "Departure Date": "29 Aug '25 - 05 Sep '25"
}`}</pre>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {validationError}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="json-input" className="block text-sm font-medium text-gray-700">
              JSON Data
            </label>
            <button 
              onClick={handleLoadSample}
              className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              disabled={isSubmitting}
            >
              Load Sample Data
            </button>
          </div>
          <textarea 
            id="json-input"
            value={jsonText} 
            onChange={(e) => setJsonText(e.target.value)} 
            placeholder="Paste your JSON data here..."
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            disabled={isSubmitting}
          />
          <p className="text-sm text-gray-500 mt-2">
            Tip: Use Ctrl+A to select all, then paste your data. You can also click "Load Sample Data" to see the expected format.
          </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || isLoading}
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

export default BulkImportForm; 
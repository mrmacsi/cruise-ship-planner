'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CruiseData } from '@/types/cruise';
import { sanitizeInput, validateCruiseData } from '@/utils/cruiseUtils';
import { CloseIcon } from '@/components/ui/Icons';

interface CruiseFormProps {
  cruise: CruiseData | null;
  onSave: (cruise: CruiseData) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export const CruiseForm: React.FC<CruiseFormProps> = ({ cruise, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState<Partial<CruiseData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialData: Partial<CruiseData> = {
      'Ship Name': '',
      'Duration': '7 Nights',
      'Departure Port': '',
      'Departure Date': '',
      'Interior Price': '',
      'Ocean View Price': '',
      'Standard Balcony': '',
      'Suite Options': '',
      'Special Offers': 'None',
      'Itinerary Map': '',
      'Booking Link (Constructed)': '',
      'Complete Itinerary': [],
      ...cruise
    };

    if (Array.isArray(initialData['Complete Itinerary'])) {
      setFormData({
        ...initialData,
        'Complete Itinerary': JSON.stringify(initialData['Complete Itinerary'], null, 2) as any
      });
    } else {
      setFormData({
        ...initialData,
        'Complete Itinerary': '[]' as any
      });
    }

    setValidationErrors({});
  }, [cruise]);

  const validateForm = useCallback((data: Partial<CruiseData>) => {
    const errors: Record<string, string> = {};

    if (!data['Ship Name']?.trim()) {
      errors['Ship Name'] = 'Ship name is required';
    }

    if (!data['Departure Port']?.toString().trim()) {
      errors['Departure Port'] = 'Departure port is required';
    }

    if (!data['Departure Date']?.toString().trim()) {
      errors['Departure Date'] = 'Departure date is required';
    }

    try {
      if (data['Complete Itinerary']) {
        const parsed = JSON.parse(data['Complete Itinerary'] as string);
        if (!Array.isArray(parsed)) {
          errors['Complete Itinerary'] = 'Must be a valid JSON array';
        }
      }
    } catch {
      errors['Complete Itinerary'] = 'Must be valid JSON format';
    }

    // Validate URLs if provided
    const urlFields: (keyof CruiseData)[] = ['Itinerary Map', 'Booking Link (Constructed)'];
    urlFields.forEach(field => {
      const value = data[field]?.toString();
      if (value && value.trim()) {
        try {
          new URL(value);
        } catch {
          errors[field] = 'Must be a valid URL';
        }
      }
    });

    return errors;
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData: CruiseData = { 
        ...formData as CruiseData,
        'Complete Itinerary': JSON.parse((formData['Complete Itinerary'] as string) || '[]')
      };
      await onSave(finalData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setValidationErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave]);

  const inputClasses = useCallback((fieldName: string) => {
    const baseClasses = "p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    const errorClasses = validationErrors[fieldName] ? "border-red-500" : "border-gray-300";
    return `${baseClasses} ${errorClasses}`;
  }, [validationErrors]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 id="form-title" className="text-2xl font-bold text-blue-900">
            {cruise ? 'Edit Cruise' : 'Add New Cruise'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close form"
            disabled={isSubmitting}
          >
            <CloseIcon />
          </button>
        </div>

        {validationErrors.submit && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {validationErrors.submit}
          </div>
        )}

        <div onKeyDown={handleKeyDown} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ship-name" className="block text-sm font-medium text-gray-700 mb-1">
                Ship Name *
              </label>
              <input 
                id="ship-name"
                name="Ship Name" 
                value={(formData['Ship Name'] as string) || ''} 
                onChange={handleChange} 
                placeholder="Enter ship name" 
                className={inputClasses('Ship Name')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Ship Name'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Ship Name']}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input 
                id="duration"
                name="Duration" 
                value={(formData.Duration as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., 7 Nights" 
                className={inputClasses('Duration')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="departure-port" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Port *
              </label>
              <input 
                id="departure-port"
                name="Departure Port" 
                value={(formData['Departure Port'] as string) || ''} 
                onChange={handleChange} 
                placeholder="Enter departure port" 
                className={inputClasses('Departure Port')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Departure Port'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Departure Port']}</p>
              )}
            </div>

            <div>
              <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date *
              </label>
              <input 
                id="departure-date"
                name="Departure Date" 
                value={(formData['Departure Date'] as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., 01 Sep '25 - 08 Sep '25" 
                className={inputClasses('Departure Date')}
                required 
                disabled={isSubmitting}
              />
              {validationErrors['Departure Date'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Departure Date']}</p>
              )}
            </div>

            <div>
              <label htmlFor="interior-price" className="block text-sm font-medium text-gray-700 mb-1">
                Interior Price
              </label>
              <input 
                id="interior-price"
                name="Interior Price" 
                value={(formData['Interior Price'] as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,313" 
                className={inputClasses('Interior Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="ocean-view-price" className="block text-sm font-medium text-gray-700 mb-1">
                Ocean View Price
              </label>
              <input 
                id="ocean-view-price"
                name="Ocean View Price" 
                value={(formData['Ocean View Price'] as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,463" 
                className={inputClasses('Ocean View Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="balcony-price" className="block text-sm font-medium text-gray-700 mb-1">
                Standard Balcony Price
              </label>
              <input 
                id="balcony-price"
                name="Standard Balcony" 
                value={(formData['Standard Balcony'] as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,563" 
                className={inputClasses('Standard Balcony')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="suite-options" className="block text-sm font-medium text-gray-700 mb-1">
                Suite Options
              </label>
              <input 
                id="suite-options"
                name="Suite Options" 
                value={(formData['Suite Options'] as string) || ''} 
                onChange={handleChange} 
                placeholder="e.g., Suite: £ 1,993, Yacht Club: £ 3,157" 
                className={inputClasses('Suite Options')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="itinerary-map" className="block text-sm font-medium text-gray-700 mb-1">
                Itinerary Map URL
              </label>
              <input 
                id="itinerary-map"
                name="Itinerary Map" 
                type="url"
                value={(formData['Itinerary Map'] as string) || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/map.jpg" 
                className={inputClasses('Itinerary Map')}
                disabled={isSubmitting}
              />
              {validationErrors['Itinerary Map'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Itinerary Map']}</p>
              )}
            </div>

            <div>
              <label htmlFor="booking-link" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Link URL
              </label>
              <input 
                id="booking-link"
                name="Booking Link (Constructed)" 
                type="url"
                value={(formData['Booking Link (Constructed)'] as string) || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/booking" 
                className={inputClasses('Booking Link (Constructed)')}
                disabled={isSubmitting}
              />
              {validationErrors['Booking Link (Constructed)'] && (
                <p className="mt-1 text-sm text-red-600">{validationErrors['Booking Link (Constructed)']}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="complete-itinerary" className="block text-sm font-medium text-gray-700 mb-1">
              Complete Itinerary (JSON format)
            </label>
            <textarea 
              id="complete-itinerary"
              name="Complete Itinerary" 
              value={(formData['Complete Itinerary'] as string) || '[]'} 
              onChange={handleChange} 
              rows={8} 
              className={`w-full font-mono text-sm ${inputClasses('Complete Itinerary')}`}
              placeholder='[{"day": "1", "date": "Monday, 01 Sep 2025", "port": "Genoa, Italy", "arrival": "-", "departure": "18:00"}]'
              disabled={isSubmitting}
            />
            {validationErrors['Complete Itinerary'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['Complete Itinerary']}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter itinerary as a JSON array of objects with day, date, port, arrival, and departure fields.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 self-center mr-auto">
              Tip: Press Ctrl+Enter to save quickly
            </p>
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
              {isSubmitting ? 'Saving...' : 'Save Cruise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 
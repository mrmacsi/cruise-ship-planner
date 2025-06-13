import React, { useState, useEffect, useCallback } from 'react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const CruiseForm = ({ cruise, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initialData = {
      'Ship Name': '',
      'Duration': '7 Nights',
      'Departure Port': '',
      'Departure Date': '',
      'Interior Price': '',
      'Ocean View Price': '',
      'Standard Balcony': '',
      'Suite Price': '',
      'Yacht Club Price': '',
      'Special Offers': 'None',
      'Itinerary Map': '',
      'Booking Link (Constructed)': '',
      'Complete Itinerary': '[]',
      ...cruise
    };

    if (Array.isArray(initialData['Complete Itinerary'])) {
      initialData['Complete Itinerary'] = JSON.stringify(initialData['Complete Itinerary'], null, 2);
    }

    setFormData(initialData);
    setValidationErrors({});
  }, [cruise]);

  const validateForm = useCallback((data) => {
    const errors = {};

    if (!data['Ship Name']?.trim()) {
      errors['Ship Name'] = 'Ship name is required';
    }

    if (!data['Departure Port']?.trim()) {
      errors['Departure Port'] = 'Departure port is required';
    }

    if (!data['Departure Date']?.trim()) {
      errors['Departure Date'] = 'Departure date is required';
    }

    try {
      if (data['Complete Itinerary']) {
        const parsed = JSON.parse(data['Complete Itinerary']);
        if (!Array.isArray(parsed)) {
          errors['Complete Itinerary'] = 'Must be a valid JSON array';
        }
      }
    } catch {
      errors['Complete Itinerary'] = 'Must be valid JSON format';
    }

    // Validate URLs if provided
    const urlFields = ['Itinerary Map', 'Booking Link (Constructed)'];
    urlFields.forEach(field => {
      if (data[field] && data[field].trim()) {
        try {
          new URL(data[field]);
        } catch {
          errors[field] = 'Must be a valid URL';
        }
      }
    });

    return errors;
  }, []);

  const handleChange = useCallback((e) => {
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

  const handleKeyDown = useCallback((e) => {
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
      const finalData = { 
        ...formData, 
        'Complete Itinerary': JSON.parse(formData['Complete Itinerary'] || '[]')
      };
      await onSave(finalData);
    } catch (error) {
      console.error('Form submission error:', error);
      setValidationErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave]);

  const inputClasses = useCallback((fieldName) => {
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
                value={formData['Ship Name'] || ''} 
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
                value={formData.Duration || ''} 
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
                value={formData['Departure Port'] || ''} 
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
                value={formData['Departure Date'] || ''} 
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="interior-price" className="block text-sm font-medium text-gray-700 mb-1">
                Interior Price
              </label>
              <input 
                id="interior-price"
                name="Interior Price" 
                value={formData['Interior Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,109 (Best Price)" 
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
                value={formData['Ocean View Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,489" 
                className={inputClasses('Ocean View Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="standard-balcony" className="block text-sm font-medium text-gray-700 mb-1">
                Standard Balcony
              </label>
              <input 
                id="standard-balcony"
                name="Standard Balcony" 
                value={formData['Standard Balcony'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 1,509" 
                className={inputClasses('Standard Balcony')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="suite-price" className="block text-sm font-medium text-gray-700 mb-1">
                Suite Price
              </label>
              <input 
                id="suite-price"
                name="Suite Price" 
                value={formData['Suite Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 3,129" 
                className={inputClasses('Suite Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="yacht-club-price" className="block text-sm font-medium text-gray-700 mb-1">
                Yacht Club Price
              </label>
              <input 
                id="yacht-club-price"
                name="Yacht Club Price" 
                value={formData['Yacht Club Price'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., £ 3,539" 
                className={inputClasses('Yacht Club Price')}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="special-offers" className="block text-sm font-medium text-gray-700 mb-1">
                Special Offers
              </label>
              <input 
                id="special-offers"
                name="Special Offers" 
                value={formData['Special Offers'] || ''} 
                onChange={handleChange} 
                placeholder="e.g., None" 
                className={inputClasses('Special Offers')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="itinerary-map" className="block text-sm font-medium text-gray-700 mb-1">
                Itinerary Map URL
              </label>
              <input 
                id="itinerary-map"
                name="Itinerary Map" 
                value={formData['Itinerary Map'] || ''} 
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
                Booking Link
              </label>
              <input 
                id="booking-link"
                name="Booking Link (Constructed)" 
                value={formData['Booking Link (Constructed)'] || ''} 
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
              Complete Itinerary (JSON)
            </label>
            <textarea 
              id="complete-itinerary"
              name="Complete Itinerary" 
              value={formData['Complete Itinerary'] || ''} 
              onChange={handleChange} 
              placeholder='[{"day": "1", "date": "Friday, 29 Aug 2025", "port": "Barcelona, Spain", "arrival": "-", "departure": "18:00"}]'
              className={`${inputClasses('Complete Itinerary')} h-32`}
              disabled={isSubmitting}
            />
            {validationErrors['Complete Itinerary'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['Complete Itinerary']}</p>
            )}
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
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Saving...' : cruise ? 'Update Cruise' : 'Add Cruise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CruiseForm; 
export const parsePrice = (priceStr: string | undefined | null): number => {
  if (!priceStr || typeof priceStr !== 'string' || priceStr.toLowerCase().includes('n/a')) {
    return Infinity;
  }
  const numericStr = priceStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numericStr);
  return isNaN(parsed) || parsed < 0 ? Infinity : parsed;
};

export const parseDepartureDate = (dateRangeStr: string | undefined | null): Date | null => {
  if (!dateRangeStr || typeof dateRangeStr !== 'string') return null;
  
  try {
    const startDateStr = dateRangeStr.split(' - ')[0];
    if (!startDateStr) return null;
    
    // Handle various date formats
    let parsableDateStr = startDateStr.replace(/'/g, '20');
    const date = new Date(parsableDateStr);
    
    if (isNaN(date.getTime())) {
      // Try alternative parsing
      const parts = startDateStr.split(' ');
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1];
        const year = parts[2].replace(/'/g, '20');
        parsableDateStr = `${day} ${month} ${year}`;
        const altDate = new Date(parsableDateStr);
        return isNaN(altDate.getTime()) ? null : altDate;
      }
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const parseArrivalDate = (dateRangeStr: string | undefined | null): Date | null => {
  if (!dateRangeStr || typeof dateRangeStr !== 'string') return null;
  
  try {
    const dateParts = dateRangeStr.split(' - ');
    if (dateParts.length < 2) return null;
    
    const endDateStr = dateParts[1];
    if (!endDateStr) return null;
    
    // Handle various date formats
    let parsableDateStr = endDateStr.replace(/'/g, '20');
    const date = new Date(parsableDateStr);
    
    if (isNaN(date.getTime())) {
      // Try alternative parsing
      const parts = endDateStr.split(' ');
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1];
        const year = parts[2].replace(/'/g, '20');
        parsableDateStr = `${day} ${month} ${year}`;
        const altDate = new Date(parsableDateStr);
        return isNaN(altDate.getTime()) ? null : altDate;
      }
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn('Arrival date parsing error:', error);
    return null;
  }
};

export const getAvailableDates = (cruises: any[]): Date[] => {
  const dates = new Set<string>();
  
  cruises.forEach(cruise => {
    const departureDate = parseDepartureDate(cruise['Departure Date']);
    const arrivalDate = parseArrivalDate(cruise['Departure Date']);
    
    if (departureDate && arrivalDate) {
      // Add all dates between departure and arrival
      const currentDate = new Date(departureDate);
      while (currentDate <= arrivalDate) {
        dates.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (departureDate) {
      dates.add(departureDate.toISOString().split('T')[0]);
    }
  });
  
  return Array.from(dates)
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());
};

export const getAvailableCities = (cruises: any[]): string[] => {
  const cities = new Set<string>();
  
  cruises.forEach(cruise => {
    // Add departure port
    if (cruise['Departure Port']) {
      const port = cruise['Departure Port'].split(',')[0].trim();
      cities.add(port);
    }
    
    // Add itinerary cities
    if (Array.isArray(cruise['Complete Itinerary'])) {
      cruise['Complete Itinerary'].forEach((stop: any) => {
        if (stop.port) {
          const port = stop.port.split(',')[0].trim();
          cities.add(port);
        }
      });
    }
  });
  
  return Array.from(cities).sort();
};

export const validateCruiseData = (cruise: any) => {
  // More lenient validation - only check for absolute essentials
  if (!cruise || typeof cruise !== 'object') {
    throw new Error('Invalid cruise data - must be an object');
  }
  
  if (!cruise['Ship Name'] || !cruise['Ship Name'].toString().trim()) {
    throw new Error('Ship Name is required');
  }
  
  // Validate itinerary format if provided
  if (cruise['Complete Itinerary'] && typeof cruise['Complete Itinerary'] === 'string') {
    try {
      JSON.parse(cruise['Complete Itinerary']);
    } catch {
      throw new Error('Complete Itinerary must be valid JSON format');
    }
  }
  
  return true;
}; 
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
    const startDateStr = dateRangeStr.split(' - ')[0].trim();
    if (!startDateStr) return null;
    
    // Handle format like "29 Aug '25"
    const parts = startDateStr.split(' ');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1];
      let year = parts[2];
      
      // Convert '25 to 2025
      if (year.startsWith("'")) {
        year = '20' + year.substring(1);
      }
      
      // Create date string in format "DD MMM YYYY"
      const parsableDateStr = `${day} ${month} ${year}`;
      
      const date = new Date(parsableDateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Fallback: try original parsing
    let parsableDateStr = startDateStr.replace(/'/g, '20');
    const date = new Date(parsableDateStr);
    
    if (!isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const parseArrivalDate = (departureDate: string | undefined | null, duration: string | undefined | null): Date | null => {
  if (!departureDate || !duration) return null;
  
  try {
    const depDate = parseDepartureDate(departureDate);
    if (!depDate) return null;
    
    // Extract number of nights from duration string (e.g., "7 Nights" -> 7)
    const nightsMatch = duration.match(/(\d+)/);
    if (!nightsMatch) return null;
    
    const nights = parseInt(nightsMatch[1], 10);
    if (isNaN(nights)) return null;
    
    // Calculate arrival date by adding nights to departure date
    const arrivalDate = new Date(depDate);
    arrivalDate.setDate(arrivalDate.getDate() + nights);
    
    return arrivalDate;
  } catch (error) {
    console.warn('Arrival date parsing error:', error);
    return null;
  }
};

export const getAvailableDates = (cruises: any[]): Date[] => {
  const dates = new Set<string>();
  
  cruises.forEach(cruise => {
    const departureDate = parseDepartureDate(cruise['Departure Date']);
    const arrivalDate = parseArrivalDate(cruise['Departure Date'], cruise['Duration']);
    
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
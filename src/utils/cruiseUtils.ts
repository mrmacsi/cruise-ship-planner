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
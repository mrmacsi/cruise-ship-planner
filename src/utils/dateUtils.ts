import type { Trip } from './constants';

/**
 * Calculate days between two dates (inclusive)
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
};

/**
 * Sort trips by start date
 */
export const sortTrips = (trips: Trip[]): Trip[] => {
  return [...trips].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if two date ranges overlap
 */
export const dateRangesOverlap = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
};

/**
 * Get overlap between two date ranges
 */
export const getDateRangeOverlap = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): { start: string; end: string } | null => {
  if (!dateRangesOverlap(start1, end1, start2, end2)) {
    return null;
  }
  
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  const overlapStart = s1 > s2 ? s1 : s2;
  const overlapEnd = e1 < e2 ? e1 : e2;
  
  return {
    start: formatDateString(overlapStart),
    end: formatDateString(overlapEnd)
  };
}; 
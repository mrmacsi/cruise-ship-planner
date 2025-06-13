export const DEFAULT_TRIPS = [
  { id: 0, location: 'UK', isSchengen: false, startDate: '2025-01-01', endDate: '2025-07-09', color: 'bg-red-500' },
  { id: 1, location: 'Spain', isSchengen: true, startDate: '2025-07-10', endDate: '2025-08-31', color: 'bg-blue-500' },
  { id: 2, location: 'Mediterranean Cruise', isSchengen: true, startDate: '2025-09-01', endDate: '2025-09-07', color: 'bg-teal-500' },
  { id: 3, location: 'Turkey', isSchengen: false, startDate: '2025-09-08', endDate: '2025-09-22', color: 'bg-amber-500' },
  { id: 4, location: 'Spain', isSchengen: true, startDate: '2025-09-23', endDate: '2025-10-03', color: 'bg-blue-500' },
  { id: 5, location: 'UK', isSchengen: false, startDate: '2025-10-04', endDate: '2025-12-14', color: 'bg-red-500' },
  { id: 6, location: 'Spain', isSchengen: true, startDate: '2025-12-15', endDate: '2025-12-25', color: 'bg-blue-500' },
  { id: 7, location: 'US/Singapore', isSchengen: false, startDate: '2025-12-26', endDate: '2026-01-14', color: 'bg-purple-500' },
  { id: 8, location: 'UK', isSchengen: false, startDate: '2026-01-15', endDate: '2026-01-31', color: 'bg-red-500' },
  { id: 9, location: 'Dubai', isSchengen: false, startDate: '2026-02-01', endDate: '2026-04-30', color: 'bg-yellow-500' },
  { id: 10, location: 'Turkey', isSchengen: false, startDate: '2026-05-01', endDate: '2026-07-01', color: 'bg-amber-500' },
  { id: 11, location: 'Spain', isSchengen: true, startDate: '2026-07-02', endDate: '2026-09-19', color: 'bg-blue-500' },
];

export const DEFAULT_LOCATIONS = [
  {name: 'Spain', isSchengen: true, color: 'bg-blue-500'},
  {name: 'UK', isSchengen: false, color: 'bg-red-500'},
  {name: 'Turkey', isSchengen: false, color: 'bg-amber-500'},
  {name: 'Dubai', isSchengen: false, color: 'bg-yellow-500'},
  {name: 'US/Singapore', isSchengen: false, color: 'bg-purple-500'},
  {name: 'Mediterranean Cruise', isSchengen: true, color: 'bg-teal-500'},
  {name: 'Gibraltar', isSchengen: false, color: 'bg-gray-500'}
];

export const COLOR_OPTIONS = [
  { value: 'bg-gray-500', label: 'Gray' },
  { value: 'bg-blue-500', label: 'Blue' },
  { value: 'bg-green-500', label: 'Green' },
  { value: 'bg-red-500', label: 'Red' },
  { value: 'bg-yellow-500', label: 'Yellow' },
  { value: 'bg-purple-500', label: 'Purple' },
  { value: 'bg-pink-500', label: 'Pink' },
  { value: 'bg-indigo-500', label: 'Indigo' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-orange-500', label: 'Orange' },
];

export const TAX_YEARS = [
  { name: '2024-2025', start: '2024-04-06', end: '2025-04-05' },
  { name: '2025-2026', start: '2025-04-06', end: '2026-04-05' },
  { name: '2026-2027', start: '2026-04-06', end: '2027-04-05' },
];

export const SCHENGEN_LIMIT_DAYS = 90;
export const SCHENGEN_WINDOW_DAYS = 180;
export const UK_TAX_RESIDENCY_DAYS = 90;

export const TIMELINE_START = '2025-01-01';
export const TIMELINE_END = '2026-12-31';

export type Trip = {
  id: number;
  location: string;
  isSchengen: boolean;
  startDate: string;
  endDate: string;
  color: string;
};

export type Location = {
  name: string;
  isSchengen: boolean;
  color: string;
};

export type SchengenDay = {
  date: Date;
  daysInWindow: number;
  isOverLimit: boolean;
  location: string;
};

export type CityLimitStats = {
  totalDays: number;
  maxInAnyWindow: number;
  hasOverLimit: boolean;
};

export type UkTaxYearStats = {
  daysInUk: number;
  meetsRequirement: boolean;
  daysNeeded: number;
}; 
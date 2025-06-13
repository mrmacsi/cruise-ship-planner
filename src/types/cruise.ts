export interface ItineraryStop {
  day: string;
  date: string;
  port: string;
  arrival: string;
  departure: string;
}

export interface CruiseData {
  'Unique Sailing ID': string;
  'Ship Name': string;
  'Duration': string;
  'Departure Port': string;
  'Departure Date': string;
  'Interior Price': string;
  'Ocean View Price': string;
  'Standard Balcony': string;
  'Suite Options': string;
  'Special Offers': string;
  'Itinerary Map': string;
  'Booking Link (Constructed)': string;
  'Complete Itinerary': ItineraryStop[];
  'User Notes'?: string;
  lowestPrice?: number;
  departureDateObj?: Date | null;
}

export interface ProcessedCruise extends CruiseData {
  lowestPrice: number;
  departureDateObj: Date | null;
} 
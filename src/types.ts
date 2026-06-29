export interface ApartmentType {
  id: string;
  name: string;
  description: string;
  size: string; // e.g., "120 sq m"
  maxGuests: number;
  pricePerNight: number; // Base price in USD or KES
  image: string;
  gallery: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  highlights: string[];
  bedConfig: string;
  viewType: string;
}

export interface PackageType {
  id: string;
  name: string;
  description: string;
  priceMarkupPercentage: number; // Percentage increase or flat rate per adult
  pricePerPersonPerDay: number; // Added cost in USD per person per day
  highlights: string[];
}

export interface DiningExperience {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  hours: string;
  image: string;
  reservationLinkText: string;
}

export interface FacilityType {
  id: string;
  name: string;
  description: string;
  iconName: string;
  image: string;
  details: string[];
}

export interface BookingInquiry {
  apartmentId: string;
  packageId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  specialRequests: string;
  calculatedCost: {
    nights: number;
    basePrice: number;
    packagePrice: number;
    tax: number;
    total: number;
  };
}

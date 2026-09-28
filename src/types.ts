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
  isActive?: boolean;
}

export interface PackageType {
  id: string;
  name: string;
  description: string;
  priceMarkupPercentage: number; // Percentage increase or flat rate per adult
  pricePerPersonPerDay: number; // Added cost in USD per person per day
  highlights: string[];
  isActive?: boolean;
}

export interface DiningExperience {
  id: string;
  name: string;
  description: string;
  highlights: string[];
  hours: string;
  image: string;
  reservationLinkText: string;
  maxCapacity?: number;
  isActive?: boolean;
}

export interface FacilityType {
  id: string;
  name: string;
  description: string;
  iconName: string;
  image: string;
  details: string[];
  isResidentOnly?: boolean;
  operatingHours?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface ExtraItem {
  id: string;
  category: "transfer" | "charter" | "amenity" | "event";
  name: string;
  description: string;
  priceUsd: number;
  priceKes: number;
  capacity?: number;
  features: string[];
  image: string;
  isActive?: boolean;
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

export type StaffRole = "admin" | "manager" | "reservations" | "reception";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active?: boolean;
  createdAt?: string;
  lastLogin?: string;
  pin?: string; // Optional legacy PIN support
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  inquiryId?: string;
  apartmentId: string;
  apartmentName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  packageId?: string;
  packageName?: string;
  totalAmount: number;
  currency: string;
  paymentStatus: "unpaid" | "deposit_paid" | "paid" | "refunded";
  paymentMethod?: string;
  bookingStatus: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  specialRequests?: string;
  staffNotes?: any[];
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  category: string;
  action: string;
  details: string;
  targetId?: string;
  metadata?: any;
}

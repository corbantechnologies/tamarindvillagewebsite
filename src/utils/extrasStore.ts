export interface TransferVehicle {
  id: string;
  name: string;
  tagline: string;
  maxPassengers: number;
  maxLuggage: number;
  rateUsd: number;
  rateKes: number;
  image: string;
  features: string[];
}

export interface EventPackage {
  id: string;
  title: string;
  tag: string;
  tagIcon: "heart" | "ship" | "briefcase" | "sparkles";
  image: string;
  description: string;
  features: string[];
  capacityText: string;
  cateringText: string;
  extraHighlight: string;
  ctaText: string;
}

export const DEFAULT_TRANSFER_VEHICLES: TransferVehicle[] = [
  {
    id: "executive-saloon",
    name: "Executive Saloon",
    tagline: "Sleek, air-conditioned comfort for solo travelers & couples",
    maxPassengers: 3,
    maxLuggage: 2,
    rateUsd: 25,
    rateKes: 3500,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    features: ["Air-Conditioned", "Chauffeur Meet & Greet", "Complimentary Water", "Free Wi-Fi Onboard"]
  },
  {
    id: "luxury-alphard",
    name: "VIP Alphard / Vellfire",
    tagline: "First-class executive seating with extra legroom & luxury finish",
    maxPassengers: 5,
    maxLuggage: 4,
    rateUsd: 50,
    rateKes: 7000,
    image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80",
    features: ["Reclining VIP Leather Captain Chairs", "Welcome Cold Dawa Drink", "Chauffeur Signage", "Extra Luggage Storage"]
  },
  {
    id: "safari-landcruiser",
    name: "VIP Safari 4x4 Landcruiser",
    tagline: "Rugged elegance with pop-up roof & all-terrain luxury",
    maxPassengers: 6,
    maxLuggage: 5,
    rateUsd: 85,
    rateKes: 11500,
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    features: ["High Clearance 4x4", "Pop-up Roof", "Complimentary Refreshment Cooler", "Chauffeur Guide"]
  },
  {
    id: "group-shuttle",
    name: "Group Minivan / Shuttle",
    tagline: "Spacious passenger van ideal for families & travel groups",
    maxPassengers: 10,
    maxLuggage: 8,
    rateUsd: 65,
    rateKes: 9000,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    features: ["High Capacity", "Dedicated Luggage Trailer Option", "Group Assistance", "Group Refreshment Pack"]
  }
];

export const DEFAULT_EVENT_PACKAGES: EventPackage[] = [
  {
    id: "wedding",
    title: "Cliffside Weddings & Vows",
    tag: "Oceanfront Ceremonies",
    tagIcon: "heart",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    description: "Exchange vows overlooking Tudor Creek on our cliffside garden lawn. Swahili floral decor, sunset cocktail hours on Dawa Terrace, and bespoke banquets.",
    features: [
      "Lawn capacity for up to 200 guests",
      "Plated seafood banquets by Tamarind",
      "Bridal penthouse accommodation suites"
    ],
    capacityText: "Up to 200 Guests",
    cateringText: "Custom Seafood & Swahili Banquet",
    extraHighlight: "Includes Honeymoon Penthouse Upgrade",
    ctaText: "Inquire Wedding Dates"
  },
  {
    id: "dhow-charter",
    title: "Private Tamarind Dhow Cruises",
    tag: "Private Vessel Charter",
    tagIcon: "ship",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898889/v5_albvc2.jpg",
    description: "Charter an authentic Swahili dhow for private sunset cruises, anniversary dinners, or corporate cocktail parties along Tudor Creek with live Taarab or acoustic music.",
    features: [
      "Exclusive charter capacity: 20 to 70 guests",
      "Freshly grilled lobster & seafood on board",
      "Signature Dawa cocktail bar service"
    ],
    capacityText: "20 - 70 Guests",
    cateringText: "Live Dhow Grill & Open Bar",
    extraHighlight: "Live Sunset Acoustic / Taarab Band",
    ctaText: "Inquire Dhow Charter"
  },
  {
    id: "corporate",
    title: "Corporate Retreats & Gala Dinners",
    tag: "Executive Gatherings",
    tagIcon: "briefcase",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    description: "Executive board retreats, team building, and product launches featuring serviced apartment stay packages combined with dining at Tamarind Restaurant.",
    features: [
      "High-speed Wi-Fi & AV meeting setups",
      "Custom conference hall & lawn seating",
      "Group rate on 1, 2 & 3 bedroom apartments"
    ],
    capacityText: "10 - 150 Delegates",
    cateringText: "Full-day Gourmet Delegate Catering",
    extraHighlight: "Complimentary Airport VIP Shuttle",
    ctaText: "Request Corporate Proposal"
  },
  {
    id: "sundowner-soiree",
    title: "Sunset Dawa Terrace Soirées",
    tag: "Bespoke Celebrations",
    tagIcon: "sparkles",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785844619/PXL_20260731_125648811_cnkxww.jpg",
    description: "Exclusive terrace booking for milestone birthdays, anniversaries, or intimate sunset cocktail hours overlooking lit-up Old Town Mombasa across the creek.",
    features: [
      "Private section of Dawa Terrace overlooking bay",
      "Dedicated mixologist & gourmet canapé menu",
      "Custom ambient lighting & DJ / saxophonist"
    ],
    capacityText: "15 - 80 Guests",
    cateringText: "Signature Dawa & Artisanal Tapas",
    extraHighlight: "Private Creekside Terrace View",
    ctaText: "Inquire Sundowner Event"
  }
];

const LOCAL_STORAGE_VEHICLES_KEY = "tamarind_transfer_vehicles_v1";
const LOCAL_STORAGE_EVENTS_KEY = "tamarind_event_packages_v1";

export function loadTransferVehicles(): TransferVehicle[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_VEHICLES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading saved transfer vehicles:", e);
  }
  return DEFAULT_TRANSFER_VEHICLES;
}

export function saveTransferVehicles(vehicles: TransferVehicle[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error("Error saving transfer vehicles:", e);
  }
}

export function loadEventPackages(): EventPackage[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading saved event packages:", e);
  }
  return DEFAULT_EVENT_PACKAGES;
}

export function saveEventPackages(events: EventPackage[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error("Error saving event packages:", e);
  }
}

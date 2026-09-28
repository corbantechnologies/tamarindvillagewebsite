import express, { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

import { getDb, isDbConfigured } from "../db/db.js";
import { 
  apartments as apartmentsTable, 
  diningOptions as diningOptionsTable, 
  pricingRules as pricingRulesTable, 
  inquiries as inquiriesTable, 
  globalSettings as globalSettingsTable 
} from "../db/schema.js";
import { ensureDatabaseSynced } from "../db/migrate.js";

import { handleLogin, handleForgotPassword, handleResetPassword } from "./handlers/auth.js";
import { handleGetStaff, handleCreateStaff, handleUpdateStaff, handleDeleteStaff } from "./handlers/staff.js";
import { handleGetBookings, handleCreateBooking, handleUpdateBooking, handleDeleteBooking } from "./handlers/bookings.js";
import { handleGetPackages, handleCreatePackage, handleUpdatePackage, handleDeletePackage } from "./handlers/packages.js";
import { handleGetExtras, handleCreateExtra, handleUpdateExtra, handleDeleteExtra } from "./handlers/extras.js";
import { handleGetFacilities, handleCreateFacility, handleUpdateFacility, handleDeleteFacility } from "./handlers/facilities.js";
import { handleGetAuditLogs, handleCreateAuditLog } from "./handlers/audit-logs.js";

dotenv.config({ path: fs.existsSync(".env.local") ? ".env.local" : ".env" });

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

const DEFAULT_PRICING = {
  markupMultiplier: 1.0,
  taxRate: 8,
  seasonalFactor: "regular"
};

const DEFAULT_APARTMENTS = [
  {
    id: "1-bedroom",
    name: "Luxury 1-Bedroom Apartment",
    description: "Perfect for couples, executive business travelers, or solo adventurers looking for a serene coastal getaway. This spacious suite features an air-conditioned master bedroom with a handcrafted Swahili four-poster canopy bed, a deluxe en-suite bathroom, and an expansive living area.",
    size: "95 m²",
    maxGuests: 2,
    pricePerNight: 160,
    image: "https://media.tamarind.co.ke/tvl-website-assets/r12.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/r13.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r12.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r14.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Fully equipped granite-top kitchen",
      "Private sea-facing veranda",
      "Flat-screen TV with DSTV channels",
      "Electronic room safe",
      "Daily housekeeping & turndown",
      "Premium bath amenities & robes",
      "Coffee & tea making facilities"
    ],
    bedrooms: 1,
    bathrooms: 1,
    highlights: [
      "Handcrafted Swahili woodwork and arabesque detailing",
      "Sweeping views of Tudor Creek and Mombasa harbor",
      "Private veranda ideal for breakfast and evening sunsets",
      "Fully self-catering capable with modern premium appliances"
    ],
    bedConfig: "1 King-sized Swahili Canopy Bed",
    viewType: "Direct Tudor Creek & Sea View"
  },
  {
    id: "2-bedroom",
    name: "2-Bedroom Apartment",
    description: "Ideal for families or friends traveling together, this exceptionally spacious residence seamlessly combines Swahili elegance with modern comfort. It features two fully air-conditioned bedrooms, a magnificent living room, a dining area, and an extra-large private balcony.",
    size: "145 m²",
    maxGuests: 4,
    pricePerNight: 240,
    image: "https://media.tamarind.co.ke/tvl-website-assets/r22.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/r22.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r24.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r26.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Individual climate control in both bedrooms",
      "Full modern kitchen with laundry facilities",
      "Double-width oceanfront veranda",
      "Multiple flat-screen TVs with premium DSTV",
      "Personal safety deposit box",
      "Daily housekeeping & room service",
      "Separate living and dining areas",
      "Luxury cotton bathrobes & slippers"
    ],
    bedrooms: 2,
    bathrooms: 2,
    highlights: [
      "Perfect for families; child-friendly, secure layout",
      "Direct views overlooking the sparkling resort pools and the creek",
      "Gourmet kitchen complete with full-sized refrigerator, oven, and washer",
      "Master en-suite bathroom with custom glass shower and Swahili vanity"
    ],
    bedConfig: "1 King Bed & 2 Twin Beds (can be merged)",
    viewType: "Resort Pool & Harbor View"
  },
  {
    id: "3-bedroom",
    name: "3-Bedroom Apartment",
    description: "The ultimate expression of coastal luxury. This palatial apartment boasts double-height vaulted ceilings, three gorgeous bedrooms, multiple sun-drenched private balconies, and an elite dining lounge. Rich mahogany spiral stairs, deep Swahili timber detailing, and grand direct-ocean verandas create an air of absolute exclusivity and luxury.",
    size: "220 m²",
    maxGuests: 6,
    pricePerNight: 350,
    image: "https://media.tamarind.co.ke/tvl-website-assets/r36.jpg",
    gallery: [
      "https://media.tamarind.co.ke/tvl-website-assets/r36.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r32.jpg",
      "https://media.tamarind.co.ke/tvl-website-assets/r35.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Full house air-conditioning with individual zones",
      "Ultra-modern kitchen with premium culinary wear",
      "Rooftop sun terrace & private dining area",
      "Smart TVs with premium DSTV & streaming capabilities",
      "In-suite laundry (washing machine & dryer)",
      "Dedicated concierge service",
      "Luxury bathtubs & rainfall showers",
      "Dedicated chauffeur & concierge assistance"
    ],
    bedrooms: 3,
    bathrooms: 3.5,
    highlights: [
      "Spectacular 270-degree panoramic views of Mombasa Old Town and Tudor Creek",
      "Bespoke multilevel architecture featuring rich mahogany spiral stairs",
      "Exclusive private rooftop terrace with loungers and outdoor dining table",
      "Dedicated chef available upon request for private dining events"
    ],
    bedConfig: "2 King Beds & 2 Twin Beds",
    viewType: "360° Creek, Ocean & Old Town Panoramic View"
  }
];

const DEFAULT_DINING = [
  {
    id: "tamarind-restaurant",
    name: "Tamarind Mombasa Restaurant",
    description: "Widely acclaimed as the finest seafood restaurant in East Africa. Built in elegant Moorish style overlooking the picturesque Tudor Creek, the restaurant features high-arched windows, high ceilings, and a massive copper-domed bar. We serve fresh, marine catches brought in daily by local fishermen, prepared with traditional Swahili seasonings and classic French culinary mastery.",
    highlights: [
      "Famous Jumbo Seafood Platter (lobster, crab, prawns, oysters, and local fish)",
      "Traditional Swahili Fish in rich coconut sauce (Samaki wa Kupaka)",
      "Live piano accompaniment and ambient coastal acoustics",
      "Premium selection of international wines curated by our resident sommelier"
    ],
    hours: "12:00 PM – 11:00 PM Daily",
    image: "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
    reservationLinkText: "Inquire for Restaurant Table"
  },
  {
    id: "dawa-terrace",
    name: "The Dawa Terrace",
    description: "Named after Kenya's legendary 'Dawa' (meaning 'medicine') cocktail muddled with fresh lime and honey. This stylish open-air terrace bar extends right over the gentle waters of the creek. It features plush comfortable seating, soft ambient lighting, and is the premier sunset cocktail lounge on Mombasa's coast.",
    highlights: [
      "The Original 'Dawa' cocktail made with local vodka, fresh lime, and organic honey",
      "Delicious tapas, coastal snacks, and wood-fired flatbreads",
      "Laid-back deep house and coastal chill music played by live DJs on weekends",
      "Breathtaking night views of the lit-up old town of Mombasa across the bay"
    ],
    hours: "4:00 PM – Midnight Daily",
    image: "https://media.tamarind.co.ke/tvl-website-assets/t1.jpg",
    reservationLinkText: "Inquire for Dawa Terrace Table"
  },
  {
    id: "tamarind-dhow",
    name: "The Tamarind Dhow Cruise",
    description: "An unforgettable, magical dining voyage. Climb aboard the 'Nawalikoni' or 'Babulkher'—two majestic, traditionally hand-crafted wooden Swahili sailing dhows, beautifully converted into luxurious floating restaurants. Under the sails, you will cruise past Mombasa's historical Fort Jesus and Mombasa Old Harbor while enjoying a freshly grilled multi-course seafood meal prepared on traditional charcoal grills.",
    highlights: [
      "4-Course candlelit seafood feast cooked fresh on board over charcoal braziers",
      "Romantic cruise on Tudor Creek, Mombasa Harbor, and around Fort Jesus",
      "Live Swahili, Afro-fusion, and jazz band playing dance-worthy tunes on board",
      "The perfect setting for anniversaries, proposals, or unforgettable group celebrations"
    ],
    hours: "Lunch Cruise: 1:00 PM – 3:00 PM | Dinner Cruise: 6:30 PM – 10:30 PM",
    image: "https://media.tamarind.co.ke/tvl-website-assets/d2.jpg",
    reservationLinkText: "Inquire for Dhow Charter & Cruise"
  }
];

const FALLBACK_TRANSFERS = [
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

const FALLBACK_EVENTS = [
  {
    id: "wedding",
    title: "Cliffside Weddings & Vows",
    tag: "Oceanfront Ceremonies",
    tagIcon: "heart",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    description: "Exchange vows overlooking Tudor Creek on our cliffside garden lawn. Swahili floral decor, sunset cocktail hours on Dawa Terrace, and bespoke banquets.",
    features: ["Lawn capacity for up to 200 guests", "Plated seafood banquets by Tamarind", "Bridal penthouse accommodation suites"],
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
    image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
    description: "Charter an authentic Swahili dhow for private sunset cruises, anniversary dinners, or corporate cocktail parties along Tudor Creek with live Taarab or acoustic music.",
    features: ["Exclusive charter capacity: 20 to 70 guests", "Freshly grilled lobster & seafood on board", "Signature Dawa cocktail bar service"],
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
    features: ["High-speed Wi-Fi & AV meeting setups", "Custom conference hall & lawn seating", "Group rate on 1, 2 & 3 bedroom apartments"],
    capacityText: "10 - 150 Delegates",
    cateringText: "Full-day Gourmet Delegate Catering",
    extraHighlight: "Executive Airport & SGR Shuttle Coordination",
    ctaText: "Request Corporate Proposal"
  },
  {
    id: "sundowner-soiree",
    title: "Sunset Dawa Terrace Soirées",
    tag: "Bespoke Celebrations",
    tagIcon: "sparkles",
    image: "https://media.tamarind.co.ke/tvl-website-assets/t1.jpg",
    description: "Exclusive terrace booking for milestone birthdays, anniversaries, or intimate sunset cocktail hours overlooking lit-up Old Town Mombasa across the creek.",
    features: ["Private section of Dawa Terrace overlooking bay", "Dedicated mixologist & gourmet canapé menu", "Custom ambient lighting & DJ / saxophonist"],
    capacityText: "15 - 80 Guests",
    cateringText: "Signature Dawa & Artisanal Tapas",
    extraHighlight: "Private Creekside Terrace View",
    ctaText: "Inquire Sundowner Event"
  }
];

const FALLBACK_BOARDING = [
  {
    id: "self_catering",
    name: "Self Catering",
    slogan: "Prepare your own Swahili feasts using local Mombasa ingredients",
    rateUsd: 0,
    features: ["Fully Equipped Modern Kitchen", "Pre-stocked Pantry Option", "Grocery Delivery Available"]
  },
  {
    id: "bed_breakfast",
    name: "Bed & Breakfast",
    slogan: "Start each coastal morning with a delicious gourmet breakfast at the restaurant",
    rateUsd: 15,
    features: ["Full Tamarind Breakfast", "Fresh Kenyan Coffee & Juices", "Oceanfront Seating Included"]
  },
  {
    id: "half_board",
    name: "Half Board",
    slogan: "Indulge in both premium breakfast and your choice of lunch or sunset dinner daily",
    rateUsd: 45,
    features: ["Full Breakfast Included", "Multi-Course Seafood Dinner / Lunch", "Non-Alcoholic Dawa Cocktail"]
  },
  {
    id: "full_board",
    name: "Full Board (VVIP Culinary)",
    slogan: "Ultimate luxury dining package featuring breakfast, lunch, and spectacular seafood dinner daily",
    rateUsd: 75,
    features: ["All Daily Meals", "A La Carte Dining at Tamarind Restaurant", "Signature Tamarind Dhow Seafood Platter", "Priority Seating & Butler Assistance"]
  }
];

const FALLBACK_STAFF_USERS = [
  {
    id: "user_admin",
    name: "Master Administrator",
    pin: "1977",
    role: "admin",
    email: "admin@tamarind.co.ke",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

function initLocalStore() {
  if (!fs.existsSync(DATA_STORE_PATH)) {
    const initialData = {
      apartments: DEFAULT_APARTMENTS,
      dining: DEFAULT_DINING,
      pricing: DEFAULT_PRICING,
      inquiries: [],
      settings: {
        transfer_vehicles: FALLBACK_TRANSFERS,
        event_packages: FALLBACK_EVENTS,
        boarding_packages: FALLBACK_BOARDING,
        staff_users: FALLBACK_STAFF_USERS
      }
    };
    try {
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    } catch (e) {
      // read-only environments (e.g. Vercel tmp)
    }
  }
}

function readLocalStore() {
  initLocalStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
  } catch (err) {
    return {
      apartments: DEFAULT_APARTMENTS,
      dining: DEFAULT_DINING,
      pricing: DEFAULT_PRICING,
      inquiries: [],
      settings: {
        transfer_vehicles: FALLBACK_TRANSFERS,
        event_packages: FALLBACK_EVENTS,
        boarding_packages: FALLBACK_BOARDING,
        staff_users: FALLBACK_STAFF_USERS
      }
    };
  }
}

function writeLocalStore(data: any) {
  try {
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal if read-only filesystem
  }
}

function ensureInquiryAuditTrail(inq: any): any {
  if (!inq) return inq;
  const payload = inq.payload || {};
  let auditTrail: any[] = Array.isArray(payload.auditTrail) ? [...payload.auditTrail] : [];

  if (auditTrail.length === 0) {
    auditTrail.push({
      id: "audit_init_" + inq.id,
      timestamp: inq.createdAt || new Date().toISOString(),
      actor: "guest",
      actorName: payload.name || "Online Guest",
      action: `Inquiry submitted for ${payload.apartmentName || inq.type || "Apartment Suite"}${payload.checkIn ? ` (${payload.checkIn} to ${payload.checkOut})` : ""}`,
      type: "inquiry_created"
    });
    payload.auditTrail = auditTrail;
    inq.payload = payload;
  }
  return inq;
}

// Build Router
const router = Router();

// ==========================================
// AUTHENTICATION & PASSWORD RESET ROUTES
// ==========================================
router.post("/auth/login", handleLogin);
router.post("/auth/forgot-password", handleForgotPassword);
router.post("/auth/reset-password", handleResetPassword);

// ==========================================
// STAFF USER MANAGEMENT ROUTES
// ==========================================
router.get("/staff", handleGetStaff);
router.post("/staff", handleCreateStaff);
router.put("/staff/:id", handleUpdateStaff);
router.delete("/staff/:id", handleDeleteStaff);

// ==========================================
// BOOKINGS & IN-HOUSE GUESTS ROUTES
// ==========================================
router.get("/bookings", handleGetBookings);
router.post("/bookings", handleCreateBooking);
router.put("/bookings/:id", handleUpdateBooking);
router.delete("/bookings/:id", handleDeleteBooking);

// ==========================================
// BOARDING PACKAGES ROUTES
// ==========================================
router.get("/packages", handleGetPackages);
router.post("/packages", handleCreatePackage);
router.put("/packages/:id", handleUpdatePackage);
router.delete("/packages/:id", handleDeletePackage);

// ==========================================
// EXTRAS (FLEET TRANSFERS & CHARTERS) ROUTES
// ==========================================
router.get("/extras", handleGetExtras);
router.post("/extras", handleCreateExtra);
router.put("/extras/:id", handleUpdateExtra);
router.delete("/extras/:id", handleDeleteExtra);

// ==========================================
// RESORT FACILITIES & CONFERENCES ROUTES
// ==========================================
router.get("/facilities", handleGetFacilities);
router.post("/facilities", handleCreateFacility);
router.put("/facilities/:id", handleUpdateFacility);
router.delete("/facilities/:id", handleDeleteFacility);

// ==========================================
// SYSTEM AUDIT & ACTIVITY LOGS ROUTES
// ==========================================
router.get("/audit-logs", handleGetAuditLogs);
router.post("/audit-logs", handleCreateAuditLog);

// ==========================================
// PROFITROOM PROXY ROUTES (LIVE XML)
// ==========================================
const handleProfitroomRooms = async (req: Request, res: Response) => {
  try {
    const response = await fetch("https://wis.upperbooking.com/tamarindvillage/Rooms.xml?locale=en");
    if (!response.ok) throw new Error(`Upperbooking status ${response.status}`);
    const text = await response.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).send(text);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch Profitroom rooms" });
  }
};

const handleProfitroomOffers = async (req: Request, res: Response) => {
  try {
    const response = await fetch("https://wis.upperbooking.com/tamarindvillage/Offers.xml?locale=en");
    if (!response.ok) throw new Error(`Upperbooking status ${response.status}`);
    const text = await response.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).send(text);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch Profitroom offers" });
  }
};

router.get("/rooms", handleProfitroomRooms);
router.get("/offers", handleProfitroomOffers);
router.get("/profitroom/rooms", handleProfitroomRooms);
router.get("/profitroom/offers", handleProfitroomOffers);
router.get("/profitroom", (req: Request, res: Response) => {
  const type = req.query.type || (req.url.includes("offers") ? "offers" : "rooms");
  if (type === "offers") return handleProfitroomOffers(req, res);
  return handleProfitroomRooms(req, res);
});

// ==========================================
// INQUIRIES MANAGEMENT
// ==========================================
router.get("/inquiries", async (req: Request, res: Response) => {
  try {
    if (!isDbConfigured()) {
      const store = readLocalStore();
      const raw = store.inquiries || [];
      const inquiries = raw.map((i: any) => ensureInquiryAuditTrail(i));
      const sorted = [...inquiries].sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ success: true, inquiries: sorted });
    }
    const db = getDb();
    const data = await db.select().from(inquiriesTable);
    const inquiries = data.map((i: any) => ensureInquiryAuditTrail(i));
    const sorted = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json({ success: true, inquiries: sorted });
  } catch (err: any) {
    console.error("Failed to fetch inquiries:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/inquiries/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, payload, staffNote, actorName } = req.body;
    if (!status && !payload && !staffNote) {
      return res.status(400).json({ error: "Status, payload, or staffNote is required." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      const inquiries = store.inquiries || [];
      const inq = inquiries.find((i: any) => i.id === id);
      if (!inq) {
        return res.status(404).json({ error: "Inquiry not found." });
      }
      inq.payload = inq.payload || {};
      inq.payload.auditTrail = inq.payload.auditTrail || [];

      if (status && status !== inq.status) {
        inq.payload.auditTrail.push({
          id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          timestamp: new Date().toISOString(),
          actor: "staff",
          actorName: actorName || staffNote?.author || "Tamarind Reservations",
          action: `Status changed from "${inq.status}" to "${status}"`,
          type: "status_change"
        });
        inq.status = status;
      }

      if (payload) {
        inq.payload = { ...inq.payload, ...payload };
      }

      if (staffNote) {
        inq.payload.staffNotes = inq.payload.staffNotes || [];
        inq.payload.staffNotes.push({
          id: "note_" + Date.now(),
          author: staffNote.author || actorName || "Tamarind Reservations",
          text: staffNote.text,
          createdAt: new Date().toISOString()
        });
      }
      if (!inq.payload.guestToken) {
        inq.payload.guestToken = "tv_guest_" + Math.random().toString(36).slice(2, 11);
      }
      writeLocalStore(store);
      return res.json({ success: true, inquiry: inq });
    }

    const db = getDb();
    const existing = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    const current = existing[0];
    const updatedFields: any = {};
    if (status) updatedFields.status = status;

    const mergedPayload = { ...((current.payload as any) || {}) };
    mergedPayload.auditTrail = mergedPayload.auditTrail || [];

    if (status && status !== current.status) {
      mergedPayload.auditTrail.push({
        id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        timestamp: new Date().toISOString(),
        actor: "staff",
        actorName: actorName || staffNote?.author || "Tamarind Reservations",
        action: `Status changed from "${current.status}" to "${status}"`,
        type: "status_change"
      });
    }

    if (payload) {
      Object.assign(mergedPayload, payload);
    }

    if (staffNote) {
      mergedPayload.staffNotes = mergedPayload.staffNotes || [];
      mergedPayload.staffNotes.push({
        id: "note_" + Date.now(),
        author: staffNote.author || actorName || "Tamarind Reservations",
        text: staffNote.text,
        createdAt: new Date().toISOString()
      });
    }

    if (!mergedPayload.guestToken) {
      mergedPayload.guestToken = "tv_guest_" + Math.random().toString(36).slice(2, 11);
    }
    updatedFields.payload = mergedPayload;

    const updated = await db
      .update(inquiriesTable)
      .set(updatedFields)
      .where(eq(inquiriesTable.id, id))
      .returning();

    return res.json({ success: true, inquiry: updated[0] });
  } catch (err: any) {
    console.error("Failed to update inquiry status:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/inquiries/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.inquiries = (store.inquiries || []).filter((i: any) => i.id !== id);
      writeLocalStore(store);
      return res.json({ success: true });
    }
    const db = getDb();
    await db.delete(inquiriesTable).where(eq(inquiriesTable.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete inquiry:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GUEST SELF-SERVICE TRACKING ENDPOINTS
// ==========================================
router.get("/track", async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string || "").trim();
    if (!token) {
      return res.status(400).json({ error: "Booking reference or guest token is required." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      const inquiries = store.inquiries || [];
      const inq = inquiries.find((i: any) => i.id === token || i.payload?.guestToken === token);
      if (!inq) {
        return res.status(404).json({ error: "Reservation or inquiry not found." });
      }
      return res.json({ success: true, inquiry: inq });
    }

    const db = getDb();
    const allInquiries = await db.select().from(inquiriesTable);
    const inq = allInquiries.find((i: any) => i.id === token || (i.payload as any)?.guestToken === token);

    if (!inq) {
      return res.status(404).json({ error: "Reservation or inquiry not found." });
    }

    return res.json({ success: true, inquiry: inq });
  } catch (err: any) {
    console.error("Failed to track reservation:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/track", async (req: Request, res: Response) => {
  try {
    const { token, action, changeData, payment } = req.body || {};
    if (!token || !action) {
      return res.status(400).json({ error: "Token and action are required." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      const inquiries = store.inquiries || [];
      const inq = inquiries.find((i: any) => i.id === token || i.payload?.guestToken === token);
      if (!inq) {
        return res.status(404).json({ error: "Reservation not found." });
      }

      inq.payload = inq.payload || {};
      inq.payload.staffNotes = inq.payload.staffNotes || [];
      inq.payload.auditTrail = inq.payload.auditTrail || [];

      if (action === "request_change" && changeData) {
        inq.payload.changeRequests = inq.payload.changeRequests || [];
        inq.payload.changeRequests.push(changeData);
        inq.status = "Reviewed";
      } else if (action === "record_payment" && payment) {
        inq.payload.paymentStatus = "deposit_paid";
        inq.payload.paymentDetails = payment;
      } else if (action === "accept_quote") {
        inq.payload.quoteAccepted = true;
        inq.payload.quoteAcceptedAt = new Date().toISOString();
      }

      writeLocalStore(store);
      return res.json({ success: true, inquiry: inq });
    }

    const db = getDb();
    const allInquiries = await db.select().from(inquiriesTable);
    const inq = allInquiries.find((i: any) => i.id === token || (i.payload as any)?.guestToken === token);

    if (!inq) {
      return res.status(404).json({ error: "Reservation not found." });
    }

    const mergedPayload = { ...((inq.payload as any) || {}) };
    mergedPayload.staffNotes = mergedPayload.staffNotes || [];
    mergedPayload.auditTrail = mergedPayload.auditTrail || [];
    let newStatus = inq.status;

    if (action === "request_change" && changeData) {
      mergedPayload.changeRequests = mergedPayload.changeRequests || [];
      mergedPayload.changeRequests.push(changeData);
      newStatus = "Reviewed";
    } else if (action === "record_payment" && payment) {
      mergedPayload.paymentStatus = "deposit_paid";
      mergedPayload.paymentDetails = payment;
    } else if (action === "accept_quote") {
      mergedPayload.quoteAccepted = true;
      mergedPayload.quoteAcceptedAt = new Date().toISOString();
    }

    const updated = await db
      .update(inquiriesTable)
      .set({ payload: mergedPayload, status: newStatus })
      .where(eq(inquiriesTable.id, inq.id))
      .returning();

    return res.json({ success: true, inquiry: updated[0] });
  } catch (err: any) {
    console.error("Failed to process guest action:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// APARTMENTS & SUITES
// ==========================================
router.get("/apartments", async (req: Request, res: Response) => {
  try {
    if (!isDbConfigured()) {
      const store = readLocalStore();
      const list = store.apartments && store.apartments.length > 0 ? store.apartments : DEFAULT_APARTMENTS;
      return res.json({ success: true, apartments: list });
    }
    const db = getDb();
    const data = await db.select().from(apartmentsTable);
    if (data && data.length > 0) {
      return res.json({ success: true, apartments: data });
    }
    return res.json({ success: true, apartments: DEFAULT_APARTMENTS });
  } catch (err: any) {
    console.error("Failed to fetch apartments, using fallback:", err);
    return res.status(200).json({ 
      success: true, 
      apartments: DEFAULT_APARTMENTS, 
      database_error: err.message 
    });
  }
});

router.post("/apartments", async (req: Request, res: Response) => {
  try {
    const { apartments: aptsBody } = req.body;
    if (!Array.isArray(aptsBody)) {
      return res.status(400).json({ error: "Apartments must be an array." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.apartments = aptsBody;
      writeLocalStore(store);
      return res.json({ success: true, apartments: store.apartments });
    }

    const db = getDb();
    for (const apt of aptsBody) {
      await db.insert(apartmentsTable).values({
        id: apt.id,
        name: apt.name || "Unnamed Suite",
        description: apt.description || "",
        size: apt.size || "85 m²",
        maxGuests: Number(apt.maxGuests) || 2,
        pricePerNight: Number(apt.pricePerNight) || 100,
        image: apt.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        gallery: apt.gallery || [],
        amenities: apt.amenities || [],
        bedrooms: Number(apt.bedrooms) || 1,
        bathrooms: Number(apt.bathrooms) || 1.0,
        highlights: apt.highlights || [],
        bedConfig: apt.bedConfig || "",
        viewType: apt.viewType || "",
      }).onConflictDoUpdate({
        target: apartmentsTable.id,
        set: {
          name: apt.name || "Unnamed Suite",
          description: apt.description || "",
          size: apt.size || "85 m²",
          maxGuests: Number(apt.maxGuests) || 2,
          pricePerNight: Number(apt.pricePerNight) || 100,
          image: apt.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
          gallery: apt.gallery || [],
          amenities: apt.amenities || [],
          bedrooms: Number(apt.bedrooms) || 1,
          bathrooms: Number(apt.bathrooms) || 1.0,
          highlights: apt.highlights || [],
          bedConfig: apt.bedConfig || "",
          viewType: apt.viewType || "",
        }
      });
    }
    const data = await db.select().from(apartmentsTable);
    return res.json({ success: true, apartments: data });
  } catch (err: any) {
    console.error("Failed to update apartments:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/apartments/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.apartments = (store.apartments || []).filter((a: any) => a.id !== id);
      writeLocalStore(store);
      return res.json({ success: true });
    }
    const db = getDb();
    await db.delete(apartmentsTable).where(eq(apartmentsTable.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete apartment:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DINING EXPERIENCES
// ==========================================
router.get("/dining", async (req: Request, res: Response) => {
  try {
    if (!isDbConfigured()) {
      const store = readLocalStore();
      const list = store.dining && store.dining.length > 0 ? store.dining : DEFAULT_DINING;
      return res.json({ success: true, dining: list });
    }
    const db = getDb();
    const data = await db.select().from(diningOptionsTable);
    if (data && data.length > 0) {
      return res.json({ success: true, dining: data });
    }
    return res.json({ success: true, dining: DEFAULT_DINING });
  } catch (err: any) {
    console.error("Failed to fetch dining experiences, using fallback:", err);
    return res.status(200).json({ 
      success: true, 
      dining: DEFAULT_DINING, 
      database_error: err.message 
    });
  }
});

router.post("/dining", async (req: Request, res: Response) => {
  try {
    const { dining: diningBody } = req.body;
    if (!Array.isArray(diningBody)) {
      return res.status(400).json({ error: "Dining experiences must be an array." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.dining = diningBody;
      writeLocalStore(store);
      return res.json({ success: true, dining: store.dining });
    }

    const db = getDb();
    for (const dine of diningBody) {
      await db.insert(diningOptionsTable).values({
        id: dine.id,
        name: dine.name || "Unnamed Venue",
        description: dine.description || "",
        highlights: dine.highlights || [],
        hours: dine.hours || "Open Daily",
        image: dine.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        reservationLinkText: dine.reservationLinkText || "Inquire Table",
      }).onConflictDoUpdate({
        target: diningOptionsTable.id,
        set: {
          name: dine.name || "Unnamed Venue",
          description: dine.description || "",
          highlights: dine.highlights || [],
          hours: dine.hours || "Open Daily",
          image: dine.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
          reservationLinkText: dine.reservationLinkText || "Inquire Table",
        }
      });
    }
    const data = await db.select().from(diningOptionsTable);
    return res.json({ success: true, dining: data });
  } catch (err: any) {
    console.error("Failed to update dining experiences:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/dining/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.dining = (store.dining || []).filter((d: any) => d.id !== id);
      writeLocalStore(store);
      return res.json({ success: true });
    }
    const db = getDb();
    await db.delete(diningOptionsTable).where(eq(diningOptionsTable.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete dining experience:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PRICING RULES
// ==========================================
router.get("/pricing", async (req: Request, res: Response) => {
  try {
    if (!isDbConfigured()) {
      const store = readLocalStore();
      return res.json({ success: true, pricing: store.pricing || DEFAULT_PRICING });
    }
    const db = getDb();
    const data = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.id, "default"));
    const pricing = data[0] || DEFAULT_PRICING;
    return res.json({ success: true, pricing });
  } catch (err: any) {
    console.error("Failed to fetch pricing rules:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/pricing", async (req: Request, res: Response) => {
  try {
    const { pricing: pricingBody } = req.body;
    if (!pricingBody) {
      return res.status(400).json({ error: "Pricing rules object required." });
    }

    if (!isDbConfigured()) {
      const store = readLocalStore();
      store.pricing = {
        markupMultiplier: pricingBody.markupMultiplier ?? 1.0,
        taxRate: pricingBody.taxRate ?? 8,
        seasonalFactor: pricingBody.seasonalFactor ?? "regular",
      };
      writeLocalStore(store);
      return res.json({ success: true, pricing: store.pricing });
    }

    const db = getDb();
    await db.insert(pricingRulesTable).values({
      id: "default",
      markupMultiplier: pricingBody.markupMultiplier ?? 1.0,
      taxRate: pricingBody.taxRate ?? 8,
      seasonalFactor: pricingBody.seasonalFactor ?? "regular",
    }).onConflictDoUpdate({
      target: pricingRulesTable.id,
      set: {
        markupMultiplier: pricingBody.markupMultiplier,
        taxRate: pricingBody.taxRate,
        seasonalFactor: pricingBody.seasonalFactor,
      }
    });
    const data = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.id, "default"));
    return res.json({ success: true, pricing: data[0] });
  } catch (err: any) {
    console.error("Failed to update pricing rules:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// INQUIRY SUBMISSIONS & RESEND EMAILS
// ==========================================
router.post("/inquire", async (req: Request, res: Response) => {
  try {
    const { type, payload } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ error: "Incomplete request. Type and payload are required." });
    }

    const newInquiryId = "inq_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const guestToken = payload.guestToken || "tv_guest_" + Math.random().toString(36).slice(2, 11);
    const creationAuditEntry = {
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      actor: "guest",
      actorName: payload.name || "Online Guest",
      action: `Inquiry submitted for ${payload.apartmentName || payload.eventType || type || "Apartment Suite"}${payload.checkIn ? ` (${payload.checkIn} to ${payload.checkOut})` : ""}`,
      type: "inquiry_created"
    };
    const enrichedPayload = {
      ...payload,
      guestToken,
      paymentStatus: payload.paymentStatus || "unpaid",
      changeRequests: payload.changeRequests || [],
      auditTrail: Array.isArray(payload.auditTrail) && payload.auditTrail.length > 0
        ? payload.auditTrail
        : [creationAuditEntry]
    };

    if (!isDbConfigured()) {
      const store = readLocalStore();
      const inquiries = store.inquiries || [];
      inquiries.push({
        id: newInquiryId,
        type,
        payload: enrichedPayload,
        status: "Pending",
        createdAt: new Date().toISOString()
      });
      store.inquiries = inquiries;
      writeLocalStore(store);
    } else {
      const db = getDb();
      await db.insert(inquiriesTable).values({
        id: newInquiryId,
        type,
        payload: enrichedPayload,
        status: "Pending",
        createdAt: new Date().toISOString()
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.json({
        success: true,
        simulated: true,
        message: "Inquiry captured successfully in demo mode!"
      });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    let toEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
    let subject = `[Tamarind Village] Booking Inquiry from ${payload.name || "Guest"}`;

    if (type === "general") {
      toEmail = payload.department === "restaurant"
        ? (process.env.EMAIL_RESTAURANT || "reservations.mombasa@tamarind.co.ke")
        : payload.department === "dhow"
          ? (process.env.EMAIL_DHOW || "reservations.dhow@tamarind.co.ke")
          : (process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke");
      subject = `[Tamarind Contact] Message from ${payload.name}`;
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5; padding: 20px;">
        <h2 style="color: #821124;">New ${type.toUpperCase()} Inquiry Received</h2>
        <p><strong>Name:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <p><strong>Phone:</strong> ${payload.phone || "N/A"}</p>
        <p><strong>Details:</strong> ${payload.requests || payload.message || payload.details || "None"}</p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent
      });
    } catch (e) {
      console.warn("Failed to dispatch Resend notification email:", e);
    }

    return res.json({ success: true, inquiryId: newInquiryId, guestToken });
  } catch (error: any) {
    console.error("Error in /inquire handler:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

// ==========================================
// GLOBAL SETTINGS
// ==========================================
router.get("/settings", async (req: Request, res: Response) => {
  const key = req.query.key as string;
  try {
    if (isDbConfigured()) {
      const db = getDb();
      if (key) {
        const data = await db.select().from(globalSettingsTable).where(eq(globalSettingsTable.key, key));
        const value = data[0]?.value || (
          key === "transfer_vehicles" ? FALLBACK_TRANSFERS :
            key === "event_packages" ? FALLBACK_EVENTS :
              key === "boarding_packages" ? FALLBACK_BOARDING :
                key === "staff_users" ? FALLBACK_STAFF_USERS : null
        );
        return res.status(200).json({ success: true, key, value });
      } else {
        const data = await db.select().from(globalSettingsTable);
        const settingsMap: Record<string, any> = {};
        for (const item of data) {
          settingsMap[item.key] = item.value;
        }
        return res.status(200).json({
          success: true,
          transfer_vehicles: settingsMap.transfer_vehicles || FALLBACK_TRANSFERS,
          event_packages: settingsMap.event_packages || FALLBACK_EVENTS,
          boarding_packages: settingsMap.boarding_packages || FALLBACK_BOARDING,
          staff_users: settingsMap.staff_users || FALLBACK_STAFF_USERS
        });
      }
    } else {
      const store = readLocalStore();
      const settingsMap = store.settings || {};
      if (key) {
        const value = settingsMap[key] || (
          key === "transfer_vehicles" ? FALLBACK_TRANSFERS :
            key === "event_packages" ? FALLBACK_EVENTS :
              key === "boarding_packages" ? FALLBACK_BOARDING :
                key === "staff_users" ? FALLBACK_STAFF_USERS : null
        );
        return res.status(200).json({ success: true, key, value });
      } else {
        return res.status(200).json({
          success: true,
          transfer_vehicles: settingsMap.transfer_vehicles || FALLBACK_TRANSFERS,
          event_packages: settingsMap.event_packages || FALLBACK_EVENTS,
          boarding_packages: settingsMap.boarding_packages || FALLBACK_BOARDING,
          staff_users: settingsMap.staff_users || FALLBACK_STAFF_USERS
        });
      }
    }
  } catch (err: any) {
    console.error("Express API /settings failed:", err);
    return res.status(200).json({
      success: true,
      transfer_vehicles: FALLBACK_TRANSFERS,
      event_packages: FALLBACK_EVENTS,
      boarding_packages: FALLBACK_BOARDING,
      staff_users: FALLBACK_STAFF_USERS,
      database_error: err.message
    });
  }
});

router.post("/settings", async (req: Request, res: Response) => {
  try {
    const key = req.body?.key;
    const value = req.body?.value;
    if (!key || value === undefined) {
      return res.status(400).json({ error: "Key and value are required." });
    }

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(globalSettingsTable).values({ key, value }).onConflictDoUpdate({
        target: globalSettingsTable.key,
        set: { value }
      });
    } else {
      const store = readLocalStore();
      if (!store.settings) store.settings = {};
      store.settings[key] = value;
      writeLocalStore(store);
    }

    return res.status(200).json({ success: true, key, value });
  } catch (err: any) {
    console.error("Failed to save setting:", err);
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// Create and export the master Express app
const app = express();
app.use(express.json());

// Auto-sync database on requests
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseSynced();
  } catch (e) {
    // Non-blocking if database is offline or not configured yet
  }
  next();
});

// Mount router on both /api (standard) and root / (in case Vercel rewrites without prefix)
app.use("/api", router);
app.use(router);

export default app;
export { router };

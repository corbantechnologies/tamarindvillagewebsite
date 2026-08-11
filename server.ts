import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";
import fs from "fs";

// Drizzle database integration
import { getDb, isDbConfigured } from "./src/db/db";
import { apartments as apartmentsTable, diningOptions as diningOptionsTable, pricingRules as pricingRulesTable, inquiries as inquiriesTable, globalSettings as globalSettingsTable } from "./src/db/schema";
import { initAndMigrateDatabase, ensureDatabaseSynced } from "./src/db/migrate";
import { eq } from "drizzle-orm";

dotenv.config();

// DATA STORE INITIALIZATION
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677148/4_j84vps.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677147/2_jkcobb.jpg"
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783683956/3_y4yy1f.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399444/IMG-20260728-WA0067_zddl3j.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399619/IMG-20260728-WA0082_sgufrn.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399453/IMG-20260728-WA0072_dyahqk.jpg"
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783685440/11_te7vun.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399398/IMG-20260728-WA0056_npidaf.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399397/IMG-20260728-WA0054_yiazz1.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399396/IMG-20260728-WA0053_vplcb1.jpg"
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
      "Complimentary airport transfers"
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399230/PXL_20260721_145415867_zlb785.jpg",
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785844619/PXL_20260731_125648811_cnkxww.jpg",
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
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898889/v5_albvc2.jpg",
    reservationLinkText: "Inquire for Dhow Charter & Cruise"
  }
];

// Robust local file-based fallback store functions
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
        boarding_packages: FALLBACK_BOARDING
      }
    };
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    console.log("📝 Created default fallback data_store.json");
  }
}

function readLocalStore() {
  initLocalStore();
  try {
    return JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
  } catch (err) {
    console.error("Failed to read local store:", err);
    return {
      apartments: DEFAULT_APARTMENTS,
      dining: DEFAULT_DINING,
      pricing: DEFAULT_PRICING,
      inquiries: [],
      settings: {
        transfer_vehicles: FALLBACK_TRANSFERS,
        event_packages: FALLBACK_EVENTS,
        boarding_packages: FALLBACK_BOARDING
      }
    };
  }
}

function writeLocalStore(data: any) {
  try {
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local store:", err);
  }
}

async function startServer() {
  // Ensure we always initialize the local fallback store first
  initLocalStore();

  // Ensure the PostgreSQL schema and seeds are initialized before server starts serving requests
  await initAndMigrateDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());


  // API Route for Rooms Proxy (CORS Bypass)
  app.get("/api/rooms", async (req, res) => {
    try {
      const url = "https://wis.upperbooking.com/tamarindvillage/Rooms.xml?locale=en";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upperbooking responded with status ${response.status}`);
      }

      const text = await response.text();
      res.set("Content-Type", "application/xml; charset=utf-8");
      return res.send(text);
    } catch (error: any) {
      console.error("Express proxy /api/rooms failed:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // STAFF MANAGEMENT PORTAL ENDPOINTS (POWERED BY POSTGRES & DRIZZLE WITH LOCAL FALLBACK)
  app.get("/api/inquiries", async (req, res) => {
    try {
      if (!isDbConfigured()) {
        const store = readLocalStore();
        const sorted = [...(store.inquiries || [])].sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
        return res.json({ success: true, inquiries: sorted });
      }
      const db = getDb();
      const data = await db.select().from(inquiriesTable);
      // Order inquiries so newest show up first
      const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return res.json({ success: true, inquiries: sorted });
    } catch (err: any) {
      console.error("Failed to fetch inquiries:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inquiries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required." });
      }

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const inquiries = store.inquiries || [];
        const inq = inquiries.find((i: any) => i.id === id);
        if (!inq) {
          return res.status(404).json({ error: "Inquiry not found." });
        }
        inq.status = status;
        writeLocalStore(store);
        return res.json({ success: true, inquiry: inq });
      }

      const db = getDb();
      const updated = await db
        .update(inquiriesTable)
        .set({ status })
        .where(eq(inquiriesTable.id, id))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: "Inquiry not found." });
      }
      return res.json({ success: true, inquiry: updated[0] });
    } catch (err: any) {
      console.error("Failed to update inquiry status:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/inquiries/:id", async (req, res) => {
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

  app.delete("/api/apartments/:id", async (req, res) => {
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

  app.delete("/api/dining/:id", async (req, res) => {
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

  app.get("/api/apartments", async (req, res) => {
    try {
      if (!isDbConfigured()) {
        const store = readLocalStore();
        return res.json({ success: true, apartments: store.apartments || DEFAULT_APARTMENTS });
      }
      const db = getDb();
      const data = await db.select().from(apartmentsTable);
      return res.json({ success: true, apartments: data });
    } catch (err: any) {
      console.error("Failed to fetch apartments:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/apartments", async (req, res) => {
    try {
      const { apartments: aptsBody } = req.body;
      if (!Array.isArray(aptsBody)) {
        return res.status(400).json({ error: "Apartments must be an array." });
      }

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const list = store.apartments || [];
        for (const apt of aptsBody) {
          const index = list.findIndex((a: any) => a.id === apt.id);
          const sanitized = {
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
          };
          if (index !== -1) {
            list[index] = sanitized;
          } else {
            list.push(sanitized);
          }
        }
        store.apartments = list;
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

  app.get("/api/dining", async (req, res) => {
    try {
      if (!isDbConfigured()) {
        const store = readLocalStore();
        return res.json({ success: true, dining: store.dining || DEFAULT_DINING });
      }
      const db = getDb();
      const data = await db.select().from(diningOptionsTable);
      return res.json({ success: true, dining: data });
    } catch (err: any) {
      console.error("Failed to fetch dining experiences:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/dining", async (req, res) => {
    try {
      const { dining: diningBody } = req.body;
      if (!Array.isArray(diningBody)) {
        return res.status(400).json({ error: "Dining experiences must be an array." });
      }

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const list = store.dining || [];
        for (const dine of diningBody) {
          const index = list.findIndex((d: any) => d.id === dine.id);
          const sanitized = {
            id: dine.id,
            name: dine.name || "Unnamed Venue",
            description: dine.description || "",
            highlights: dine.highlights || [],
            hours: dine.hours || "Open Daily",
            image: dine.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            reservationLinkText: dine.reservationLinkText || "Inquire Table",
          };
          if (index !== -1) {
            list[index] = sanitized;
          } else {
            list.push(sanitized);
          }
        }
        store.dining = list;
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

  app.get("/api/pricing", async (req, res) => {
    try {
      if (!isDbConfigured()) {
        const store = readLocalStore();
        return res.json({ success: true, pricing: store.pricing || DEFAULT_PRICING });
      }
      const db = getDb();
      const data = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.id, "default"));
      const pricing = data[0] || { markupMultiplier: 1.0, taxRate: 8, seasonalFactor: "regular" };
      return res.json({ success: true, pricing });
    } catch (err: any) {
      console.error("Failed to fetch pricing rules:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/pricing", async (req, res) => {
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

  // API Route for Offers Proxy (CORS Bypass)
  app.get("/api/offers", async (req, res) => {
    try {
      const url = "https://wis.upperbooking.com/tamarindvillage/Offers.xml?locale=en";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upperbooking responded with status ${response.status}`);
      }

      const text = await response.text();
      res.set("Content-Type", "application/xml; charset=utf-8");
      return res.send(text);
    } catch (error: any) {
      console.error("Express proxy /api/offers failed:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Inquiry Submissions
  app.post("/api/inquire", async (req, res) => {
    try {
      const { type, payload } = req.body;
      if (!type || !payload) {
        return res.status(400).json({ error: "Incomplete request. Type and payload are required." });
      }

      const newInquiryId = "inq_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const inquiries = store.inquiries || [];
        inquiries.push({
          id: newInquiryId,
          type,
          payload,
          status: "Pending",
          createdAt: new Date().toISOString()
        });
        store.inquiries = inquiries;
        writeLocalStore(store);
      } else {
        // Live capture to database store (PostgreSQL via Drizzle)
        const db = getDb();
        await db.insert(inquiriesTable).values({
          id: newInquiryId,
          type,
          payload,
          status: "Pending",
          createdAt: new Date().toISOString()
        });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("RESEND_API_KEY not configured. Simulating email send (but saved in store!).");
        return res.json({ 
          success: true, 
          simulated: true, 
          message: "RESEND_API_KEY not set. Your inquiry was successfully captured on the staff dashboard in demo mode!" 
        });
      }

      const resend = new Resend(resendApiKey);

      // Determine recipient email based on department or inquiry type
      let toEmail = "";
      let subject = "";
      let htmlContent = "";

      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

      if (type === "general") {
        const { name, email, message, department } = payload;
        
        let deptName = "General / Guest Experience";
        if (department === "restaurant") {
          toEmail = process.env.EMAIL_RESTAURANT || "reservations.mombasa@tamarind.co.ke";
          deptName = "Tamarind Mombasa Restaurant";
        } else if (department === "dhow") {
          toEmail = process.env.EMAIL_DHOW || "reservations.dhow@tamarind.co.ke";
          deptName = "Tamarind Dhow Cruise";
        } else {
          toEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
          deptName = "Tamarind Village Mombasa Apartments";
        }

        subject = `[${deptName}] New Contact Message from ${name}`;
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">Tamarind Mombasa</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Guest Experience & Desk Inquiries</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">General Inquiry Received</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #560A17;">Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Department:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #821124;">${deptName}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Message Details:</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Mombasa • Silo Park Road, Nyali Creek, Mombasa, Kenya
            </div>
          </div>
        `;
      } else if (type === "apartment") {
        const { name, email, phone, apartmentName, checkIn, checkOut, guests, packageId, requests, totalCost } = payload;
        toEmail = process.env.EMAIL_VILLAGE || "reservations.village@tamarind.co.ke";
        subject = `[Tamarind Village] Booking Inquiry for ${apartmentName} - ${name}`;
        
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">Tamarind Village Mombasa</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Luxury Serviced Apartments</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">Apartment Stay Proposal Inquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Apartment Type:</td>
                  <td style="padding: 8px 0; color: #1F1615;"><strong>${apartmentName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Check-In Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${checkIn || "Flexible / Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Check-Out Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${checkOut || "Flexible / Not specified"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Number of Guests:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${guests || 1} Guests</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Boarding Plan:</td>
                  <td style="padding: 8px 0; text-transform: uppercase; color: #1F1615;"><strong>${packageId || "Self Catering (RO)"}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Estimated Total:</td>
                  <td style="padding: 8px 0; color: #821124; font-weight: bold; font-size: 16px;">$${totalCost || "N/A"}</td>
                </tr>
              </table>

              <h3 style="color: #821124; font-family: Georgia, serif; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #FAF6F0; padding-bottom: 8px;">Lead Guest Information</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Guest Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email Address:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${phone}</td>
                </tr>
              </table>

              ${requests ? `
                <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Guest Special Requests:</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${requests}</p>
                </div>
              ` : ""}
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Village Mombasa • Nyali Creek, Mombasa, Kenya
            </div>
          </div>
        `;
      } else if (type === "dining") {
        const { name, email, phone, diningName, date, time, guests, details, totalCost } = payload;
        
        const isDhow = diningName.toLowerCase().includes("dhow");
        toEmail = isDhow 
          ? (process.env.EMAIL_DHOW || "reservations.dhow@tamarind.co.ke")
          : (process.env.EMAIL_RESTAURANT || "reservations.mombasa@tamarind.co.ke");

        subject = `[${isDhow ? "Tamarind Dhow" : "Tamarind Restaurant"}] Seating / Reservation Inquiry - ${name}`;

        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 24px; tracking: 0.05em;">${isDhow ? "Tamarind Dhow Cruises" : "Tamarind Mombasa Restaurant"}</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em;">Luxury Seating Reservation Desk</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">Dining Reservation Inquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Dining Option:</td>
                  <td style="padding: 8px 0; color: #1F1615;"><strong>${diningName}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Preferred Date:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Preferred Time:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Table/Deck Seats:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${guests} Guests</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Budget Estimate:</td>
                  <td style="padding: 8px 0; color: #821124; font-weight: bold; font-size: 16px;">$${totalCost || "Custom Pricing"}</td>
                </tr>
              </table>

              <h3 style="color: #821124; font-family: Georgia, serif; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #FAF6F0; padding-bottom: 8px;">Lead Guest Information</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #560A17;">Guest Name:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Email Address:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #821124; text-decoration: none; border-bottom: 1px solid #821124;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #560A17;">Phone Number:</td>
                  <td style="padding: 8px 0; color: #1F1615;">${phone}</td>
                </tr>
              </table>

              ${details ? `
                <div style="margin-top: 30px; padding: 20px; background-color: #FAF6F0; border-left: 4px solid #821124;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #560A17;">Guest Seating & Culinary Preferences:</p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1F1615; white-space: pre-wrap;">${details}</p>
                </div>
              ` : ""}
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Dining Service Mombasa • Nyali Creek, Kenya
            </div>
          </div>
        `;
      } else {
        return res.status(400).json({ error: "Unknown inquiry type." });
      }

      console.log(`Sending email to ${toEmail} from ${fromEmail}`);

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        html: htmlContent,
      });

      if (emailResponse.error) {
        console.error("Resend API returned error:", emailResponse.error);
        return res.status(500).json({ error: emailResponse.error.message });
      }

      // Try sending a confirmation copy to the inquirer (guest)
      const guestEmail = payload.email;
      const guestName = payload.name || "Valued Guest";
      if (guestEmail) {
        let guestSubject = "Inquiry Received - Tamarind Mombasa";
        let guestBodyHeader = "Thank you for contacting Tamarind Mombasa";
        let guestBodyIntro = "We have received your inquiry and our desk team is currently reviewing it. We will be in touch with you shortly to assist with your request.";
        let detailsListHtml = "";

        if (type === "general") {
          guestSubject = "Thank you for reaching out - Tamarind Mombasa";
          guestBodyHeader = "Your Inquiry is Received";
          guestBodyIntro = `Thank you for contacting our team. We have received your message regarding our hospitality services and are preparing a response for you.`;
          detailsListHtml = `
            <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
              <strong>Your Message:</strong><br/>
              <span style="font-style: italic;">"${payload.message}"</span>
            </div>
          `;
        } else if (type === "apartment") {
          guestSubject = `Apartment Stay Request Acknowledged - Tamarind Village`;
          guestBodyHeader = "Thank You for Your Stay Proposal";
          guestBodyIntro = `We are delighted that you are considering a luxurious coastal retreat at Tamarind Village Mombasa. Our reservations office has received your apartment booking proposal and is verifying availability for your preferred dates.`;
          detailsListHtml = `
            <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
              <strong>Requested Stay Details:</strong><br/>
              • <strong>Apartment Type:</strong> ${payload.apartmentName}<br/>
              • <strong>Dates:</strong> ${payload.checkIn} to ${payload.checkOut}<br/>
              • <strong>Guests:</strong> ${payload.guests || 1} Guests<br/>
              • <strong>Estimated Total:</strong> $${payload.totalCost || "N/A"}
            </div>
          `;
        } else if (type === "dining") {
          const isDhow = payload.diningName?.toLowerCase().includes("dhow");
          guestSubject = isDhow 
            ? "Reservation Inquiry Received - Tamarind Dhow Cruise" 
            : "Table Inquiry Received - Tamarind Mombasa Restaurant";
          guestBodyHeader = isDhow ? "Your Dhow Cruise Request is Under Review" : "Your Dining Request is Under Review";
          guestBodyIntro = `Thank you for choosing Tamarind for your culinary experience. We have received your seating reservation request for ${payload.diningName} and are currently checking table availability for your requested date.`;
          detailsListHtml = `
            <div style="background-color: #FAF6F0; padding: 15px; border-left: 3px solid #821124; margin: 20px 0; font-size: 13px; color: #1F1615;">
              <strong>Requested Seating Details:</strong><br/>
              • <strong>Dining Option:</strong> ${payload.diningName}<br/>
              • <strong>Preferred Date:</strong> ${payload.date} at ${payload.time}<br/>
              • <strong>Guests:</strong> ${payload.guests} Guests
            </div>
          `;
        }

        const guestHtmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; color: #1F1615; line-height: 1.5;">
            <div style="background-color: #821124; padding: 25px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 22px; tracking: 0.05em;">Tamarind Mombasa</h1>
              <p style="color: #C59B27; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em;">coastal luxury & fine dining</p>
            </div>
            <div style="padding: 30px; border: 1px solid #FAF6F0; background-color: #ffffff;">
              <h2 style="color: #821124; font-family: Georgia, serif; font-size: 18px; border-bottom: 2px solid #FAF6F0; padding-bottom: 12px; margin-top: 0;">${guestBodyHeader}</h2>
              <p style="font-size: 14px; color: #1F1615;">Dear ${guestName},</p>
              <p style="font-size: 14px; color: #1F1615; line-height: 1.6;">${guestBodyIntro}</p>
              
              ${detailsListHtml}

              <p style="font-size: 14px; color: #1F1615; line-height: 1.6;">Please note that this is an acknowledgment of your request and not a finalized booking confirmation. A member of our dedicated guest experience desk will contact you via email or phone within 12-24 hours with your invoice, payment instructions, or further confirmation details.</p>
              
              <p style="font-size: 14px; color: #1F1615; margin-top: 30px;">Warm regards,</p>
              <p style="font-size: 14px; color: #821124; font-weight: bold; margin: 0;">Guest Experience Team</p>
              <p style="font-size: 12px; color: #7F7372; margin: 0;">Tamarind Mombasa</p>
            </div>
            <div style="background-color: #1F1615; color: #a1918a; font-size: 11px; text-align: center; padding: 15px;">
              Tamarind Mombasa • Silo Park Road, Nyali Creek, Mombasa, Kenya<br/>
              This is an automated acknowledgment. Please do not reply directly to this email.
            </div>
          </div>
        `;

        try {
          console.log(`[Local Server] Attempting to send confirmation copy to guest: ${guestEmail}`);
          await resend.emails.send({
            from: fromEmail,
            to: guestEmail,
            subject: guestSubject,
            html: guestHtmlContent,
          });
          console.log(`[Local Server] Guest confirmation email successfully sent to: ${guestEmail}`);
        } catch (guestErr: any) {
          console.warn("Failed to send copy to guest (this is expected if Resend is in Sandbox/Onboarding mode with unverified domains):", guestErr.message || guestErr);
        }
      }

      return res.json({ success: true, data: emailResponse.data });
    } catch (error: any) {
      console.error("Error in /api/inquire handler:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Global Settings (Fleet, Events, Boarding Packages)
  app.get("/api/settings", async (req, res) => {
    const key = req.query.key as string;
    try {
      if (isDbConfigured()) {
        await ensureDatabaseSynced();
        const db = getDb();
        if (key) {
          const data = await db.select().from(globalSettingsTable).where(eq(globalSettingsTable.key, key));
          const value = data[0]?.value || (
            key === "transfer_vehicles" ? FALLBACK_TRANSFERS :
            key === "event_packages" ? FALLBACK_EVENTS :
            key === "boarding_packages" ? FALLBACK_BOARDING : null
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
            boarding_packages: settingsMap.boarding_packages || FALLBACK_BOARDING
          });
        }
      } else {
        // Fallback file-store mode
        const store = readLocalStore();
        const settingsMap = store.settings || {};
        if (key) {
          const value = settingsMap[key] || (
            key === "transfer_vehicles" ? FALLBACK_TRANSFERS :
            key === "event_packages" ? FALLBACK_EVENTS :
            key === "boarding_packages" ? FALLBACK_BOARDING : null
          );
          return res.status(200).json({ success: true, key, value });
        } else {
          return res.status(200).json({
            success: true,
            transfer_vehicles: settingsMap.transfer_vehicles || FALLBACK_TRANSFERS,
            event_packages: settingsMap.event_packages || FALLBACK_EVENTS,
            boarding_packages: settingsMap.boarding_packages || FALLBACK_BOARDING
          });
        }
      }
    } catch (err: any) {
      console.error("Express API /api/settings failed:", err);
      if (key) {
        const value = key === "transfer_vehicles" ? FALLBACK_TRANSFERS :
                      key === "event_packages" ? FALLBACK_EVENTS :
                      key === "boarding_packages" ? FALLBACK_BOARDING : null;
        return res.status(200).json({ success: true, key, value, database_error: err.message });
      }
      return res.status(200).json({ 
        success: true, 
        transfer_vehicles: FALLBACK_TRANSFERS,
        event_packages: FALLBACK_EVENTS,
        boarding_packages: FALLBACK_BOARDING,
        database_error: err.message || "Database connection failed. Switched to offline mode." 
      });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const key = req.body?.key;
      const value = req.body?.value;
      if (!key) {
        return res.status(400).json({ error: "Settings 'key' parameter is required." });
      }
      if (value === undefined) {
        return res.status(400).json({ error: "Settings 'value' payload is required." });
      }

      if (isDbConfigured()) {
        await ensureDatabaseSynced();
        const db = getDb();
        await db.insert(globalSettingsTable).values({
          key,
          value,
        }).onConflictDoUpdate({
          target: globalSettingsTable.key,
          set: { value }
        });
      } else {
        // Fallback file-store mode
        const store = readLocalStore();
        if (!store.settings) store.settings = {};
        store.settings[key] = value;
        writeLocalStore(store);
      }

      return res.status(200).json({ success: true, key, value });
    } catch (err: any) {
      console.error("Failed to save global setting:", err);
      return res.status(500).json({ error: `Database action failed: ${err.message || "Internal Error"}` });
    }
  });

  // Serve static files in production / Vite development middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

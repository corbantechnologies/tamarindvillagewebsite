import { getDb, isDbConfigured } from "../src/db/db";
import { ensureDatabaseSynced } from "../src/db/migrate";
import { globalSettings as globalSettingsTable } from "../src/db/schema";
import { eq } from "drizzle-orm";

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

export default async function handler(req: any, res: any) {
  const { method } = req;
  const key = req.query.key || req.body?.key;

  try {
    await ensureDatabaseSynced();

    if (method === "GET") {
      if (!isDbConfigured()) {
        if (key === "transfer_vehicles") return res.status(200).json({ success: true, value: FALLBACK_TRANSFERS });
        if (key === "event_packages") return res.status(200).json({ success: true, value: FALLBACK_EVENTS });
        if (key === "boarding_packages") return res.status(200).json({ success: true, value: FALLBACK_BOARDING });
        
        return res.status(200).json({
          success: true,
          transfer_vehicles: FALLBACK_TRANSFERS,
          event_packages: FALLBACK_EVENTS,
          boarding_packages: FALLBACK_BOARDING
        });
      }

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
    } 
    
    else if (method === "POST") {
      if (!key) {
        return res.status(400).json({ error: "Settings 'key' parameter is required." });
      }

      const { value } = req.body;
      if (value === undefined) {
        return res.status(400).json({ error: "Settings 'value' payload is required." });
      }

      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, key, value });
      }

      const db = getDb();
      await db.insert(globalSettingsTable).values({
        key,
        value,
      }).onConflictDoUpdate({
        target: globalSettingsTable.key,
        set: { value }
      });

      return res.status(200).json({ success: true, key, value });
    } 
    
    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("Vercel API /api/settings failed:", err);
    if (method === "GET") {
      if (key === "transfer_vehicles") return res.status(200).json({ success: true, value: FALLBACK_TRANSFERS });
      if (key === "event_packages") return res.status(200).json({ success: true, value: FALLBACK_EVENTS });
      if (key === "boarding_packages") return res.status(200).json({ success: true, value: FALLBACK_BOARDING });

      return res.status(200).json({ 
        success: true, 
        transfer_vehicles: FALLBACK_TRANSFERS,
        event_packages: FALLBACK_EVENTS,
        boarding_packages: FALLBACK_BOARDING,
        database_error: err.message || "Database connection failed. Switched to offline mode." 
      });
    }
    return res.status(500).json({ error: `Database action failed: ${err.message || "Internal Error"}` });
  }
}

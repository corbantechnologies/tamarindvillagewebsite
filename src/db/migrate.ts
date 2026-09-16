import { getDb, getClient } from "./db.js";
import { apartments, diningOptions, pricingRules, inquiries, globalSettings } from "./schema.js";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { APARTMENTS, DINING } from "../data.js";

export async function initAndMigrateDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is missing! Skipping PostgreSQL initialization/migrations. Server will run in local file-store fallback mode.");
    return;
  }
  const client = getClient();
  const db = getDb();

  try {
    // Check if tables already exist to avoid concurrent DDL lock contention and redundant seeding
    const tableCheck = await client.unsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'apartments'
      );
    `);

    if (tableCheck[0]?.exists) {
      console.log("✅ Database schema is already initialized. Verifying and self-healing media assets...");
      await healLegacyMediaAssets(client, db);
      return;
    }

    console.log("🔄 Starting PostgreSQL Database initialization...");
    // 1. Create tables if they do not exist
    console.log("🛠️ Creating tables if not exist...");
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS apartments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        size TEXT NOT NULL,
        max_guests INTEGER NOT NULL,
        price_per_night INTEGER NOT NULL,
        image TEXT NOT NULL,
        gallery JSONB NOT NULL,
        amenities JSONB NOT NULL,
        bedrooms INTEGER NOT NULL,
        bathrooms DOUBLE PRECISION NOT NULL,
        highlights JSONB NOT NULL,
        bed_config TEXT NOT NULL,
        view_type TEXT NOT NULL
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS dining_options (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        highlights JSONB NOT NULL,
        hours TEXT NOT NULL,
        image TEXT NOT NULL,
        reservation_link_text TEXT NOT NULL
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id TEXT PRIMARY KEY,
        markup_multiplier DOUBLE PRECISION NOT NULL,
        tax_rate INTEGER NOT NULL,
        seasonal_factor TEXT NOT NULL
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TEXT NOT NULL
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS global_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    console.log("✅ Database schema is up-to-date.");

    // 2. Check if tables are empty and seed them
    const apartmentsCountRes = await client.unsafe("SELECT COUNT(*) FROM apartments");
    const apartmentsCount = parseInt(apartmentsCountRes[0]?.count || "0", 10);

    const diningCountRes = await client.unsafe("SELECT COUNT(*) FROM dining_options");
    const diningCount = parseInt(diningCountRes[0]?.count || "0", 10);

    const pricingCountRes = await client.unsafe("SELECT COUNT(*) FROM pricing_rules");
    const pricingCount = parseInt(pricingCountRes[0]?.count || "0", 10);

    const inquiriesCountRes = await client.unsafe("SELECT COUNT(*) FROM inquiries");
    const inquiriesCount = parseInt(inquiriesCountRes[0]?.count || "0", 10);

    // Load original data_store.json if available
    let seedData: any = null;
    const storePath = path.join(process.cwd(), "data_store.json");
    if (fs.existsSync(storePath)) {
      try {
        seedData = JSON.parse(fs.readFileSync(storePath, "utf-8"));
        console.log("📄 Loaded seed data from data_store.json");
      } catch (e) {
        console.error("⚠️ Failed to parse data_store.json:", e);
      }
    }

    // Fall back to default static datasets if data_store.json is absent (e.g. on Vercel)
    if (!seedData) {
      console.log("🌱 data_store.json not found on serverless runtime. Hydrating database using default datasets.");
      seedData = {
        apartments: APARTMENTS,
        dining: DINING,
        pricing: {
          markupMultiplier: 1.0,
          taxRate: 8,
          seasonalFactor: "regular"
        },
        inquiries: []
      };
    }

    // A. Seed Apartments
    if (apartmentsCount === 0 && seedData?.apartments?.length > 0) {
      console.log("🌱 Seeding apartments table...");
      for (const apt of seedData.apartments) {
        await db.insert(apartments).values({
          id: apt.id,
          name: apt.name,
          description: apt.description,
          size: apt.size,
          maxGuests: apt.maxGuests,
          pricePerNight: apt.pricePerNight,
          image: apt.image,
          gallery: apt.gallery || [],
          amenities: apt.amenities || [],
          bedrooms: apt.bedrooms,
          bathrooms: apt.bathrooms,
          highlights: apt.highlights || [],
          bedConfig: apt.bedConfig || "",
          viewType: apt.viewType || "",
        });
      }
      console.log(`✅ Seeded ${seedData.apartments.length} apartments.`);
    }

    // B. Seed Dining Experiences
    if (diningCount === 0 && seedData?.dining?.length > 0) {
      console.log("🌱 Seeding dining_options table...");
      for (const dine of seedData.dining) {
        await db.insert(diningOptions).values({
          id: dine.id,
          name: dine.name,
          description: dine.description,
          highlights: dine.highlights || [],
          hours: dine.hours || "",
          image: dine.image,
          reservationLinkText: dine.reservationLinkText || "Inquire Table",
        });
      }
      console.log(`✅ Seeded ${seedData.dining.length} dining options.`);
    }

    // C. Seed Pricing Rules
    if (pricingCount === 0) {
      console.log("🌱 Seeding default pricing rules...");
      const pricing = seedData?.pricing || {
        markupMultiplier: 1.0,
        taxRate: 8,
        seasonalFactor: "regular",
      };
      await db.insert(pricingRules).values({
        id: "default",
        markupMultiplier: pricing.markupMultiplier || 1.0,
        taxRate: pricing.taxRate || 8,
        seasonalFactor: pricing.seasonalFactor || "regular",
      });
      console.log("✅ Seeded default pricing rules.");
    }

    // D. Seed Inquiries if there are any historical ones in the store file
    if (inquiriesCount === 0 && seedData?.inquiries?.length > 0) {
      console.log("🌱 Seeding inquiries table...");
      for (const inq of seedData.inquiries) {
        await db.insert(inquiries).values({
          id: inq.id,
          type: inq.type,
          payload: inq.payload,
          status: inq.status || "Pending",
          createdAt: inq.createdAt || new Date().toISOString(),
        });
      }
      console.log(`... Seeded ${seedData.inquiries.length} historical inquiries.`);
    }

    // Seed global_settings
    const settingsCountRes = await client.unsafe("SELECT COUNT(*) FROM global_settings");
    const settingsCount = parseInt(settingsCountRes[0]?.count || "0", 10);
    if (settingsCount === 0) {
      console.log("🌱 Seeding default global settings (transfer fleet, event packages, boarding packages)...");
      const defaultTransfers = [
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

      const defaultEvents = [
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
          image: "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--2.jpg",
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

      const defaultBoarding = [
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

      await db.insert(globalSettings).values({
        key: "transfer_vehicles",
        value: defaultTransfers,
      });

      await db.insert(globalSettings).values({
        key: "event_packages",
        value: defaultEvents,
      });

      await db.insert(globalSettings).values({
        key: "boarding_packages",
        value: defaultBoarding,
      });

      console.log("🌱 Default global settings seeded successfully.");
    }

    await healLegacyMediaAssets(client, db);

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Database initialization / migration failed:", error);
    throw error;
  }
}

let isLegacyMediaHealed = false;

export async function healLegacyMediaAssets(client: any, db: any) {
  if (isLegacyMediaHealed) return;

  try {
    // 1. Check for legacy Cloudinary images in dining_options
    const legacyDining = await client.unsafe(`
      SELECT id, name, image FROM dining_options WHERE image LIKE '%cloudinary%';
    `);

    // 2. Check for legacy Cloudinary images in apartments
    const legacyApartments = await client.unsafe(`
      SELECT id, name, image, gallery FROM apartments 
      WHERE image LIKE '%cloudinary%' OR gallery::text LIKE '%cloudinary%';
    `);

    // 3. Check for legacy Cloudinary images in global_settings
    const legacySettings = await client.unsafe(`
      SELECT key, value FROM global_settings WHERE value::text LIKE '%cloudinary%';
    `);

    const hasLegacyData = legacyDining.length > 0 || legacyApartments.length > 0 || legacySettings.length > 0;

    if (!hasLegacyData) {
      isLegacyMediaHealed = true;
      return;
    }

    console.log(`🔄 [Self-Healing] Detected legacy Cloudinary assets (${legacyDining.length} dining, ${legacyApartments.length} apartments, ${legacySettings.length} settings). Self-healing database records...`);

    // Load canonical data from data_store.json if available, or fall back to static data
    let canonicalData: any = null;
    const storePath = path.join(process.cwd(), "data_store.json");
    if (fs.existsSync(storePath)) {
      try {
        canonicalData = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      } catch (e) {
        console.error("⚠️ Failed to parse data_store.json during self-healing:", e);
      }
    }

    if (!canonicalData) {
      canonicalData = {
        apartments: APARTMENTS,
        dining: DINING,
      };
    }

    // Default hardcoded self-hosted mappings for dining
    const FALLBACK_DINING_IMAGES: Record<string, string> = {
      "tamarind-restaurant": "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg",
      "dawa-terrace": "https://media.tamarind.co.ke/tvl-website-assets/t1.jpg",
      "tamarind-dhow": "https://media.tamarind.co.ke/tvl-website-assets/d2.jpg",
    };

    // A. Heal dining_options
    let healedDiningCount = 0;
    for (const row of legacyDining) {
      const match = canonicalData.dining?.find((d: any) => d.id === row.id);
      const targetImage = (match?.image && !match.image.includes("cloudinary"))
        ? match.image 
        : (FALLBACK_DINING_IMAGES[row.id] || "https://media.tamarind.co.ke/tvl-website-assets/mr6.jpg");

      if (targetImage) {
        await client.unsafe(`
          UPDATE dining_options SET image = $1 WHERE id = $2;
        `, [targetImage, row.id]);
        healedDiningCount++;
        console.log(`  ✅ [Self-Healing] Updated dining '${row.id}' -> ${targetImage}`);
      }
    }

    // B. Heal apartments
    let healedApartmentCount = 0;
    for (const row of legacyApartments) {
      const match = canonicalData.apartments?.find((a: any) => a.id === row.id);
      if (match) {
        const targetImage = (match.image && !match.image.includes("cloudinary")) ? match.image : row.image;
        const targetGallery = (match.gallery && Array.isArray(match.gallery)) ? match.gallery : row.gallery;
        await client.unsafe(`
          UPDATE apartments SET image = $1, gallery = $2 WHERE id = $3;
        `, [targetImage, JSON.stringify(targetGallery), row.id]);
        healedApartmentCount++;
        console.log(`  ✅ [Self-Healing] Updated apartment '${row.id}' to self-hosted media`);
      }
    }

    // C. Heal global_settings
    let healedSettingsCount = 0;
    for (const row of legacySettings) {
      if (row.key === "event_packages" && canonicalData.settings?.event_packages) {
        await client.unsafe(`
          UPDATE global_settings SET value = $1 WHERE key = 'event_packages';
        `, [JSON.stringify(canonicalData.settings.event_packages)]);
        healedSettingsCount++;
        console.log(`  ✅ [Self-Healing] Updated global_settings 'event_packages'`);
      }
      if (row.key === "transfer_vehicles" && canonicalData.settings?.transfer_vehicles) {
        await client.unsafe(`
          UPDATE global_settings SET value = $1 WHERE key = 'transfer_vehicles';
        `, [JSON.stringify(canonicalData.settings.transfer_vehicles)]);
        healedSettingsCount++;
        console.log(`  ✅ [Self-Healing] Updated global_settings 'transfer_vehicles'`);
      }
    }

    console.log(`✨ [Self-Healing] Successfully healed ${healedDiningCount} dining options, ${healedApartmentCount} apartments, and ${healedSettingsCount} global settings!`);
    isLegacyMediaHealed = true;
  } catch (err) {
    console.error("⚠️ [Self-Healing] Failed to auto-heal legacy media assets:", err);
  }
}

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseSynced() {
  if (!process.env.DATABASE_URL) return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        await initAndMigrateDatabase();
      } catch (err) {
        console.error("Lazy database migration failed:", err);
        migrationPromise = null; // Reset to allow retrying on subsequent requests if it failed
        throw err;
      }
    })();
  }
  await migrationPromise;
}

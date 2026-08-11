import { getDb, getClient } from "./db";
import { apartments, diningOptions, pricingRules, inquiries } from "./schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { APARTMENTS, DINING } from "../data";

export async function initAndMigrateDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is missing! Skipping PostgreSQL initialization/migrations. Server will run in local file-store fallback mode.");
    return;
  }
  console.log("🔄 Starting PostgreSQL Database initialization...");
  const client = getClient();
  const db = getDb();

  try {
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
      console.log(`✅ Seeded ${seedData.inquiries.length} historical inquiries.`);
    }

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Database initialization / migration failed:", error);
    throw error;
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

import { getDb, getClient } from "./db.js";
import { 
  users, 
  passwordResets, 
  apartments, 
  diningOptions, 
  packages, 
  extras, 
  facilities, 
  pricingRules, 
  inquiries, 
  bookings, 
  auditLogs, 
  globalSettings 
} from "./schema.js";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import { APARTMENTS, DINING, PACKAGES, FACILITIES } from "../data.js";
import { DEFAULT_TRANSFER_VEHICLES, DEFAULT_EVENT_PACKAGES } from "../utils/extrasStore.js";

export async function initAndMigrateDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is missing! Skipping PostgreSQL initialization/migrations. Server will run in local file-store fallback mode.");
    return;
  }
  const client = getClient();
  const db = getDb();

  try {
    console.log("🔄 Ensuring PostgreSQL database tables exist...");

    // 1. Create tables if they do not exist
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL,
        last_login TEXT
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TEXT NOT NULL
      );
    `);

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
        view_type TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
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
        reservation_link_text TEXT NOT NULL,
        max_capacity INTEGER DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_markup_percentage DOUBLE PRECISION NOT NULL DEFAULT 0,
        price_per_person_per_day DOUBLE PRECISION NOT NULL DEFAULT 0,
        highlights JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS extras (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        price_kes DOUBLE PRECISION NOT NULL DEFAULT 0,
        capacity INTEGER DEFAULT 4,
        features JSONB NOT NULL,
        image TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS facilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        image TEXT NOT NULL,
        details JSONB NOT NULL,
        is_resident_only BOOLEAN NOT NULL DEFAULT false,
        operating_hours TEXT,
        capacity INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true
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
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        booking_reference TEXT NOT NULL UNIQUE,
        inquiry_id TEXT,
        apartment_id TEXT NOT NULL,
        apartment_name TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        adults INTEGER NOT NULL DEFAULT 1,
        children INTEGER NOT NULL DEFAULT 0,
        package_id TEXT,
        package_name TEXT,
        total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        payment_method TEXT,
        booking_status TEXT NOT NULL DEFAULT 'confirmed',
        special_requests TEXT,
        staff_notes JSONB,
        created_at TEXT NOT NULL
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        target_id TEXT,
        metadata JSONB
      );
    `);

    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS global_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    console.log("✅ Database schema tables verified.");

    // ==========================================
    // 2. SEEDING & DATA HYDRATION
    // ==========================================

    // A. Seed Staff Users (Admin, Manager, Reservations, Reception)
    const usersCountRes = await client.unsafe("SELECT COUNT(*) FROM users");
    const usersCount = parseInt(usersCountRes[0]?.count || "0", 10);
    if (usersCount === 0) {
      console.log("🌱 Seeding baseline staff users for all 4 roles...");
      const defaultPasswordHash = bcrypt.hashSync("Tamarind2026!", 10);
      const initialUsers = [
        {
          id: "usr_admin_1",
          name: "Master Administrator",
          email: "admin@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "admin",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_mgr_1",
          name: "General Manager",
          email: "manager@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "manager",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_res_1",
          name: "Tamarind Reservations",
          email: "reservations@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "reservations",
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: "usr_rec_1",
          name: "Front Desk Reception",
          email: "reception@tamarind.co.ke",
          passwordHash: defaultPasswordHash,
          role: "reception",
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      for (const u of initialUsers) {
        await db.insert(users).values(u);
      }
      console.log("✅ Seeded 4 baseline staff accounts with initial credentials.");
    }

    // B. Seed Apartments if empty
    const apartmentsCountRes = await client.unsafe("SELECT COUNT(*) FROM apartments");
    const apartmentsCount = parseInt(apartmentsCountRes[0]?.count || "0", 10);
    if (apartmentsCount === 0) {
      console.log("🌱 Seeding apartments table from baseline catalog...");
      for (const apt of APARTMENTS) {
        await db.insert(apartments).values({
          id: apt.id,
          name: apt.name,
          description: apt.description,
          size: apt.size,
          maxGuests: apt.maxGuests,
          pricePerNight: apt.pricePerNight,
          image: apt.image,
          gallery: apt.gallery,
          amenities: apt.amenities,
          bedrooms: apt.bedrooms,
          bathrooms: apt.bathrooms,
          highlights: apt.highlights,
          bedConfig: apt.bedConfig,
          viewType: apt.viewType,
          isActive: true
        });
      }
      console.log(`... Seeded ${APARTMENTS.length} apartments.`);
    }

    // C. Seed Dining Options if empty
    const diningCountRes = await client.unsafe("SELECT COUNT(*) FROM dining_options");
    const diningCount = parseInt(diningCountRes[0]?.count || "0", 10);
    if (diningCount === 0) {
      console.log("🌱 Seeding dining options table...");
      for (const din of DINING) {
        await db.insert(diningOptions).values({
          id: din.id,
          name: din.name,
          description: din.description,
          highlights: din.highlights,
          hours: din.hours,
          image: din.image,
          reservationLinkText: din.reservationLinkText,
          maxCapacity: 100,
          isActive: true
        });
      }
      console.log(`... Seeded ${DINING.length} dining venues.`);
    }

    // D. Seed Boarding Packages if empty
    const packagesCountRes = await client.unsafe("SELECT COUNT(*) FROM packages");
    const packagesCount = parseInt(packagesCountRes[0]?.count || "0", 10);
    if (packagesCount === 0) {
      console.log("🌱 Seeding boarding packages...");
      for (const pkg of PACKAGES) {
        await db.insert(packages).values({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          priceMarkupPercentage: pkg.priceMarkupPercentage,
          pricePerPersonPerDay: pkg.pricePerPersonPerDay,
          highlights: pkg.highlights,
          isActive: true
        });
      }
      console.log(`... Seeded ${PACKAGES.length} packages.`);
    }

    // E. Seed Extras (Vehicles & Event Charters) if empty
    const extrasCountRes = await client.unsafe("SELECT COUNT(*) FROM extras");
    const extrasCount = parseInt(extrasCountRes[0]?.count || "0", 10);
    if (extrasCount === 0) {
      console.log("🌱 Seeding extras (fleet and event packages)...");
      for (const v of DEFAULT_TRANSFER_VEHICLES) {
        await db.insert(extras).values({
          id: v.id,
          category: "transfer",
          name: v.name,
          description: v.tagline,
          priceUsd: v.rateUsd,
          priceKes: v.rateKes,
          capacity: v.maxPassengers,
          features: v.features,
          image: v.image,
          isActive: true
        });
      }
      for (const ev of DEFAULT_EVENT_PACKAGES) {
        await db.insert(extras).values({
          id: ev.id,
          category: "event",
          name: ev.title,
          description: ev.description,
          priceUsd: 0,
          priceKes: 0,
          capacity: 50,
          features: ev.features,
          image: ev.image,
          isActive: true
        });
      }
      console.log("... Seeded transfer fleet and event charter packages.");
    }

    // F. Seed Facilities if empty
    const facilitiesCountRes = await client.unsafe("SELECT COUNT(*) FROM facilities");
    const facilitiesCount = parseInt(facilitiesCountRes[0]?.count || "0", 10);
    if (facilitiesCount === 0) {
      console.log("🌱 Seeding resort facilities...");
      for (const fac of FACILITIES) {
        await db.insert(facilities).values({
          id: fac.id,
          name: fac.name,
          description: fac.description,
          iconName: fac.iconName,
          image: fac.image,
          details: fac.details,
          isResidentOnly: fac.id === "pools",
          operatingHours: "6:00 AM – 7:00 PM Daily",
          capacity: fac.id === "conferences" ? 80 : 50,
          isActive: true
        });
      }
      console.log(`... Seeded ${FACILITIES.length} facilities.`);
    }

    // G. Seed Pricing Rules if empty
    const pricingCountRes = await client.unsafe("SELECT COUNT(*) FROM pricing_rules");
    const pricingCount = parseInt(pricingCountRes[0]?.count || "0", 10);
    if (pricingCount === 0) {
      await db.insert(pricingRules).values({
        id: "default",
        markupMultiplier: 1.0,
        taxRate: 8,
        seasonalFactor: "regular",
      });
      console.log("... Seeded default pricing rules.");
    }

    // H. Seed initial system audit log
    const auditCountRes = await client.unsafe("SELECT COUNT(*) FROM audit_logs");
    const auditCount = parseInt(auditCountRes[0]?.count || "0", 10);
    if (auditCount === 0) {
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: "System Initializer",
        actorRole: "admin",
        category: "System",
        action: "Schema Migration & Initialization",
        details: "Initialized PostgreSQL database tables and seeded baseline data.",
        targetId: "system",
        metadata: { version: "2.0.0" }
      });
    }

    await healLegacyMediaAssets(client, db);
    console.log("🎉 Database initialization and verification completed successfully.");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
}

export async function healLegacyMediaAssets(client: any, db: any) {
  try {
    // Self-heal broken unpkg / third-party links to official media.tamarind.co.ke assets
    await client.unsafe(`
      UPDATE apartments
      SET image = 'https://media.tamarind.co.ke/tvl-website-assets/r12.jpg'
      WHERE id = '1-bedroom' AND (image LIKE '%unpkg%' OR image LIKE '%placeholder%');
    `);
    await client.unsafe(`
      UPDATE apartments
      SET image = 'https://media.tamarind.co.ke/tvl-website-assets/r22.jpg'
      WHERE id = '2-bedroom' AND (image LIKE '%unpkg%' OR image LIKE '%placeholder%');
    `);
    await client.unsafe(`
      UPDATE apartments
      SET image = 'https://media.tamarind.co.ke/tvl-website-assets/r36.jpg'
      WHERE id = '3-bedroom' AND (image LIKE '%unpkg%' OR image LIKE '%placeholder%');
    `);
  } catch (healErr) {
    console.warn("Media asset healing warning:", healErr);
  }
}

export async function ensureDatabaseSynced() {
  await initAndMigrateDatabase();
}

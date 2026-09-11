import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables (.env.local or .env)
dotenv.config({ path: fs.existsSync(".env.local") ? ".env.local" : ".env" });

import { getDb, getClient, isDbConfigured } from "../src/db/db.js";
import { diningOptions, apartments, globalSettings } from "../src/db/schema.js";
import { healLegacyMediaAssets } from "../src/db/migrate.js";

async function runSync() {
  console.log("==================================================");
  console.log("🌊 Tamarind Village - Database Media Sync Utility");
  console.log("==================================================");

  if (!isDbConfigured()) {
    console.error("❌ DATABASE_URL is not configured in .env or .env.local.");
    process.exit(1);
  }

  const client = getClient();
  const db = getDb();

  try {
    console.log("📡 Connecting to PostgreSQL database...");

    // 1. Run automated self-healing for legacy Cloudinary URLs
    console.log("\n1️⃣ Running legacy media self-healing...");
    await healLegacyMediaAssets(client, db);

    // 2. Full synchronization with data_store.json
    console.log("\n2️⃣ Syncing records with data_store.json...");
    const storePath = path.join(process.cwd(), "data_store.json");
    if (!fs.existsSync(storePath)) {
      console.warn("⚠️ data_store.json not found, skipping deep sync.");
    } else {
      const storeData = JSON.parse(fs.readFileSync(storePath, "utf-8"));

      // Sync Dining Options
      if (Array.isArray(storeData.dining)) {
        console.log(`  🍽️  Synchronizing ${storeData.dining.length} dining experiences...`);
        for (const dine of storeData.dining) {
          await db.insert(diningOptions).values({
            id: dine.id,
            name: dine.name,
            description: dine.description,
            highlights: dine.highlights || [],
            hours: dine.hours || "Open Daily",
            image: dine.image,
            reservationLinkText: dine.reservationLinkText || "Inquire Table",
          }).onConflictDoUpdate({
            target: diningOptions.id,
            set: {
              name: dine.name,
              description: dine.description,
              highlights: dine.highlights || [],
              hours: dine.hours || "Open Daily",
              image: dine.image,
              reservationLinkText: dine.reservationLinkText || "Inquire Table",
            }
          });
          console.log(`     ✓ ${dine.name} (${dine.id}) -> ${dine.image}`);
        }
      }

      // Sync Apartments
      if (Array.isArray(storeData.apartments)) {
        console.log(`  🏨 Synchronizing ${storeData.apartments.length} apartments...`);
        for (const apt of storeData.apartments) {
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
          }).onConflictDoUpdate({
            target: apartments.id,
            set: {
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
            }
          });
          console.log(`     ✓ ${apt.name} (${apt.id}) -> ${apt.image}`);
        }
      }

      // Sync Global Settings
      if (storeData.settings) {
        console.log("  ⚙️  Synchronizing global settings...");
        if (storeData.settings.transfer_vehicles) {
          await db.insert(globalSettings).values({
            key: "transfer_vehicles",
            value: storeData.settings.transfer_vehicles,
          }).onConflictDoUpdate({
            target: globalSettings.key,
            set: { value: storeData.settings.transfer_vehicles },
          });
          console.log("     ✓ transfer_vehicles updated");
        }
        if (storeData.settings.event_packages) {
          await db.insert(globalSettings).values({
            key: "event_packages",
            value: storeData.settings.event_packages,
          }).onConflictDoUpdate({
            target: globalSettings.key,
            set: { value: storeData.settings.event_packages },
          });
          console.log("     ✓ event_packages updated");
        }
      }
    }

    // 3. Final Verification Check
    console.log("\n3️⃣ Running database verification...");
    const checkDining = await client.unsafe(`
      SELECT id, name, image FROM dining_options WHERE image LIKE '%cloudinary%';
    `);
    const checkApartments = await client.unsafe(`
      SELECT id, name, image FROM apartments WHERE image LIKE '%cloudinary%' OR gallery::text LIKE '%cloudinary%';
    `);

    if (checkDining.length === 0 && checkApartments.length === 0) {
      console.log("✅ Zero Cloudinary URLs remaining in PostgreSQL! All media successfully migrated to self-hosted assets.");
    } else {
      console.warn(`⚠️ Warning: Found ${checkDining.length} dining and ${checkApartments.length} apartments still referencing Cloudinary.`);
    }

    console.log("\n🎉 Database sync completed successfully!\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Database sync failed:", err);
    process.exit(1);
  }
}

runSync();

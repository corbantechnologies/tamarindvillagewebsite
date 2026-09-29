import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../db/db.js";
import { apartmentInventory, availabilityBlocks, bookings } from "../../db/schema.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

// ─────────────────────────────────────────────
// APARTMENT INVENTORY
// ─────────────────────────────────────────────

export async function handleGetInventory(req: Request, res: Response) {
  try {
    if (!isDbConfigured()) {
      const store = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return res.json({ success: true, inventory: store.inventory || [] });
    }
    const db = getDb();
    const rows = await db.select().from(apartmentInventory);
    return res.json({ success: true, inventory: rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function handleUpsertInventory(req: Request, res: Response) {
  try {
    const { apartmentId, totalUnits, notes } = req.body;
    if (!apartmentId || totalUnits === undefined) {
      return res.status(400).json({ error: "apartmentId and totalUnits are required." });
    }
    const now = new Date().toISOString();

    if (!isDbConfigured()) {
      const raw = fs.readFileSync(DATA_STORE_PATH, "utf-8");
      const store = JSON.parse(raw);
      store.inventory = store.inventory || [];
      const idx = store.inventory.findIndex((i: any) => i.id === apartmentId);
      if (idx >= 0) {
        store.inventory[idx] = { ...store.inventory[idx], totalUnits, notes, updatedAt: now };
      } else {
        store.inventory.push({ id: apartmentId, totalUnits, notes, updatedAt: now });
      }
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(store, null, 2));
      return res.json({ success: true });
    }

    const db = getDb();
    await db.insert(apartmentInventory).values({
      id: apartmentId,
      totalUnits: Number(totalUnits),
      notes: notes || null,
      updatedAt: now
    }).onConflictDoUpdate({
      target: apartmentInventory.id,
      set: { totalUnits: Number(totalUnits), notes: notes || null, updatedAt: now }
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// AVAILABILITY BLOCKS
// ─────────────────────────────────────────────

export async function handleGetBlocks(req: Request, res: Response) {
  try {
    if (!isDbConfigured()) {
      const store = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return res.json({ success: true, blocks: store.availability_blocks || [] });
    }
    const db = getDb();
    const rows = await db.select().from(availabilityBlocks);
    return res.json({ success: true, blocks: rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function handleCreateBlock(req: Request, res: Response) {
  try {
    const { apartmentId, startDate, endDate, reason, blockedBy } = req.body;
    if (!apartmentId || !startDate || !endDate) {
      return res.status(400).json({ error: "apartmentId, startDate, and endDate are required." });
    }

    const newBlock = {
      id: "blk_" + Date.now(),
      apartmentId,
      startDate,
      endDate,
      reason: reason || "Blocked",
      blockedBy: blockedBy || "Admin",
      createdAt: new Date().toISOString()
    };

    if (!isDbConfigured()) {
      const store = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      store.availability_blocks = store.availability_blocks || [];
      store.availability_blocks.push(newBlock);
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(store, null, 2));
      return res.status(201).json({ success: true, block: newBlock });
    }

    const db = getDb();
    await db.insert(availabilityBlocks).values(newBlock);
    return res.status(201).json({ success: true, block: newBlock });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function handleDeleteBlock(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isDbConfigured()) {
      const store = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      store.availability_blocks = (store.availability_blocks || []).filter((b: any) => b.id !== id);
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(store, null, 2));
      return res.json({ success: true });
    }
    const db = getDb();
    await db.delete(availabilityBlocks).where(eq(availabilityBlocks.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────
// AVAILABILITY CHECK  (used by guest booking form)
// Returns { available: boolean, occupiedUnits: number, totalUnits: number } per apartment
// ─────────────────────────────────────────────

export async function handleCheckAvailability(req: Request, res: Response) {
  try {
    const { checkIn, checkOut, apartmentId } = req.query as Record<string, string>;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: "checkIn and checkOut dates are required." });
    }

    if (!isDbConfigured()) {
      const store = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      const allBlocks: any[] = store.availability_blocks || [];
      const inventory: any[] = store.inventory || [];
      const allBookings: any[] = store.bookings || [];

      const result = buildAvailabilityResult(checkIn, checkOut, apartmentId, allBlocks, inventory, allBookings);
      return res.json({ success: true, ...result });
    }

    const db = getDb();
    const allBlocks = await db.select().from(availabilityBlocks);
    const inventory = await db.select().from(apartmentInventory);
    const allBookings = await db.select().from(bookings);

    const result = buildAvailabilityResult(checkIn, checkOut, apartmentId, allBlocks, inventory, allBookings);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

function datesOverlap(blockStart: string, blockEnd: string, checkIn: string, checkOut: string): boolean {
  return blockStart < checkOut && blockEnd > checkIn;
}

function buildAvailabilityResult(
  checkIn: string,
  checkOut: string,
  apartmentId: string | undefined,
  allBlocks: any[],
  inventory: any[],
  allBookings: any[]
) {
  // Check global blocks first (apartmentId === "all")
  const globallyBlocked = allBlocks.some(
    b => b.apartmentId === "all" && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
  );

  if (globallyBlocked) {
    return {
      available: false,
      message: "The property is not accepting reservations during this period.",
      apartments: []
    };
  }

  // Build per-apartment availability
  const apartments = inventory.map((inv: any) => {
    const aptId = inv.id;
    const totalUnits = inv.totalUnits || 1;

    // Count bookings overlapping the requested range
    const overlappingBookings = allBookings.filter(
      (b: any) =>
        b.apartmentId === aptId &&
        b.bookingStatus !== "cancelled" &&
        b.bookingStatus !== "checked_out" &&
        datesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
    );

    // Count specific blocks for this apartment
    const specificBlock = allBlocks.find(
      (b: any) => b.apartmentId === aptId && datesOverlap(b.startDate, b.endDate, checkIn, checkOut)
    );

    const occupiedByBookings = overlappingBookings.length;
    const blockedUnits = specificBlock ? totalUnits : 0; // full block = all units
    const occupiedUnits = Math.min(totalUnits, occupiedByBookings + blockedUnits);
    const availableUnits = Math.max(0, totalUnits - occupiedUnits);

    return {
      apartmentId: aptId,
      totalUnits,
      occupiedUnits,
      availableUnits,
      available: availableUnits > 0,
      blockReason: specificBlock?.reason || null
    };
  });

  if (apartmentId) {
    const specific = apartments.find(a => a.apartmentId === apartmentId);
    return {
      available: specific ? specific.available : true, // default available if no inventory set
      apartments: specific ? [specific] : []
    };
  }

  return {
    available: apartments.some(a => a.available) || apartments.length === 0,
    apartments
  };
}

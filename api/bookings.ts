import { Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { bookings, auditLogs } from "../src/db/schema.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalBookings(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.bookings || [];
    }
  } catch (e) {
    console.error("Failed to read local bookings:", e);
  }
  return [];
}

function writeLocalBookings(list: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      data.bookings = list;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local bookings:", e);
  }
}

export async function handleGetBookings(req: Request, res: Response) {
  try {
    if (isDbConfigured()) {
      const db = getDb();
      const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
      return res.status(200).json({ success: true, bookings: allBookings });
    }

    const local = readLocalBookings();
    return res.status(200).json({ success: true, bookings: local });
  } catch (err: any) {
    console.error("Error fetching bookings:", err);
    return res.status(500).json({ error: "Failed to fetch bookings: " + err.message });
  }
}

export async function handleCreateBooking(req: Request, res: Response) {
  try {
    const payload = req.body;
    if (!payload.apartmentId || !payload.guestName || !payload.checkIn || !payload.checkOut) {
      return res.status(400).json({ error: "Apartment ID, guest name, check-in, and check-out are required." });
    }

    const reference = "TV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      id: "bkg_" + Date.now(),
      bookingReference: reference,
      inquiryId: payload.inquiryId || null,
      apartmentId: payload.apartmentId,
      apartmentName: payload.apartmentName || "Luxury Apartment Suite",
      guestName: payload.guestName,
      guestEmail: payload.guestEmail || "",
      guestPhone: payload.guestPhone || "",
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      adults: payload.adults || 1,
      children: payload.children || 0,
      packageId: payload.packageId || null,
      packageName: payload.packageName || null,
      totalAmount: Number(payload.totalAmount) || 0,
      currency: payload.currency || "USD",
      paymentStatus: payload.paymentStatus || "unpaid",
      paymentMethod: payload.paymentMethod || null,
      bookingStatus: payload.bookingStatus || "confirmed",
      specialRequests: payload.specialRequests || null,
      staffNotes: payload.staffNotes || [],
      createdAt: new Date().toISOString()
    };

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(bookings).values(newBooking);

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: payload.actorName || "Staff",
        actorRole: payload.actorRole || "reservations",
        category: "Bookings",
        action: "Booking Created",
        details: `Created reservation ${newBooking.bookingReference} for ${newBooking.guestName} (${newBooking.checkIn} to ${newBooking.checkOut}).`,
        targetId: newBooking.id
      });
    } else {
      const local = readLocalBookings();
      local.unshift(newBooking);
      writeLocalBookings(local);
    }

    return res.status(201).json({ success: true, booking: newBooking });
  } catch (err: any) {
    console.error("Error creating booking:", err);
    return res.status(500).json({ error: "Failed to create booking: " + err.message });
  }
}

export async function handleUpdateBooking(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);
    const updates = req.body;

    if (isDbConfigured()) {
      const db = getDb();
      const existing = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Booking not found." });
      }

      await db.update(bookings).set(updates).where(eq(bookings.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Bookings",
        action: "Booking Updated",
        details: `Updated booking ${existing[0].bookingReference} (${updates.bookingStatus ? `Status: ${updates.bookingStatus}` : "Details modified"}).`,
        targetId: id
      });

      return res.status(200).json({ success: true, message: "Booking updated successfully." });
    }

    const local = readLocalBookings();
    const idx = local.findIndex((b: any) => b.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates };
      writeLocalBookings(local);
      return res.status(200).json({ success: true, message: "Booking updated successfully." });
    }

    return res.status(404).json({ error: "Booking not found." });
  } catch (err: any) {
    console.error("Error updating booking:", err);
    return res.status(500).json({ error: "Failed to update booking: " + err.message });
  }
}

export async function handleDeleteBooking(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);

    if (isDbConfigured()) {
      const db = getDb();
      await db.delete(bookings).where(eq(bookings.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Bookings",
        action: "Booking Deleted",
        details: `Deleted booking ID: ${id}.`,
        targetId: id
      });

      return res.status(200).json({ success: true, message: "Booking removed." });
    }

    let local = readLocalBookings();
    local = local.filter((b: any) => b.id !== id);
    writeLocalBookings(local);
    return res.status(200).json({ success: true, message: "Booking removed." });
  } catch (err: any) {
    console.error("Error deleting booking:", err);
    return res.status(500).json({ error: "Failed to delete booking: " + err.message });
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabaseSynced();
    const { method } = req;
    if (method === "GET") return handleGetBookings(req, res);
    if (method === "POST") return handleCreateBooking(req, res);
    if (method === "PUT") return handleUpdateBooking(req, res);
    if (method === "DELETE") return handleDeleteBooking(req, res);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("Bookings handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

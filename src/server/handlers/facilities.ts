import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../db/db.js";
import { facilities, auditLogs } from "../../db/schema.js";
import { FACILITIES as DEFAULT_FACILITIES } from "../../data.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalFacilities(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.settings?.facilities || DEFAULT_FACILITIES.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        iconName: f.iconName,
        image: f.image,
        details: f.details,
        isResidentOnly: f.id === "pools",
        operatingHours: "6:00 AM – 7:00 PM Daily",
        capacity: f.id === "conferences" ? 80 : 50,
        isActive: true
      }));
    }
  } catch (e) {
    console.error("Failed to read local facilities:", e);
  }
  return [];
}

function writeLocalFacilities(list: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      if (!data.settings) data.settings = {};
      data.settings.facilities = list;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local facilities:", e);
  }
}

export async function handleGetFacilities(req: Request, res: Response) {
  try {
    if (isDbConfigured()) {
      const db = getDb();
      const all = await db.select().from(facilities);
      if (all.length > 0) {
        return res.status(200).json({ success: true, facilities: all });
      }
    }
    const local = readLocalFacilities();
    return res.status(200).json({ success: true, facilities: local });
  } catch (err: any) {
    console.error("Error fetching facilities:", err);
    return res.status(500).json({ error: "Failed to fetch facilities: " + err.message });
  }
}

export async function handleCreateFacility(req: Request, res: Response) {
  try {
    const { name, description, iconName, image, details, isResidentOnly, operatingHours, capacity } = req.body;
    if (!name) return res.status(400).json({ error: "Facility name is required." });

    const newFacility = {
      id: req.body.id || "fac_" + Date.now(),
      name,
      description: description || "",
      iconName: iconName || "Waves",
      image: image || "https://media.tamarind.co.ke/tvl-website-assets/tamarind.drone--11.jpg",
      details: Array.isArray(details) ? details : [],
      isResidentOnly: Boolean(isResidentOnly),
      operatingHours: operatingHours || "6:00 AM – 8:00 PM Daily",
      capacity: Number(capacity) || 50,
      isActive: true
    };

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(facilities).values(newFacility);
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Facilities",
        action: "Facility Created",
        details: `Created resort facility: ${newFacility.name}.`,
        targetId: newFacility.id
      });
    } else {
      const local = readLocalFacilities();
      local.push(newFacility);
      writeLocalFacilities(local);
    }

    return res.status(201).json({ success: true, facility: newFacility });
  } catch (err: any) {
    console.error("Error creating facility:", err);
    return res.status(500).json({ error: "Failed to create facility: " + err.message });
  }
}

export async function handleUpdateFacility(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);
    const updates = req.body;

    if (isDbConfigured()) {
      const db = getDb();
      await db.update(facilities).set(updates).where(eq(facilities.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Facilities",
        action: "Facility Updated",
        details: `Updated resort facility ID: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Facility updated." });
    }

    const local = readLocalFacilities();
    const idx = local.findIndex((f: any) => f.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates };
      writeLocalFacilities(local);
      return res.status(200).json({ success: true, message: "Facility updated." });
    }

    return res.status(404).json({ error: "Facility not found." });
  } catch (err: any) {
    console.error("Error updating facility:", err);
    return res.status(500).json({ error: "Failed to update facility: " + err.message });
  }
}

export async function handleDeleteFacility(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);

    if (isDbConfigured()) {
      const db = getDb();
      await db.delete(facilities).where(eq(facilities.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Facilities",
        action: "Facility Deleted",
        details: `Deleted facility ID: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Facility deleted." });
    }

    let local = readLocalFacilities();
    local = local.filter((f: any) => f.id !== id);
    writeLocalFacilities(local);
    return res.status(200).json({ success: true, message: "Facility deleted." });
  } catch (err: any) {
    console.error("Error deleting facility:", err);
    return res.status(500).json({ error: "Failed to delete facility: " + err.message });
  }
}

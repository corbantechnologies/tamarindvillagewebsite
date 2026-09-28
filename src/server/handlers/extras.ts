import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../db/db.js";
import { extras, auditLogs } from "../../db/schema.js";
import { DEFAULT_TRANSFER_VEHICLES, DEFAULT_EVENT_PACKAGES } from "../../utils/extrasStore.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalExtras(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.settings?.extras || [
        ...DEFAULT_TRANSFER_VEHICLES.map(v => ({
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
        })),
        ...DEFAULT_EVENT_PACKAGES.map(ev => ({
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
        }))
      ];
    }
  } catch (e) {
    console.error("Failed to read local extras:", e);
  }
  return [];
}

function writeLocalExtras(list: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      if (!data.settings) data.settings = {};
      data.settings.extras = list;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local extras:", e);
  }
}

export async function handleGetExtras(req: Request, res: Response) {
  try {
    const { category } = req.query;
    if (isDbConfigured()) {
      const db = getDb();
      const all = await (category ? db.select().from(extras).where(eq(extras.category, String(category))) : db.select().from(extras));
      if (all.length > 0) {
        return res.status(200).json({ success: true, extras: all });
      }
    }
    let local = readLocalExtras();
    if (category) {
      local = local.filter((x: any) => x.category === category);
    }
    return res.status(200).json({ success: true, extras: local });
  } catch (err: any) {
    console.error("Error fetching extras:", err);
    return res.status(500).json({ error: "Failed to fetch extras: " + err.message });
  }
}

export async function handleCreateExtra(req: Request, res: Response) {
  try {
    const { name, category, description, priceUsd, priceKes, capacity, features, image } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: "Name and category are required." });
    }

    const newExtra = {
      id: req.body.id || "ext_" + Date.now(),
      category,
      name,
      description: description || "",
      priceUsd: Number(priceUsd) || 0,
      priceKes: Number(priceKes) || 0,
      capacity: Number(capacity) || 4,
      features: Array.isArray(features) ? features : [],
      image: image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
      isActive: true
    };

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(extras).values(newExtra);
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Extras",
        action: "Extra Created",
        details: `Created extra item: ${newExtra.name} (${newExtra.category}).`,
        targetId: newExtra.id
      });
    } else {
      const local = readLocalExtras();
      local.push(newExtra);
      writeLocalExtras(local);
    }

    return res.status(201).json({ success: true, extra: newExtra });
  } catch (err: any) {
    console.error("Error creating extra:", err);
    return res.status(500).json({ error: "Failed to create extra: " + err.message });
  }
}

export async function handleUpdateExtra(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);
    const updates = req.body;

    if (isDbConfigured()) {
      const db = getDb();
      await db.update(extras).set(updates).where(eq(extras.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Extras",
        action: "Extra Updated",
        details: `Updated extra item ID: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Extra updated." });
    }

    const local = readLocalExtras();
    const idx = local.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates };
      writeLocalExtras(local);
      return res.status(200).json({ success: true, message: "Extra updated." });
    }

    return res.status(404).json({ error: "Extra not found." });
  } catch (err: any) {
    console.error("Error updating extra:", err);
    return res.status(500).json({ error: "Failed to update extra: " + err.message });
  }
}

export async function handleDeleteExtra(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);

    if (isDbConfigured()) {
      const db = getDb();
      await db.delete(extras).where(eq(extras.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Extras",
        action: "Extra Deleted",
        details: `Deleted extra item ID: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Extra deleted." });
    }

    let local = readLocalExtras();
    local = local.filter((x: any) => x.id !== id);
    writeLocalExtras(local);
    return res.status(200).json({ success: true, message: "Extra deleted." });
  } catch (err: any) {
    console.error("Error deleting extra:", err);
    return res.status(500).json({ error: "Failed to delete extra: " + err.message });
  }
}

import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../src/db/db.js";
import { packages, auditLogs } from "../src/db/schema.js";
import { PACKAGES as DEFAULT_PACKAGES } from "../src/data.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalPackages(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.settings?.boarding_packages || DEFAULT_PACKAGES;
    }
  } catch (e) {
    console.error("Failed to read local packages:", e);
  }
  return DEFAULT_PACKAGES;
}

function writeLocalPackages(list: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      if (!data.settings) data.settings = {};
      data.settings.boarding_packages = list;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local packages:", e);
  }
}

export async function handleGetPackages(req: Request, res: Response) {
  try {
    if (isDbConfigured()) {
      const db = getDb();
      const all = await db.select().from(packages);
      if (all.length > 0) {
        return res.status(200).json({ success: true, packages: all });
      }
    }
    const local = readLocalPackages();
    return res.status(200).json({ success: true, packages: local });
  } catch (err: any) {
    console.error("Error fetching packages:", err);
    return res.status(500).json({ error: "Failed to fetch packages: " + err.message });
  }
}

export async function handleCreatePackage(req: Request, res: Response) {
  try {
    const { name, description, priceMarkupPercentage, pricePerPersonPerDay, highlights } = req.body;
    if (!name) return res.status(400).json({ error: "Package name is required." });

    const newPkg = {
      id: req.body.id || "pkg_" + Date.now(),
      name,
      description: description || "",
      priceMarkupPercentage: Number(priceMarkupPercentage) || 0,
      pricePerPersonPerDay: Number(pricePerPersonPerDay) || 0,
      highlights: Array.isArray(highlights) ? highlights : [],
      isActive: true
    };

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(packages).values(newPkg);
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Packages",
        action: "Package Created",
        details: `Created boarding package: ${newPkg.name}.`,
        targetId: newPkg.id
      });
    } else {
      const local = readLocalPackages();
      local.push(newPkg);
      writeLocalPackages(local);
    }

    return res.status(201).json({ success: true, package: newPkg });
  } catch (err: any) {
    console.error("Error creating package:", err);
    return res.status(500).json({ error: "Failed to create package: " + err.message });
  }
}

export async function handleUpdatePackage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConfigured()) {
      const db = getDb();
      await db.update(packages).set(updates).where(eq(packages.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Packages",
        action: "Package Updated",
        details: `Updated boarding package: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Package updated." });
    }

    const local = readLocalPackages();
    const idx = local.findIndex((p: any) => p.id === id);
    if (idx >= 0) {
      local[idx] = { ...local[idx], ...updates };
      writeLocalPackages(local);
      return res.status(200).json({ success: true, message: "Package updated." });
    }

    return res.status(404).json({ error: "Package not found." });
  } catch (err: any) {
    console.error("Error updating package:", err);
    return res.status(500).json({ error: "Failed to update package: " + err.message });
  }
}

export async function handleDeletePackage(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (isDbConfigured()) {
      const db = getDb();
      await db.delete(packages).where(eq(packages.id, id));
      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Staff",
        actorRole: req.body?.actorRole || "staff",
        category: "Packages",
        action: "Package Deleted",
        details: `Deleted boarding package ID: ${id}.`,
        targetId: id
      });
      return res.status(200).json({ success: true, message: "Package deleted." });
    }

    let local = readLocalPackages();
    local = local.filter((p: any) => p.id !== id);
    writeLocalPackages(local);
    return res.status(200).json({ success: true, message: "Package deleted." });
  } catch (err: any) {
    console.error("Error deleting package:", err);
    return res.status(500).json({ error: "Failed to delete package: " + err.message });
  }
}

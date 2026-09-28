import { Request, Response } from "express";
import { desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { auditLogs } from "../src/db/schema.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalLogs(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.settings?.audit_logs || [];
    }
  } catch (e) {
    console.error("Failed to read local audit logs:", e);
  }
  return [];
}

function writeLocalLogs(logs: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      if (!data.settings) data.settings = {};
      data.settings.audit_logs = logs;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local audit logs:", e);
  }
}

export async function handleGetAuditLogs(req: Request, res: Response) {
  try {
    if (isDbConfigured()) {
      const db = getDb();
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(200);
      return res.status(200).json({ success: true, logs });
    }

    const local = readLocalLogs();
    return res.status(200).json({ success: true, logs: local });
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({ error: "Failed to fetch audit logs: " + err.message });
  }
}

export async function handleCreateAuditLog(req: Request, res: Response) {
  try {
    const { actor, actorRole, category, action, details, targetId, metadata } = req.body;
    if (!action || !details) {
      return res.status(400).json({ error: "Action and details are required." });
    }

    const newLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: actor || "System",
      actorRole: actorRole || "system",
      category: category || "General",
      action,
      details,
      targetId: targetId || null,
      metadata: metadata || null
    };

    if (isDbConfigured()) {
      const db = getDb();
      await db.insert(auditLogs).values(newLog);
    } else {
      const local = readLocalLogs();
      local.unshift(newLog);
      if (local.length > 300) local.pop();
      writeLocalLogs(local);
    }

    return res.status(201).json({ success: true, log: newLog });
  } catch (err: any) {
    console.error("Error creating audit log:", err);
    return res.status(500).json({ error: "Failed to create audit log: " + err.message });
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabaseSynced();
    const { method } = req;
    if (method === "GET") return handleGetAuditLogs(req, res);
    if (method === "POST") return handleCreateAuditLog(req, res);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("Audit logs handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

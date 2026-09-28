import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { users, auditLogs } from "../src/db/schema.js";
import fs from "fs";
import path from "path";

const DATA_STORE_PATH = path.join(process.cwd(), "data_store.json");

function readLocalUsers(): any[] {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      return data.settings?.staff_users || [];
    }
  } catch (e) {
    console.error("Failed to read local store users:", e);
  }
  return [];
}

function writeLocalUsers(usersList: any[]) {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, "utf-8"));
      if (!data.settings) data.settings = {};
      data.settings.staff_users = usersList;
      fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to write local store users:", e);
  }
}

export async function handleGetStaff(req: Request, res: Response) {
  try {
    if (isDbConfigured()) {
      const db = getDb();
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin
      }).from(users);

      return res.status(200).json({ success: true, staff: allUsers });
    }

    const localUsers = readLocalUsers().map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active ?? true,
      createdAt: u.createdAt
    }));
    return res.status(200).json({ success: true, staff: localUsers });
  } catch (err: any) {
    console.error("Error fetching staff:", err);
    return res.status(500).json({ error: "Failed to fetch staff members: " + err.message });
  }
}

export async function handleCreateStaff(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validRoles = ["admin", "manager", "reservations", "reception"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const newUser = {
      id: "usr_" + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      active: true,
      createdAt: new Date().toISOString()
    };

    if (isDbConfigured()) {
      const db = getDb();
      // Check for existing email
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: "A staff member with this email already exists." });
      }

      await db.insert(users).values(newUser);

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Administrator",
        actorRole: "admin",
        category: "Staff Management",
        action: "User Created",
        details: `Created new staff account for ${newUser.name} with role ${role.toUpperCase()}.`,
        targetId: newUser.id
      });
    } else {
      const local = readLocalUsers();
      local.push(newUser);
      writeLocalUsers(local);
    }

    const { passwordHash, ...safeUser } = newUser;
    return res.status(201).json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error("Error creating staff:", err);
    return res.status(500).json({ error: "Failed to create staff member: " + err.message });
  }
}

export async function handleUpdateStaff(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);
    const { name, email, role, active, password } = req.body;

    if (isDbConfigured()) {
      const db = getDb();
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "Staff member not found." });
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = email.toLowerCase().trim();
      if (role !== undefined) updates.role = role;
      if (active !== undefined) updates.active = Boolean(active);
      if (password) updates.passwordHash = bcrypt.hashSync(password, 10);

      await db.update(users).set(updates).where(eq(users.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Administrator",
        actorRole: "admin",
        category: "Staff Management",
        action: "User Updated",
        details: `Updated details for staff member ID: ${id}.`,
        targetId: id
      });

      return res.status(200).json({ success: true, message: "Staff member updated." });
    }

    const local = readLocalUsers();
    const idx = local.findIndex((u: any) => u.id === id);
    if (idx >= 0) {
      if (name !== undefined) local[idx].name = name;
      if (email !== undefined) local[idx].email = email;
      if (role !== undefined) local[idx].role = role;
      if (active !== undefined) local[idx].active = active;
      if (password) local[idx].password = password;
      writeLocalUsers(local);
      return res.status(200).json({ success: true, message: "Staff member updated." });
    }

    return res.status(404).json({ error: "Staff member not found." });
  } catch (err: any) {
    console.error("Error updating staff:", err);
    return res.status(500).json({ error: "Failed to update staff member: " + err.message });
  }
}

export async function handleDeleteStaff(req: Request, res: Response) {
  try {
    const id = req.params?.id || (req.query?.id as string);

    if (id === "usr_admin_1" || id === "user_admin") {
      return res.status(400).json({ error: "The primary root administrator cannot be deleted." });
    }

    if (isDbConfigured()) {
      const db = getDb();
      await db.delete(users).where(eq(users.id, id));

      await db.insert(auditLogs).values({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        actor: req.body?.actorName || "Administrator",
        actorRole: "admin",
        category: "Staff Management",
        action: "User Deleted",
        details: `Deleted staff member account ID: ${id}.`,
        targetId: id
      });

      return res.status(200).json({ success: true, message: "Staff member removed." });
    }

    let local = readLocalUsers();
    local = local.filter((u: any) => u.id !== id);
    writeLocalUsers(local);
    return res.status(200).json({ success: true, message: "Staff member removed." });
  } catch (err: any) {
    console.error("Error deleting staff:", err);
    return res.status(500).json({ error: "Failed to delete staff member: " + err.message });
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabaseSynced();
    const { method } = req;
    if (method === "GET") return handleGetStaff(req, res);
    if (method === "POST") return handleCreateStaff(req, res);
    if (method === "PUT") return handleUpdateStaff(req, res);
    if (method === "DELETE") return handleDeleteStaff(req, res);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("Staff handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

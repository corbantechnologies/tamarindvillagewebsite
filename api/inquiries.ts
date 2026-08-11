import { getDb, isDbConfigured } from "../src/db/db";
import { ensureDatabaseSynced } from "../src/db/migrate";
import { inquiries as inquiriesTable } from "../src/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: any, res: any) {
  const { method } = req;
  try {
    await ensureDatabaseSynced();

    if (method === "GET") {
      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, inquiries: [] });
      }
      const db = getDb();
      const data = await db.select().from(inquiriesTable);
      // Order inquiries so newest show up first (defensively handling null/undefined timestamps)
      const sorted = [...data].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.status(200).json({ success: true, inquiries: sorted });
    } 
    
    else if (method === "POST") {
      const id = req.query.id;
      const action = req.query.action;
      
      if (action === "status" && id) {
        const { status } = req.body || {};
        if (!status) {
          return res.status(400).json({ error: "Status is required." });
        }

        if (!isDbConfigured()) {
          return res.status(400).json({ error: "Database not configured." });
        }

        const db = getDb();
        const updated = await db
          .update(inquiriesTable)
          .set({ status })
          .where(eq(inquiriesTable.id, id))
          .returning();
        
        if (updated.length === 0) {
          return res.status(404).json({ error: "Inquiry not found." });
        }
        return res.status(200).json({ success: true, inquiry: updated[0] });
      }

      return res.status(400).json({ error: "Invalid POST operation or parameters." });
    } 
    
    else if (method === "DELETE") {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: "Inquiry ID is required." });
      }

      if (!isDbConfigured()) {
        return res.status(400).json({ error: "Database not configured for deletion." });
      }

      const db = getDb();
      await db.delete(inquiriesTable).where(eq(inquiriesTable.id, id));
      return res.status(200).json({ success: true });
    } 
    
    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("Vercel API /api/inquiries failed, falling back to static:", err);
    if (method === "GET") {
      // Graceful fallback to empty array on failure
      return res.status(200).json({ 
        success: true, 
        inquiries: [], 
        database_error: err.message || "Database connection failed. Switched to offline mode." 
      });
    }
    return res.status(500).json({ error: `Database action failed: ${err.message || "Internal Error"}` });
  }
}

import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { inquiries as inquiriesTable } from "../src/db/schema.js";
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
        const { status, payload, staffNote } = req.body || {};
        if (!status && !payload && !staffNote) {
          return res.status(400).json({ error: "Status, payload, or staffNote is required." });
        }

        if (!isDbConfigured()) {
          return res.status(400).json({ error: "Database not configured." });
        }

        const db = getDb();
        const existing = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id));
        if (existing.length === 0) {
          return res.status(404).json({ error: "Inquiry not found." });
        }
        
        const current = existing[0];
        const updatedFields: any = {};
        if (status) updatedFields.status = status;
        
        const mergedPayload = { ...((current.payload as any) || {}) };
        mergedPayload.auditTrail = mergedPayload.auditTrail || [];

        if (status && status !== current.status) {
          mergedPayload.auditTrail.push({
            id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            actor: "staff",
            actorName: staffNote?.author || "Tamarind Reservations",
            action: `Status changed from "${current.status}" to "${status}"`,
            type: "status_change"
          });
        }

        if (payload) {
          if (payload.paymentLink && payload.paymentLink !== mergedPayload.paymentLink) {
            mergedPayload.auditTrail.push({
              id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toISOString(),
              actor: "staff",
              actorName: staffNote?.author || "Tamarind Reservations",
              action: `Direct payment link configured: ${payload.paymentLink}`,
              type: "payment_link"
            });
          }
          if (payload.totalCost && payload.totalCost !== mergedPayload.totalCost) {
            mergedPayload.auditTrail.push({
              id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toISOString(),
              actor: "staff",
              actorName: staffNote?.author || "Tamarind Reservations",
              action: `Agreed rate updated to $${payload.totalCost}`,
              type: "price_update"
            });
          }
          Object.assign(mergedPayload, payload);
        }

        if (staffNote) {
          mergedPayload.staffNotes = mergedPayload.staffNotes || [];
          mergedPayload.staffNotes.push({
            id: "note_" + Date.now(),
            author: staffNote.author || "Tamarind Reservations",
            text: staffNote.text,
            createdAt: new Date().toISOString()
          });
          mergedPayload.auditTrail.push({
            id: "audit_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
            actor: "staff",
            actorName: staffNote.author || "Tamarind Reservations",
            action: `Added negotiation note: "${staffNote.text}"`,
            type: "staff_note"
          });
        }
        if (!mergedPayload.guestToken) {
          mergedPayload.guestToken = "tv_guest_" + Math.random().toString(36).slice(2, 11);
        }
        updatedFields.payload = mergedPayload;

        const updated = await db
          .update(inquiriesTable)
          .set(updatedFields)
          .where(eq(inquiriesTable.id, id))
          .returning();
        
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

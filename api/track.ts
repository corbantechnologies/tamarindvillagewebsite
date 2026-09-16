import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { inquiries as inquiriesTable } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

function readLocalStore(): any {
  try {
    const storePath = path.join(process.cwd(), "data_store.json");
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read local store:", e);
  }
  return { inquiries: [] };
}

function writeLocalStore(data: any) {
  try {
    const storePath = path.join(process.cwd(), "data_store.json");
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local store:", e);
  }
}

export default async function handler(req: any, res: any) {
  const { method } = req;

  try {
    if (method === "GET") {
      const token = (req.query?.token as string || "").trim();
      if (!token) {
        return res.status(400).json({ error: "Booking reference or guest token is required." });
      }

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const inquiries = store.inquiries || [];
        const inq = inquiries.find((i: any) => i.id === token || i.payload?.guestToken === token);
        if (!inq) {
          return res.status(404).json({ error: "Reservation or inquiry not found." });
        }
        return res.status(200).json({ success: true, inquiry: inq });
      }

      await ensureDatabaseSynced();
      const db = getDb();
      const allInquiries = await db.select().from(inquiriesTable);
      const inq = allInquiries.find((i: any) => i.id === token || (i.payload as any)?.guestToken === token);

      if (!inq) {
        return res.status(404).json({ error: "Reservation or inquiry not found." });
      }

      return res.status(200).json({ success: true, inquiry: inq });
    }

    else if (method === "POST") {
      const { token, action, changeData, payment } = req.body || {};
      if (!token || !action) {
        return res.status(400).json({ error: "Token and action are required." });
      }

      if (!isDbConfigured()) {
        const store = readLocalStore();
        const inquiries = store.inquiries || [];
        const inq = inquiries.find((i: any) => i.id === token || i.payload?.guestToken === token);
        if (!inq) {
          return res.status(404).json({ error: "Reservation not found." });
        }

        inq.payload = inq.payload || {};
        inq.payload.staffNotes = inq.payload.staffNotes || [];

        if (action === "request_change" && changeData) {
          inq.payload.changeRequests = inq.payload.changeRequests || [];
          inq.payload.changeRequests.push(changeData);
          inq.status = "Reviewed";
          inq.payload.staffNotes.push({
            id: "note_" + Date.now(),
            author: "Guest Self-Service Portal",
            text: `[Guest Modification Request] Requested check-in: ${changeData.checkIn || "unchanged"}, check-out: ${changeData.checkOut || "unchanged"}, guests: ${changeData.guests}. Note: ${changeData.notes || "None"}`,
            createdAt: new Date().toISOString()
          });
        } else if (action === "record_payment" && payment) {
          inq.payload.paymentStatus = "deposit_paid";
          inq.payload.paymentDetails = payment;
          inq.payload.staffNotes.push({
            id: "note_" + Date.now(),
            author: "Guest Self-Service Portal",
            text: `[Guest Payment Recorded] Method: ${payment.method.toUpperCase()}, Ref: ${payment.reference}, Phone: ${payment.phoneNumber || "N/A"}. Staff verification requested.`,
            createdAt: new Date().toISOString()
          });
        }

        writeLocalStore(store);
        return res.status(200).json({ success: true, inquiry: inq });
      }

      await ensureDatabaseSynced();
      const db = getDb();
      const allInquiries = await db.select().from(inquiriesTable);
      const inq = allInquiries.find((i: any) => i.id === token || (i.payload as any)?.guestToken === token);

      if (!inq) {
        return res.status(404).json({ error: "Reservation not found." });
      }

      const mergedPayload = { ...((inq.payload as any) || {}) };
      mergedPayload.staffNotes = mergedPayload.staffNotes || [];
      let newStatus = inq.status;

      if (action === "request_change" && changeData) {
        mergedPayload.changeRequests = mergedPayload.changeRequests || [];
        mergedPayload.changeRequests.push(changeData);
        newStatus = "Reviewed";
        mergedPayload.staffNotes.push({
          id: "note_" + Date.now(),
          author: "Guest Self-Service Portal",
          text: `[Guest Modification Request] Requested check-in: ${changeData.checkIn || "unchanged"}, check-out: ${changeData.checkOut || "unchanged"}, guests: ${changeData.guests}. Note: ${changeData.notes || "None"}`,
          createdAt: new Date().toISOString()
        });
      } else if (action === "record_payment" && payment) {
        mergedPayload.paymentStatus = "deposit_paid";
        mergedPayload.paymentDetails = payment;
        mergedPayload.staffNotes.push({
          id: "note_" + Date.now(),
          author: "Guest Self-Service Portal",
          text: `[Guest Payment Recorded] Method: ${payment.method.toUpperCase()}, Ref: ${payment.reference}, Phone: ${payment.phoneNumber || "N/A"}. Staff verification requested.`,
          createdAt: new Date().toISOString()
        });
      }

      const updated = await db
        .update(inquiriesTable)
        .set({ payload: mergedPayload, status: newStatus })
        .where(eq(inquiriesTable.id, inq.id))
        .returning();

      return res.status(200).json({ success: true, inquiry: updated[0] });
    }

    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("API /api/track failed:", err);
    return res.status(500).json({ error: `Server error: ${err.message || "Internal Server Error"}` });
  }
}

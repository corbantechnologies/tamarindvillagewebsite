import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { pricingRules as pricingRulesTable } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const DEFAULT_PRICING = {
  markupMultiplier: 1.0,
  taxRate: 8,
  seasonalFactor: "regular"
};

export default async function handler(req: any, res: any) {
  const { method } = req;
  try {
    await ensureDatabaseSynced();

    if (method === "GET") {
      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, pricing: DEFAULT_PRICING });
      }
      const db = getDb();
      const data = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.id, "default"));
      const pricing = data[0] || DEFAULT_PRICING;
      return res.status(200).json({ success: true, pricing });
    } 
    
    else if (method === "POST") {
      const { pricing: pricingBody } = req.body || {};
      if (!pricingBody) {
        return res.status(400).json({ error: "Pricing rules object required." });
      }

      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, pricing: {
          markupMultiplier: pricingBody.markupMultiplier ?? 1.0,
          taxRate: pricingBody.taxRate ?? 8,
          seasonalFactor: pricingBody.seasonalFactor ?? "regular",
        }});
      }

      const db = getDb();
      await db.insert(pricingRulesTable).values({
        id: "default",
        markupMultiplier: pricingBody.markupMultiplier ?? 1.0,
        taxRate: pricingBody.taxRate ?? 8,
        seasonalFactor: pricingBody.seasonalFactor ?? "regular",
      }).onConflictDoUpdate({
        target: pricingRulesTable.id,
        set: {
          markupMultiplier: pricingBody.markupMultiplier,
          taxRate: pricingBody.taxRate,
          seasonalFactor: pricingBody.seasonalFactor,
        }
      });
      const data = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.id, "default"));
      return res.status(200).json({ success: true, pricing: data[0] });
    } 
    
    else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("Vercel API /api/pricing failed, falling back to static:", err);
    if (method === "GET") {
      // Graceful fallback to static pricing rules on failure
      return res.status(200).json({ 
        success: true, 
        pricing: DEFAULT_PRICING, 
        database_error: err.message || "Database connection failed. Switched to offline mode." 
      });
    }
    return res.status(500).json({ error: `Database action failed: ${err.message || "Internal Error"}` });
  }
}

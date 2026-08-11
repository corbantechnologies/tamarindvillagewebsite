import { getDb, isDbConfigured } from "../src/db/db";
import { diningOptions as diningOptionsTable } from "../src/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_DINING = [
  {
    id: "tamarind-restaurant",
    name: "Tamarind Mombasa Restaurant",
    description: "Widely acclaimed as the finest seafood restaurant in East Africa. Built in elegant Moorish style overlooking the picturesque Tudor Creek, the restaurant features high-arched windows, high ceilings, and a massive copper-domed bar. We serve fresh, marine catches brought in daily by local fishermen, prepared with traditional Swahili seasonings and classic French culinary mastery.",
    highlights: [
      "Famous Jumbo Seafood Platter (lobster, crab, prawns, oysters, and local fish)",
      "Traditional Swahili Fish in rich coconut sauce (Samaki wa Kupaka)",
      "Live piano accompaniment and ambient coastal acoustics",
      "Premium selection of international wines curated by our resident sommelier"
    ],
    hours: "12:00 PM – 11:00 PM Daily",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399230/PXL_20260721_145415867_zlb785.jpg",
    reservationLinkText: "Inquire for Restaurant Table"
  },
  {
    id: "dawa-terrace",
    name: "The Dawa Terrace",
    description: "Named after Kenya's legendary 'Dawa' (meaning 'medicine') cocktail muddled with fresh lime and honey. This stylish open-air terrace bar extends right over the gentle waters of the creek. It features plush comfortable seating, soft ambient lighting, and is the premier sunset cocktail lounge on Mombasa's coast.",
    highlights: [
      "The Original 'Dawa' cocktail made with local vodka, fresh lime, and organic honey",
      "Delicious tapas, coastal snacks, and wood-fired flatbreads",
      "Laid-back deep house and coastal chill music played by live DJs on weekends",
      "Breathtaking night views of the lit-up old town of Mombasa across the bay"
    ],
    hours: "4:00 PM – Midnight Daily",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785844619/PXL_20260731_125648811_cnkxww.jpg",
    reservationLinkText: "Inquire for Dawa Terrace Table"
  },
  {
    id: "tamarind-dhow",
    name: "The Tamarind Dhow Cruise",
    description: "An unforgettable, magical dining voyage. Climb aboard the 'Nawalikoni' or 'Babulkher'—two majestic, traditionally hand-crafted wooden Swahili sailing dhows, beautifully converted into luxurious floating restaurants. Under the sails, you will cruise past Mombasa's historical Fort Jesus and Mombasa Old Harbor while enjoying a freshly grilled multi-course seafood meal prepared on traditional charcoal grills.",
    highlights: [
      "4-Course candlelit seafood feast cooked fresh on board over charcoal braziers",
      "Romantic cruise on Tudor Creek, Mombasa Harbor, and around Fort Jesus",
      "Live Swahili, Afro-fusion, and jazz band playing dance-worthy tunes on board",
      "The perfect setting for anniversaries, proposals, or unforgettable group celebrations"
    ],
    hours: "Lunch Cruise: 1:00 PM – 3:00 PM | Dinner Cruise: 6:30 PM – 10:30 PM",
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1782898889/v5_albvc2.jpg",
    reservationLinkText: "Inquire for Dhow Charter & Cruise"
  }
];

export default async function handler(req: any, res: any) {
  try {
    const { method } = req;

    if (method === "GET") {
      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, dining: DEFAULT_DINING });
      }
      const db = getDb();
      const data = await db.select().from(diningOptionsTable);
      return res.status(200).json({ success: true, dining: data });
    } 
    
    else if (method === "POST") {
      const { dining: diningBody } = req.body || {};
      if (!Array.isArray(diningBody)) {
        return res.status(400).json({ error: "Dining experiences must be an array." });
      }

      if (!isDbConfigured()) {
        return res.status(400).json({ error: "Database not configured for updates." });
      }

      const db = getDb();
      for (const dine of diningBody) {
        await db.insert(diningOptionsTable).values({
          id: dine.id,
          name: dine.name || "Unnamed Venue",
          description: dine.description || "",
          highlights: dine.highlights || [],
          hours: dine.hours || "Open Daily",
          image: dine.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
          reservationLinkText: dine.reservationLinkText || "Inquire Table",
        }).onConflictDoUpdate({
          target: diningOptionsTable.id,
          set: {
            name: dine.name || "Unnamed Venue",
            description: dine.description || "",
            highlights: dine.highlights || [],
            hours: dine.hours || "Open Daily",
            image: dine.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            reservationLinkText: dine.reservationLinkText || "Inquire Table",
          }
        });
      }
      const data = await db.select().from(diningOptionsTable);
      return res.status(200).json({ success: true, dining: data });
    } 
    
    else if (method === "DELETE") {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: "Dining option ID is required." });
      }

      if (!isDbConfigured()) {
        return res.status(400).json({ error: "Database not configured for deletion." });
      }

      const db = getDb();
      await db.delete(diningOptionsTable).where(eq(diningOptionsTable.id, id));
      return res.status(200).json({ success: true });
    } 
    
    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("Vercel API /api/dining failed:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}

import { getDb, isDbConfigured } from "../src/db/db.js";
import { ensureDatabaseSynced } from "../src/db/migrate.js";
import { apartments as apartmentsTable } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const DEFAULT_APARTMENTS = [
  {
    id: "1-bedroom",
    name: "Luxury 1-Bedroom Apartment",
    description: "Perfect for couples, executive business travelers, or solo adventurers looking for a serene coastal getaway. This spacious suite features an air-conditioned master bedroom with a handcrafted Swahili four-poster canopy bed, a deluxe en-suite bathroom, and an expansive living area.",
    size: "95 m²",
    maxGuests: 2,
    pricePerNight: 160,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677149/5_mhngcs.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677148/4_j84vps.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783677147/2_jkcobb.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Air conditioning",
      "Fully equipped granite-top kitchen",
      "Private sea-facing veranda",
      "Flat-screen TV with DSTV channels",
      "Electronic room safe",
      "Daily housekeeping & turndown",
      "Premium bath amenities & robes",
      "Coffee & tea making facilities"
    ],
    bedrooms: 1,
    bathrooms: 1,
    highlights: [
      "Handcrafted Swahili woodwork and arabesque detailing",
      "Sweeping views of Tudor Creek and Mombasa harbor",
      "Private veranda ideal for breakfast and evening sunsets",
      "Fully self-catering capable with modern premium appliances"
    ],
    bedConfig: "1 King-sized Swahili Canopy Bed",
    viewType: "Direct Tudor Creek & Sea View"
  },
  {
    id: "2-bedroom",
    name: "2-Bedroom Apartment",
    description: "Ideal for families or friends traveling together, this exceptionally spacious residence seamlessly combines Swahili elegance with modern comfort. It features two fully air-conditioned bedrooms, a magnificent living room, a dining area, and an extra-large private balcony.",
    size: "145 m²",
    maxGuests: 4,
    pricePerNight: 240,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783683956/3_y4yy1f.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399444/IMG-20260728-WA0067_zddl3j.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399619/IMG-20260728-WA0082_sgufrn.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399453/IMG-20260728-WA0072_dyahqk.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Individual climate control in both bedrooms",
      "Full modern kitchen with laundry facilities",
      "Double-width oceanfront veranda",
      "Multiple flat-screen TVs with premium DSTV",
      "Personal safety deposit box",
      "Daily housekeeping & room service",
      "Separate living and dining areas",
      "Luxury cotton bathrobes & slippers"
    ],
    bedrooms: 2,
    bathrooms: 2,
    highlights: [
      "Perfect for families; child-friendly, secure layout",
      "Direct views overlooking the sparkling resort pools and the creek",
      "Gourmet kitchen complete with full-sized refrigerator, oven, and washer",
      "Master en-suite bathroom with custom glass shower and Swahili vanity"
    ],
    bedConfig: "1 King Bed & 2 Twin Beds (can be merged)",
    viewType: "Resort Pool & Harbor View"
  },
  {
    id: "3-bedroom",
    name: "3-Bedroom Apartment",
    description: "The ultimate expression of coastal luxury. This palatial apartment boasts double-height vaulted ceilings, three gorgeous bedrooms, multiple sun-drenched private balconies, and an elite dining lounge. Rich mahogany spiral stairs, deep Swahili timber detailing, and grand direct-ocean verandas create an air of absolute exclusivity and luxury.",
    size: "220 m²",
    maxGuests: 6,
    pricePerNight: 350,
    image: "https://res.cloudinary.com/dhw8kulj3/image/upload/v1783685440/11_te7vun.jpg",
    gallery: [
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399398/IMG-20260728-WA0056_npidaf.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399397/IMG-20260728-WA0054_yiazz1.jpg",
      "https://res.cloudinary.com/dhw8kulj3/image/upload/v1785399396/IMG-20260728-WA0053_vplcb1.jpg"
    ],
    amenities: [
      "High-speed Wi-Fi",
      "Full house air-conditioning with individual zones",
      "Ultra-modern kitchen with premium culinary wear",
      "Rooftop sun terrace & private dining area",
      "Smart TVs with premium DSTV & streaming capabilities",
      "In-suite laundry (washing machine & dryer)",
      "Dedicated concierge service",
      "Luxury bathtubs & rainfall showers",
      "Complimentary airport transfers"
    ],
    bedrooms: 3,
    bathrooms: 3.5,
    highlights: [
      "Spectacular 270-degree panoramic views of Mombasa Old Town and Tudor Creek",
      "Bespoke multilevel architecture featuring rich mahogany spiral stairs",
      "Exclusive private rooftop terrace with loungers and outdoor dining table",
      "Dedicated chef available upon request for private dining events"
    ],
    bedConfig: "2 King Beds & 2 Twin Beds",
    viewType: "360° Creek, Ocean & Old Town Panoramic View"
  }
];

export default async function handler(req: any, res: any) {
  const { method } = req;
  try {
    await ensureDatabaseSynced();

    if (method === "GET") {
      if (!isDbConfigured()) {
        return res.status(200).json({ success: true, apartments: DEFAULT_APARTMENTS });
      }
      const db = getDb();
      const data = await db.select().from(apartmentsTable);
      return res.status(200).json({ success: true, apartments: data });
    } 
    
    else if (method === "POST") {
      const { apartments: aptsBody } = req.body || {};
      if (!Array.isArray(aptsBody)) {
        return res.status(400).json({ error: "Apartments must be an array." });
      }

      if (!isDbConfigured()) {
        return res.status(400).json({ error: "Database not configured for updates." });
      }

      const db = getDb();
      for (const apt of aptsBody) {
        await db.insert(apartmentsTable).values({
          id: apt.id,
          name: apt.name || "Unnamed Suite",
          description: apt.description || "",
          size: apt.size || "85 m²",
          maxGuests: Number(apt.maxGuests) || 2,
          pricePerNight: Number(apt.pricePerNight) || 100,
          image: apt.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
          gallery: apt.gallery || [],
          amenities: apt.amenities || [],
          bedrooms: Number(apt.bedrooms) || 1,
          bathrooms: Number(apt.bathrooms) || 1.0,
          highlights: apt.highlights || [],
          bedConfig: apt.bedConfig || "",
          viewType: apt.viewType || "",
        }).onConflictDoUpdate({
          target: apartmentsTable.id,
          set: {
            name: apt.name || "Unnamed Suite",
            description: apt.description || "",
            size: apt.size || "85 m²",
            maxGuests: Number(apt.maxGuests) || 2,
            pricePerNight: Number(apt.pricePerNight) || 100,
            image: apt.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
            gallery: apt.gallery || [],
            amenities: apt.amenities || [],
            bedrooms: Number(apt.bedrooms) || 1,
            bathrooms: Number(apt.bathrooms) || 1.0,
            highlights: apt.highlights || [],
            bedConfig: apt.bedConfig || "",
            viewType: apt.viewType || "",
          }
        });
      }
      const data = await db.select().from(apartmentsTable);
      return res.status(200).json({ success: true, apartments: data });
    } 
    
    else if (method === "DELETE") {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: "Apartment ID is required." });
      }

      if (!isDbConfigured()) {
        return res.status(400).json({ error: "Database not configured for deletion." });
      }

      const db = getDb();
      await db.delete(apartmentsTable).where(eq(apartmentsTable.id, id));
      return res.status(200).json({ success: true });
    } 
    
    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (err: any) {
    console.error("Vercel API /api/apartments failed, falling back to static:", err);
    if (method === "GET") {
      // Graceful fallback to static data in case of any database/connection error
      return res.status(200).json({ 
        success: true, 
        apartments: DEFAULT_APARTMENTS, 
        database_error: err.message || "Database connection failed. Switched to offline mode." 
      });
    }
    return res.status(500).json({ error: `Database action failed: ${err.message || "Internal Error"}` });
  }
}

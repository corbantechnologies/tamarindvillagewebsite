import { pgTable, text, integer, doublePrecision, jsonb, boolean } from "drizzle-orm/pg-core";

// ==========================================
// 1. STAFF USERS & AUTHENTICATION
// ==========================================
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // "admin" | "manager" | "reservations" | "reception"
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  lastLogin: text("last_login"),
});

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// ==========================================
// 2. APARTMENTS / ACCOMMODATION
// ==========================================
export const apartments = pgTable("apartments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  size: text("size").notNull(),
  maxGuests: integer("max_guests").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  image: text("image").notNull(),
  gallery: jsonb("gallery").$type<string[]>().notNull(),
  amenities: jsonb("amenities").$type<string[]>().notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: doublePrecision("bathrooms").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  bedConfig: text("bed_config").notNull(),
  viewType: text("view_type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ==========================================
// 3. DINING & DHOW EXPERIENCES
// ==========================================
export const diningOptions = pgTable("dining_options", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  hours: text("hours").notNull(),
  image: text("image").notNull(),
  reservationLinkText: text("reservation_link_text").notNull(),
  maxCapacity: integer("max_capacity").default(100),
  isActive: boolean("is_active").notNull().default(true),
});

// ==========================================
// 4. BOARDING PACKAGES (MEAL PLANS)
// ==========================================
export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceMarkupPercentage: doublePrecision("price_markup_percentage").notNull().default(0),
  pricePerPersonPerDay: doublePrecision("price_per_person_per_day").notNull().default(0),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ==========================================
// 5. EXTRAS (TRANSFER FLEET & CHARTERS)
// ==========================================
export const extras = pgTable("extras", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // "transfer" | "charter" | "amenity" | "event"
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceUsd: doublePrecision("price_usd").notNull().default(0),
  priceKes: doublePrecision("price_kes").notNull().default(0),
  capacity: integer("capacity").default(4),
  features: jsonb("features").$type<string[]>().notNull(),
  image: text("image").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// ==========================================
// 6. RESORT FACILITIES & CONFERENCES
// ==========================================
export const facilities = pgTable("facilities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  image: text("image").notNull(),
  details: jsonb("details").$type<string[]>().notNull(),
  isResidentOnly: boolean("is_resident_only").notNull().default(false),
  operatingHours: text("operating_hours"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").notNull().default(true),
});

// ==========================================
// 7. PRICING RULES & TAX SETTINGS
// ==========================================
export const pricingRules = pgTable("pricing_rules", {
  id: text("id").primaryKey(), // "default"
  markupMultiplier: doublePrecision("markup_multiplier").notNull(),
  taxRate: integer("tax_rate").notNull(),
  seasonalFactor: text("seasonal_factor").notNull(),
});

// ==========================================
// 8. INQUIRIES & LEAD PIPELINE
// ==========================================
export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: text("created_at").notNull(),
});

// ==========================================
// 9. BOOKINGS & IN-HOUSE GUESTS
// ==========================================
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  bookingReference: text("booking_reference").notNull().unique(),
  inquiryId: text("inquiry_id"),
  apartmentId: text("apartment_id").notNull(),
  apartmentName: text("apartment_name").notNull(),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  adults: integer("adults").notNull().default(1),
  children: integer("children").notNull().default(0),
  packageId: text("package_id"),
  packageName: text("package_name"),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // "unpaid" | "deposit_paid" | "paid" | "refunded"
  paymentMethod: text("payment_method"), // "paystack" | "mpesa" | "card" | "bank_transfer" | "cash"
  bookingStatus: text("booking_status").notNull().default("confirmed"), // "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show"
  specialRequests: text("special_requests"),
  staffNotes: jsonb("staff_notes").$type<any[]>(),
  createdAt: text("created_at").notNull(),
});

// ==========================================
// 10. SYSTEM AUDIT & ACTIVITY LOGS
// ==========================================
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  actorRole: text("actor_role").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
});

// ==========================================
// 11. GLOBAL SYSTEM SETTINGS
// ==========================================
export const globalSettings = pgTable("global_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

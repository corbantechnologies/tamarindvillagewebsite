import { pgTable, text, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";

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
});

export const diningOptions = pgTable("dining_options", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull(),
  hours: text("hours").notNull(),
  image: text("image").notNull(),
  reservationLinkText: text("reservation_link_text").notNull(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: text("id").primaryKey(), // "default"
  markupMultiplier: doublePrecision("markup_multiplier").notNull(),
  taxRate: integer("tax_rate").notNull(),
  seasonalFactor: text("seasonal_factor").notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: text("created_at").notNull(),
});

export const globalSettings = pgTable("global_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});


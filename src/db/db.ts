import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function getDb() {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required but not defined.");
    }
    
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") || databaseUrl.includes("::1");
    const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production";
    clientInstance = postgres(databaseUrl, {
      max: isServerless ? 2 : 10,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    dbInstance = drizzle(clientInstance, { schema });
  }
  return dbInstance;
}

export function getClient() {
  if (!clientInstance) {
    getDb();
  }
  return clientInstance!;
}


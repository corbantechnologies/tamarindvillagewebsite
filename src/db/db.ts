import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let poolInstance: pg.Pool | null = null;

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function getDb() {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required but not defined.");
    }
    
    // Configure pool with a connection timeout and max connections
    poolInstance = new pg.Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle database client:", err);
    });

    dbInstance = drizzle(poolInstance, { schema });
  }
  return dbInstance;
}

export function getPool() {
  if (!poolInstance) {
    getDb();
  }
  return poolInstance!;
}

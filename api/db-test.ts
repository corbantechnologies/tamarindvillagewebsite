import { getDb, isDbConfigured, getPool } from "../src/db/db";

export default async function handler(req: any, res: any) {
  try {
    const isConfigured = isDbConfigured();
    const rawUrl = process.env.DATABASE_URL || "";
    const maskedUrl = rawUrl 
      ? rawUrl.replace(/:([^:@]+)@/, ":******@") // Mask password
      : "not defined";

    if (!isConfigured) {
      return res.status(200).json({
        success: false,
        message: "DATABASE_URL is not configured in process.env",
        maskedUrl
      });
    }

    // Try a direct pool query first (raw pg)
    const pool = getPool();
    let pgResult: any = null;
    let pgError: any = null;
    
    try {
      const start = Date.now();
      const resQuery = await pool.query("SELECT 1 as test_val");
      const duration = Date.now() - start;
      pgResult = {
        rows: resQuery.rows,
        durationMs: duration
      };
    } catch (err: any) {
      pgError = {
        message: err.message,
        code: err.code,
        stack: err.stack
      };
    }

    // Try drizzle select
    let drizzleResult: any = null;
    let drizzleError: any = null;
    try {
      const db = getDb();
      // Try to query schema if possible, or just a raw sql helper
      const start = Date.now();
      const result = await db.execute("SELECT 1 + 1 as addition");
      const duration = Date.now() - start;
      drizzleResult = {
        rows: result.rows,
        durationMs: duration
      };
    } catch (err: any) {
      drizzleError = {
        message: err.message,
        stack: err.stack
      };
    }

    return res.status(200).json({
      success: pgError === null && drizzleError === null,
      environment: {
        isConfigured,
        maskedUrl,
        nodeVersion: process.version,
        platform: process.platform,
      },
      pg: {
        result: pgResult,
        error: pgError
      },
      drizzle: {
        result: drizzleResult,
        error: drizzleError
      }
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}

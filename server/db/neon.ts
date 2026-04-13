/**
 * Neon PostgreSQL Connection Pool
 * Replaces @supabase/supabase-js as the database client.
 *
 * Usage:
 *   import { query } from './neon.js';
 *   const result = await query('SELECT * FROM farms WHERE farmer_id = $1', [farmerId]);
 */

import { Pool, QueryResult } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  const connectionString = process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Missing NEON_DATABASE_URL environment variable. " +
        "Please add it to your .env file.",
    );
  }

  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for Neon
    max: 10, // Max connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Timeout new connections after 10s
  });

  _pool.on("error", (err) => {
    console.error("[Neon] Unexpected pool error:", err.message);
  });

  _pool.on("connect", () => {
    console.log("[Neon] New client connected to Neon PostgreSQL");
  });

  return _pool;
}

/**
 * Execute a parameterized SQL query.
 * @param text - SQL query string with $1, $2, ... placeholders
 * @param params - Array of parameter values
 */
export async function query(
  text: string,
  params?: any[],
): Promise<QueryResult> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`[Neon] Slow query (${duration}ms): ${text.slice(0, 100)}`);
    }

    return result;
  } catch (error: any) {
    console.error("[Neon] Query error:", {
      query: text.slice(0, 200),
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions.
 * Always release() the client in a finally block.
 */
export async function getClient() {
  return getPool().connect();
}

/**
 * Execute a function inside a transaction.
 */
export async function withTransaction<T>(
  fn: (client: Awaited<ReturnType<typeof getClient>>) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default { query, getClient, withTransaction };


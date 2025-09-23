import { Pool } from "pg"

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10s
  keepAlive: true, // Mantener conexión viva si el proveedor lo permite
})

pool.on("error", (err: any) => {
  console.error("Unexpected error on idle client", err)
})

export default pool

// Database query helper
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  let client
  try {
    client = await pool.connect()
    const res = await client.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

// ✅ Safe query helper (con reintentos automáticos)
export async function safeQuery(
  text: string,
  params?: any[],
  retries: number = 2
) {
  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await query(text, params)
    } catch (error: any) {
      lastError = error
      console.warn(`Query attempt ${attempt} failed:`, error.message)
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 500)) // pequeño delay antes de reintentar
      }
    }
  }
  throw lastError
}

// Transaction helper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

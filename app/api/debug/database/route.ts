import { NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await query("SELECT NOW() as current_time, version() as postgres_version")

    // Check if admin user exists
    const adminCheck = await query(
      "SELECT id, usuario, rol, password_hashhash, fecha_creacion FROM usuarios_internos WHERE usuario = $1",
      ["admin"],
    )

    // Check tables exist
    const tablesCheck = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuarios_internos', 'clientes', 'codigos', 'participaciones', 'sedes')
      ORDER BY table_name
    `)

    return NextResponse.json({
      database: {
        connected: true,
        currentTime: connectionTest.rows[0]?.current_time,
        version: connectionTest.rows[0]?.postgres_version,
      },
      admin: {
        exists: adminCheck.rows.length > 0,
        data: adminCheck.rows[0] || null,
      },
      tables: {
        count: tablesCheck.rows.length,
        list: tablesCheck.rows,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

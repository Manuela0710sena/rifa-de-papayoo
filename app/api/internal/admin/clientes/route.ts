import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { query } from "@/lib/database"
import { logError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    console.log("[v1] Clientes GET request started")

    // Verificar token de admin
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") {
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    // Parámetros de query
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const search = searchParams.get("search") || ""
    const sedeId = searchParams.get("sede_id")
    const offset = (page - 1) * limit

    // Construir condiciones WHERE
    const whereConditions: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(
        `(c.nombre ILIKE $${paramIndex} OR c.apellidos ILIKE $${paramIndex} OR c.correo ILIKE $${paramIndex})`
      )
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (sedeId) {
      whereConditions.push(`c.sede_id = $${paramIndex}`)
      queryParams.push(Number.parseInt(sedeId))
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Consulta de clientes con códigos agrupados
    const clientsQuery = `
      SELECT 
        c.id,
        c.nombre || ' ' || c.apellidos AS nombre,
        c.correo,
        c.telefono,
        s.nombre AS sede,
        COALESCE(ARRAY_AGG(p.numero_rifa) FILTER (WHERE p.numero_rifa IS NOT NULL), '{}') AS codigos,
        c.fecha_registro
      FROM clientes c
      LEFT JOIN sedes s ON c.sede_id = s.id
      LEFT JOIN participaciones p ON c.id = p.cliente_id
      ${whereClause}
      GROUP BY c.id, c.nombre, c.apellidos, c.correo, c.telefono, s.nombre, c.fecha_registro
      ORDER BY c.fecha_registro DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)
    const clientsResult = await query(clientsQuery, queryParams)

    // Conteo total de clientes
    const countQuery = `
      SELECT COUNT(*) as total
      FROM clientes c
      LEFT JOIN sedes s ON c.sede_id = s.id
      ${whereClause}
    `
    const countResult = await query(countQuery, queryParams.slice(0, -2))
    const total = Number(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    // Mapear resultado
    const clientes = clientsResult.rows.map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      correo: row.correo,
      telefono: row.telefono,
      sede: row.sede,
      codigos: row.codigos as string[],
      fecha_registro: row.fecha_registro,
    }))

    return NextResponse.json({
      clientes,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.error("[v1] Error fetching clients:", error)
    logError("Error fetching clients", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

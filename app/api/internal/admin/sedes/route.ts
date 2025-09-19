import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { sedeSchema } from "@/lib/validation"
import { query } from "@/lib/database"
import { logError, logInfo } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Sedes GET request started")

    // Verify admin token
    const token = extractToken(request)
    if (!token) {
      console.log("[v0] No token provided")
      return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") {
      console.log("[v0] Invalid token type:", decoded.type)
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    console.log("[v0] Token verified, fetching sedes")

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get("onlyActive") === "true"

    const whereClause = onlyActive ? "WHERE estado = 'activa'" : ""

    console.log("[v0] Executing sedes query with whereClause:", whereClause)

    const sedesResult = await query(`
      SELECT id, nombre, ciudad, direccion, estado, fecha_creacion
      FROM sedes 
      ${whereClause}
      ORDER BY nombre
    `)

    console.log("[v0] Sedes query result:", { rowCount: sedesResult.rows.length })

    return NextResponse.json({
      success: true,
      sedes: sedesResult.rows,
    })
  } catch (error) {
    console.error("[v0] Error in sedes GET:", error)
    logError("Error fetching sedes", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Sedes POST request started")

    // Verify admin token
    const token = extractToken(request)
    if (!token) {
      console.log("[v0] No token provided")
      return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") {
      console.log("[v0] Invalid token type:", decoded.type)
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log("[v0] Request body:", body)

    const validationResult = sedeSchema.safeParse(body)

    if (!validationResult.success) {
      console.log("[v0] Validation failed:", validationResult.error.errors)
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { nombre, ciudad, direccion } = validationResult.data
    console.log("[v0] Creating sede with data:", { nombre, ciudad, direccion })

    // Create new sede
    const result = await query("INSERT INTO sedes (nombre, ciudad, direccion) VALUES ($1, $2, $3) RETURNING *", [
      nombre,
      ciudad,
      direccion || null,
    ])

    const newSede = result.rows[0]
    console.log("[v0] Sede created successfully:", newSede)

    logInfo("Sede created", {
      sede_id: newSede.id,
      nombre,
      ciudad,
      admin_id: decoded.adminId,
    })

    return NextResponse.json({
      success: true,
      sede: newSede,
    })
  } catch (error) {
    console.error("[v0] Error in sedes POST:", error)
    logError("Error creating sede", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

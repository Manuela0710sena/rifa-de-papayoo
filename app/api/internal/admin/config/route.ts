import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { query } from "@/lib/database"
import { logError, logInfo } from "@/lib/logger"
import { z } from "zod"

const configUpdateSchema = z.object({
  estado: z.enum(["activa", "pausada", "cerrada"]),
})

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") {
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    // Get current raffle configuration
    const configResult = await query(`
      SELECT estado, numero_ganador, fecha_cierre, fecha_actualizacion,
             (SELECT COUNT(*) FROM participaciones) as total_participaciones
      FROM configuracion_rifa 
      ORDER BY id DESC 
      LIMIT 1
    `)

    console.log("[v0] Config query result:", configResult.rows)

    if (configResult.rows.length === 0) {
      console.log("[v0] No configuration found, creating default")
      await query(`
        INSERT INTO configuracion_rifa (estado, fecha_actualizacion) 
        VALUES ('activa', NOW())
      `)

      return NextResponse.json({
        estado: "activa",
        numero_ganador: null,
        fecha_cierre: null,
        total_participaciones: 0,
      })
    }

    const config = configResult.rows[0]

    return NextResponse.json({
      estado: config.estado,
      numero_ganador: config.numero_ganador,
      fecha_cierre: config.fecha_cierre,
      total_participaciones: Number.parseInt(config.total_participaciones),
    })
  } catch (error) {
    console.log("[v0] Config API error:", error)
    logError("Error fetching raffle config", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin token
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") {
      return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = configUpdateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Estado inválido",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { estado } = validationResult.data

    // Update raffle configuration
    const fechaCierre = estado === "cerrada" ? "NOW()" : "NULL"

    await query(
      `UPDATE configuracion_rifa 
       SET estado = $1, fecha_cierre = ${fechaCierre}, fecha_actualizacion = NOW()
       WHERE id = (SELECT MAX(id) FROM configuracion_rifa)`,
      [estado],
    )

    logInfo("Raffle config updated", {
      nuevo_estado: estado,
      admin_id: decoded.adminId,
    })

    return NextResponse.json({
      success: true,
      message: `Rifa ${estado} exitosamente`,
    })
  } catch (error) {
    logError("Error updating raffle config", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

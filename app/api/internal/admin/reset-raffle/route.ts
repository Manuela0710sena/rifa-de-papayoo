import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { verifyPassword } from "@/lib/auth"
import { query } from "@/lib/database"
import { logError, logInfo } from "@/lib/logger"
import { z } from "zod"

const resetRaffleSchema = z.object({
  confirmacion_1: z.boolean().refine((val) => val === true, "Confirmación 1 requerida"),
  confirmacion_2: z.boolean().refine((val) => val === true, "Confirmación 2 requerida"),
  confirmacion_3: z.boolean().refine((val) => val === true, "Confirmación 3 requerida"),
  admin_password: z.string().min(1, "Contraseña de administrador requerida"),
})

export async function POST(request: NextRequest) {
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
    const validationResult = resetRaffleSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Confirmaciones incompletas",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { admin_password } = validationResult.data

    // Verify admin password
    const adminResult = await query("SELECT password_hash FROM usuarios_internos WHERE id = $1", [decoded.adminId])

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Administrador no encontrado" }, { status: 404 })
    }

    const isValidPassword = await verifyPassword(admin_password, adminResult.rows[0].password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ success: false, message: "Contraseña incorrecta" }, { status: 401 })
    }

    // Execute raffle reset function
    const resetResult = await query("SELECT * FROM reset_raffle_system()")

    if (resetResult.rows.length === 0 || !resetResult.rows[0].success) {
      return NextResponse.json({
        success: false,
        message: resetResult.rows[0]?.message || "Error ejecutando reinicio",
      })
    }

    const result = resetResult.rows[0]

    logInfo("Raffle system reset", {
      affected_codes: result.affected_codes,
      affected_participations: result.affected_participations,
      admin_id: decoded.adminId,
      admin_usuario: decoded.usuario,
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      affected_codes: result.affected_codes,
      affected_participations: result.affected_participations,
    })
  } catch (error) {
    logError("Error resetting raffle system", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

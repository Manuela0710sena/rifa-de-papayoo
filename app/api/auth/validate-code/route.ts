//auth/validate-code/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { codeValidationSchema } from "@/lib/validation"
import { authRateLimiter, getClientIP } from "@/lib/rate-limiter"
import { logError, logInfo } from "@/lib/logger"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    // Rate limiting check
    try {
      await authRateLimiter.consume(clientIP)
    } catch (rateLimitError) {
      return NextResponse.json(
        {
          valid: false,
          message: "Demasiados intentos. Intenta de nuevo en unos minutos.",
        },
        { status: 429 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = codeValidationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          valid: false,
          message: "Código inválido",
        },
        { status: 400 },
      )
    }

    const { codigo } = validationResult.data

    // Check raffle status
    const raffleStatus = await query("SELECT estado FROM configuracion_rifa ORDER BY id DESC LIMIT 1")

    if (raffleStatus.rows.length === 0 || raffleStatus.rows[0].estado !== "activa") {
      return NextResponse.json({
        valid: false,
        message: "La rifa no está activa actualmente",
      })
    }

    // Check if code exists and is valid
    const codeResult = await query(
      `SELECT id, estado, fecha_expiracion 
       FROM codigos 
       WHERE codigo = $1`,
      [codigo],
    )

    if (codeResult.rows.length === 0) {
      logInfo("Code validation failed - code not found", { codigo, clientIP })
      return NextResponse.json({
        valid: false,
        message: "Código no encontrado",
      })
    }

    const codeData = codeResult.rows[0]

    // Check if code is already used
    if (codeData.estado === "usado") {
      return NextResponse.json({
        valid: false,
        message: "Este código ya ha sido utilizado",
      })
    }

    // Check if code is expired
    if (
      codeData.estado === "expirado" ||
      (codeData.fecha_expiracion && new Date(codeData.fecha_expiracion) < new Date())
    ) {
      return NextResponse.json({
        valid: false,
        message: "Este código ha expirado",
      })
    }

    // Code is valid
    logInfo("Code validation successful", { codigo, clientIP })

    return NextResponse.json({
      valid: true,
      message: "Código válido",
    })
  } catch (error) {
    logError("Error validating code", error, { clientIP })

    return NextResponse.json(
      {
        valid: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

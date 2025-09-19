import { type NextRequest, NextResponse } from "next/server"
import { clientLoginSchema } from "@/lib/validation"
import { verifyPassword, generateToken } from "@/lib/auth"
import { authRateLimiter, getClientIP } from "@/lib/rate-limiter"
import { logError, logInfo } from "@/lib/logger"
import { transaction } from "@/lib/database"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    // Rate limiting check
    try {
      await authRateLimiter.consume(clientIP)
    } catch (rateLimitError) {
      return NextResponse.json(
        {
          success: false,
          message: "Demasiados intentos. Intenta de nuevo en unos minutos.",
        },
        { status: 429 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = clientLoginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
        },
        { status: 400 },
      )
    }

    const { codigo, correo, contraseña } = validationResult.data

    // Use transaction for atomic operation
    const result = await transaction(async (client) => {
      // Check raffle status
      const raffleStatus = await client.query("SELECT estado FROM configuracion_rifa ORDER BY id DESC LIMIT 1")

      if (raffleStatus.rows.length === 0 || raffleStatus.rows[0].estado !== "activa") {
        throw new Error("La rifa no está activa actualmente")
      }

      // Find client by email
      const clientResult = await client.query(
        "SELECT id, nombre, correo, contraseña_hash FROM clientes WHERE correo = $1",
        [correo],
      )

      if (clientResult.rows.length === 0) {
        throw new Error("Credenciales inválidas")
      }

      const clientData = clientResult.rows[0]

      // Verify password
      const isValidPassword = await verifyPassword(contraseña, clientData.contraseña_hash)

      if (!isValidPassword) {
        throw new Error("Credenciales inválidas")
      }

      // Validate and use code
      const codeValidation = await client.query("SELECT * FROM validate_and_use_code($1, $2)", [codigo, clientData.id])

      if (!codeValidation.rows[0].success) {
        throw new Error(codeValidation.rows[0].message)
      }

      const numeroRifa = codeValidation.rows[0].numero_rifa

      return {
        cliente: {
          id: clientData.id,
          nombre: clientData.nombre,
          correo: clientData.correo,
        },
        numero_rifa: numeroRifa,
      }
    })

    // Generate JWT token
    const token = generateToken({
      clienteId: result.cliente.id,
      correo: result.cliente.correo,
      type: "cliente",
    })

    logInfo("Client logged in successfully", {
      clienteId: result.cliente.id,
      correo: result.cliente.correo,
      numeroRifa: result.numero_rifa,
      clientIP,
    })

    return NextResponse.json({
      success: true,
      cliente: result.cliente,
      numero_rifa: result.numero_rifa,
      token,
    })
  } catch (error) {
    logError("Error logging in client", error, { clientIP })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

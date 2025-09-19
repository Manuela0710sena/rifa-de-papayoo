//register/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { clientRegistrationSchema } from "@/lib/validation"
import { hashPassword, generateToken } from "@/lib/auth"
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
    const validationResult = clientRegistrationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { codigo, nombre, apellidos, telefono, correo, contraseña, sede_id } = validationResult.data

    // Use transaction for atomic operation
    const result = await transaction(async (client) => {
      // Check raffle status
      const raffleStatus = await client.query(
        "SELECT estado FROM configuracion_rifa ORDER BY id DESC LIMIT 1"
      )

      if (raffleStatus.rows.length === 0 || raffleStatus.rows[0].estado !== "activa") {
        throw new Error("La rifa no está activa actualmente")
      }

      // Check if code exists and is active (without using validate_and_use_code yet)
      const codeExists = await client.query(
        `SELECT id FROM codigos 
         WHERE codigo = $1 
           AND estado = 'activo' 
           AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())`,
        [codigo]
      )

      if (codeExists.rows.length === 0) {
        throw new Error("Código inválido, ya usado o expirado")
      }

      // Check if email already exists
      const existingUser = await client.query("SELECT id FROM clientes WHERE correo = $1", [correo])

      if (existingUser.rows.length > 0) {
        throw new Error("Este correo ya está registrado")
      }

      // Check if sede exists and is active
      const sedeCheck = await client.query(
        "SELECT id FROM sedes WHERE id = $1 AND estado = 'activa'",
        [sede_id]
      )

      if (sedeCheck.rows.length === 0) {
        throw new Error("Sede inválida o inactiva")
      }

      // Hash password
      const hashedPassword = await hashPassword(contraseña)

      // Create new client
      const newClient = await client.query(
        `INSERT INTO clientes (nombre, apellidos, telefono, correo, sede_id, contraseña_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nombre, correo`,
        [nombre, apellidos, telefono, correo, sede_id, hashedPassword]
      )

      const clientData = newClient.rows[0]

      // Now validate and use the code with the real client ID
      const finalCodeValidation = await client.query(
        "SELECT * FROM validate_and_use_code($1, $2)",
        [codigo, clientData.id]
      )

      if (!finalCodeValidation.rows[0].success) {
        throw new Error("Error asignando número de rifa")
      }

      const numeroRifa = finalCodeValidation.rows[0].numero_rifa

      return {
        cliente: clientData,
        numero_rifa: numeroRifa,
      }
    })

    // Generate JWT token
    const token = generateToken({
      clienteId: result.cliente.id,
      correo: result.cliente.correo,
      type: "cliente",
    })

    logInfo("Client registered successfully", {
      clienteId: result.cliente.id,
      correo: result.cliente.correo,
      numeroRifa: result.numero_rifa,
      clientIP,
    })

    return NextResponse.json({
      success: true,
      cliente: {
        id: result.cliente.id,
        nombre: result.cliente.nombre,
        correo: result.cliente.correo,
      },
      numero_rifa: result.numero_rifa,
      token,
    })
  } catch (error) {
    console.error("🔥 Error detallado en /api/auth/register:", error)

    logError("Error registering client", error, { clientIP })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { winnerSchema } from "@/lib/validation"
import { query } from "@/lib/database"
import { logError, logInfo } from "@/lib/logger"

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
    const validationResult = winnerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Número ganador inválido",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { numero_ganador } = validationResult.data

    // Find winner by raffle number
    const winnerQuery = `
      SELECT 
        p.numero_rifa,
        c.nombre || ' ' || c.apellidos as nombre,
        c.correo,
        c.telefono,
        s.nombre as sede
      FROM participaciones p
      JOIN clientes c ON p.cliente_id = c.id
      JOIN sedes s ON c.sede_id = s.id
      WHERE p.numero_rifa = $1
    `

    const winnerResult = await query(winnerQuery, [numero_ganador])

    if (winnerResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No se encontró participante con ese número",
      })
    }

    const winner = winnerResult.rows[0]

    // Update raffle configuration with winner
    await query(
      "UPDATE configuracion_rifa SET numero_ganador = $1, fecha_actualizacion = NOW() WHERE id = (SELECT MAX(id) FROM configuracion_rifa)",
      [numero_ganador],
    )

    logInfo("Winner designated", {
      numero_ganador,
      winner_name: winner.nombre,
      winner_email: winner.correo,
      admin_id: decoded.adminId,
    })

    return NextResponse.json({
      success: true,
      ganador: {
        numero_rifa: winner.numero_rifa,
        cliente: {
          nombre: winner.nombre,
          correo: winner.correo,
          telefono: winner.telefono,
          sede: winner.sede,
        },
      },
    })
  } catch (error) {
    logError("Error designating winner", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

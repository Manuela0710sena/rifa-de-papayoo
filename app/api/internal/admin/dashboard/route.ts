import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { query } from "@/lib/database"
import { logError } from "@/lib/logger"

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

    // Get dashboard statistics
    const statsQuery = `
      SELECT 
        COALESCE((SELECT COUNT(*) FROM clientes), 0) as total_clientes,
        COALESCE((SELECT COUNT(*) FROM participaciones), 0) as total_participaciones,
        COALESCE((SELECT COUNT(*) FROM codigos WHERE estado = 'usado'), 0) as codigos_usados,
        COALESCE((SELECT COUNT(*) FROM codigos WHERE estado = 'activo'), 0) as codigos_disponibles,
        COALESCE((SELECT estado FROM configuracion_rifa ORDER BY id DESC LIMIT 1), 'activa') as estado_rifa
    `

    console.log("[v0] Executing dashboard stats query")
    const statsResult = await query(statsQuery)
    console.log("[v0] Dashboard stats result:", statsResult.rows[0])
    const stats = statsResult.rows[0]

    // Get monthly metrics
    const monthlyQuery = `
      SELECT 
        COALESCE((SELECT COUNT(*) FROM clientes WHERE fecha_registro >= date_trunc('month', CURRENT_DATE)), 0) as clientes_nuevos_mes_actual,
        COALESCE((SELECT COUNT(*) FROM clientes WHERE fecha_registro >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND fecha_registro < date_trunc('month', CURRENT_DATE)), 0) as clientes_nuevos_mes_anterior
    `

    console.log("[v0] Executing monthly metrics query")
    const monthlyResult = await query(monthlyQuery)
    console.log("[v0] Monthly metrics result:", monthlyResult.rows[0])
    const monthly = monthlyResult.rows[0]

    // Calculate growth percentage
    const crecimiento_porcentual =
      monthly.clientes_nuevos_mes_anterior > 0
        ? Math.round(
            ((monthly.clientes_nuevos_mes_actual - monthly.clientes_nuevos_mes_anterior) /
              monthly.clientes_nuevos_mes_anterior) *
              100,
          )
        : monthly.clientes_nuevos_mes_actual > 0
          ? 100
          : 0

    return NextResponse.json({
      estadisticas: {
        total_clientes: Number.parseInt(stats.total_clientes),
        total_participaciones: Number.parseInt(stats.total_participaciones),
        codigos_usados: Number.parseInt(stats.codigos_usados),
        codigos_disponibles: Number.parseInt(stats.codigos_disponibles),
        estado_rifa: stats.estado_rifa,
      },
      metricas_mensuales: {
        clientes_nuevos_mes_actual: Number.parseInt(monthly.clientes_nuevos_mes_actual),
        clientes_nuevos_mes_anterior: Number.parseInt(monthly.clientes_nuevos_mes_anterior),
        crecimiento_porcentual,
      },
    })
  } catch (error) {
    console.log("[v0] Dashboard API error:", error)
    logError("Error fetching dashboard data", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

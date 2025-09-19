import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { query } from "@/lib/database"
import { logError } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req)
    if (!token) return NextResponse.json({ success: false, message: "Token requerido" }, { status: 401 })

    const decoded = verifyToken(token)
    if (decoded.type !== "admin") return NextResponse.json({ success: false, message: "Acceso denegado" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const sedeId = searchParams.get("sede_id")

    const whereConditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      whereConditions.push(`(c.nombre ILIKE $${idx} OR c.apellidos ILIKE $${idx} OR c.correo ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }

    if (sedeId) {
      whereConditions.push(`c.sede_id = $${idx}`)
      params.push(Number(sedeId))
      idx++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Query clientes
    const clientsQuery = `
      SELECT 
        c.nombre || ' ' || c.apellidos as nombre,
        c.correo,
        c.telefono,
        s.nombre as sede,
        p.numero_rifa
      FROM clientes c
      LEFT JOIN sedes s ON c.sede_id = s.id
      LEFT JOIN participaciones p ON c.id = p.cliente_id
      ${whereClause}
      ORDER BY c.fecha_registro DESC
    `
    const result = await query(clientsQuery, params)

    // Crear CSV
    const header = ["Nombre", "Correo", "Teléfono", "Sede", "Número de Rifa"]
    const csvRows = [
      header.join(","),
      ...result.rows.map((r: any) => [
        `"${r.nombre}"`,
        `"${r.correo}"`,
        `"${r.telefono}"`,
        `"${r.sede}"`,
        `"${r.numero_rifa || ""}"`,
      ].join(","))
    ]
    const csvContent = csvRows.join("\n")

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="clientes_export.csv"`,
      },
    })
  } catch (err) {
    console.error("Error exporting clients:", err)
    logError("Export clients error", err)
    return NextResponse.json({ success: false, message: "Error exportando clientes" }, { status: 500 })
  }
}

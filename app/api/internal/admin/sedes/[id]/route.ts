import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth"
import { sedeSchema } from "@/lib/validation"
import { query } from "@/lib/database"
import { logError, logInfo } from "@/lib/logger"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const sedeId = Number.parseInt(params.id)
    if (Number.isNaN(sedeId)) {
      return NextResponse.json({ success: false, message: "ID inválido" }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = sedeSchema.safeParse(body)

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

    const { nombre, ciudad, direccion } = validationResult.data

    // Update sede
    const result = await query("UPDATE sedes SET nombre = $1, ciudad = $2, direccion = $3 WHERE id = $4 RETURNING *", [
      nombre,
      ciudad,
      direccion || null,
      sedeId,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Sede no encontrada" }, { status: 404 })
    }

    const updatedSede = result.rows[0]

    logInfo("Sede updated", {
      sede_id: sedeId,
      nombre,
      ciudad,
      admin_id: decoded.adminId,
    })

    return NextResponse.json({
      success: true,
      sede: updatedSede,
    })
  } catch (error) {
    logError("Error updating sede", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const sedeId = Number.parseInt(params.id)
    if (Number.isNaN(sedeId)) {
      return NextResponse.json({ success: false, message: "ID inválido" }, { status: 400 })
    }

    // Soft delete sede (set estado to 'inactiva')
    const result = await query("UPDATE sedes SET estado = 'inactiva' WHERE id = $1 RETURNING *", [sedeId])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Sede no encontrada" }, { status: 404 })
    }

    logInfo("Sede deleted (soft)", {
      sede_id: sedeId,
      admin_id: decoded.adminId,
    })

    return NextResponse.json({
      success: true,
      message: "Sede desactivada exitosamente",
    })
  } catch (error) {
    logError("Error deleting sede", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

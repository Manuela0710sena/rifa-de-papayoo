import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { logError } from "@/lib/logger"

export async function GET() {
  try {
    const result = await query(
      "SELECT id, nombre, ciudad, direccion FROM sedes WHERE estado = 'activa' ORDER BY nombre",
    )

    return NextResponse.json({
      success: true,
      sedes: result.rows,
    })
  } catch (error) {
    logError("Error fetching sedes", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

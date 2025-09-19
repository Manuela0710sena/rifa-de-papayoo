import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import { verifyPassword, hashPassword } from "@/lib/auth"

export async function GET() {
  try {
    console.log("[v0] Testing admin login debug...")

    // Check if admin user exists
    const adminResult = await query(
      "SELECT id, usuario, rol, password_hash FROM usuarios_internos WHERE usuario = $1",
      ["admin"],
    )

    console.log("[v0] Admin query result:", adminResult.rows)

    if (adminResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Admin user not found in database",
        debug: "No admin user exists",
      })
    }

    const adminData = adminResult.rows[0]
    console.log("[v0] Admin data found:", { id: adminData.id, usuario: adminData.usuario, rol: adminData.rol })

    // Test password verification
    const testPassword = "admin123"
    const isValid = await verifyPassword(testPassword, adminData.password_hash)

    console.log("[v0] Password verification result:", isValid)
    console.log("[v0] Stored hash:", adminData.password_hash)

    // Generate a new hash for comparison
    const newHash = await hashPassword(testPassword)
    console.log("[v0] New hash for comparison:", newHash)

    return NextResponse.json({
      success: true,
      debug: {
        adminExists: true,
        adminId: adminData.id,
        usuario: adminData.usuario,
        rol: adminData.rol,
        passwordValid: isValid,
        storedHash: adminData.password_hash,
        newHashSample: newHash,
      },
    })
  } catch (error) {
    console.error("[v0] Debug error:", error)
    return NextResponse.json({
      success: false,
      error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error),
      debug: "Database connection or query failed",
    })
  }
}

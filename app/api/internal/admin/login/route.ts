import { type NextRequest, NextResponse } from "next/server"
import { adminLoginSchema } from "@/lib/validation"
import { verifyPassword, generateToken } from "@/lib/auth"
import { adminRateLimiter, getClientIP } from "@/lib/rate-limiter"
import { logError, logInfo } from "@/lib/logger"
import { query } from "@/lib/database"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    console.log("[v0] Admin login attempt from IP:", clientIP)

    // Rate limiting check
    try {
      await adminRateLimiter.consume(clientIP)
    } catch (rateLimitError) {
      console.log("[v0] Rate limit exceeded for IP:", clientIP)
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
    console.log("[v0] Login request body:", { usuario: body.usuario })

    const validationResult = adminLoginSchema.safeParse(body)

    if (!validationResult.success) {
      console.log("[v0] Validation failed:", validationResult.error)
      return NextResponse.json(
        {
          success: false,
          message: "Datos inválidos",
        },
        { status: 400 },
      )
    }

    const { usuario, contraseña } = validationResult.data

    // Find admin user
    console.log("[v0] Searching for admin user:", usuario)
    const adminResult = await query(
      "SELECT id, usuario, rol, password_hash FROM usuarios_internos WHERE usuario = $1",
      [usuario],
    )

    console.log("[v0] Admin query result:", { found: adminResult.rows.length > 0 })

    if (adminResult.rows.length === 0) {
      logInfo("Admin login failed - user not found", { usuario, clientIP })
      return NextResponse.json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    const adminData = adminResult.rows[0]
    console.log("[v0] Found admin:", { id: adminData.id, usuario: adminData.usuario })

    // Verify password
    console.log("[v0] Verifying password...")
    console.log("[v0] Password from request:", contraseña)
    console.log("[v0] Hash from database:", adminData.password_hash)
    const isValidPassword = await verifyPassword(contraseña, adminData.password_hash)
    console.log("[v0] Password verification result:", isValidPassword)

    if (!isValidPassword) {
      logInfo("Admin login failed - invalid password", { usuario, clientIP })
      return NextResponse.json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Generate JWT token
    console.log("[v0] Generating JWT token...")
    const token = generateToken({
      adminId: adminData.id,
      usuario: adminData.usuario,
      rol: adminData.rol,
      type: "admin",
    })

    console.log("[v0] Login successful for user:", adminData.usuario)

    logInfo("Admin logged in successfully", {
      adminId: adminData.id,
      usuario: adminData.usuario,
      clientIP,
    })

    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminData.id,
        usuario: adminData.usuario,
        rol: adminData.rol,
      },
      token,
    })

    // Set secure HTTP-only cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    logError("Error logging in admin", error, { clientIP })

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

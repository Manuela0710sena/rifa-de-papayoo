// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyJWT, verifyApiKey } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log("[v0] Middleware processing:", pathname)

  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // =========================
  // 1. Admin routes protection
  // =========================
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    const token = request.cookies.get("admin_token")?.value
    console.log("[v0] Admin route protection - token present:", !!token)

    if (!token) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    try {
      verifyJWT(token)
    } catch {
      const response = NextResponse.redirect(new URL("/admin", request.url))
      response.cookies.delete("admin_token")
      return response
    }
  }

  // =========================
  // 2. Internal API security
  // =========================
  if (pathname.startsWith("/api/internal/admin")) {
    if (pathname === "/api/internal/admin/login") {
      return NextResponse.next()
    }

    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
      verifyJWT(token)
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
  }

  // =========================
  // 3. EPICO integration security
  // =========================
  if (pathname.startsWith("/api/integration")) {
    const apiKey = request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "Falta API Key" }, { status: 401 })
    }

    const isValid = await verifyApiKey(apiKey, "EPICO")
    console.log("[v0] API Key validation result:", isValid)

    if (!isValid) {
      return NextResponse.json({ error: "API Key inválida" }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/internal/:path*", "/api/integration/:path*"],
  runtime: "nodejs",
}

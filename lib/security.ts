import crypto from "crypto"
import type { NextRequest } from "next/server"

export class SecurityUtils {
  // Rate limiting store (in production use Redis)
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>()

  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcryptjs")
    return bcrypt.hash(password, 12)
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import("bcryptjs")
    return bcrypt.compare(password, hash)
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex")
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>"'&]/g, "")
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-$$$$]{10,15}$/
    return phoneRegex.test(phone)
  }

  static validateCode(code: string): boolean {
    // Código alfanumérico de 8-12 caracteres
    const codeRegex = /^[A-Z0-9]{8,12}$/
    return codeRegex.test(code)
  }

  static async rateLimit(identifier: string, maxRequests = 100, windowMs = 60000): Promise<boolean> {
    const now = Date.now()
    const key = `${identifier}_${Math.floor(now / windowMs)}`

    const current = this.rateLimitStore.get(key)

    if (!current) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (current.count >= maxRequests) {
      return false
    }

    current.count++
    return true
  }

  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const real = request.headers.get("x-real-ip")

    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }

    if (real) {
      return real.trim()
    }

    return "unknown"
  }

  static async auditLog(action: string, userId: string | null, details: any, ip: string): Promise<void> {
    const { query } = await import("./database")

    try {
      await query(
        `
        INSERT INTO integration_logs (
          endpoint, method, status_code, response_time, 
          ip_address, user_agent, trace_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `,
        [action, "AUDIT", 200, 0, ip, `User: ${userId || "anonymous"}`, crypto.randomUUID()],
      )
    } catch (error) {
      console.error("Error logging audit:", error)
    }
  }
}

export function validateRequest(schema: any) {
  return (handler: Function) => {
    return async (request: NextRequest, context: any) => {
      try {
        const body = await request.json()

        // Validar esquema básico
        for (const [key, rules] of Object.entries(schema)) {
          const value = body[key]
          const ruleSet = rules as any

          if (ruleSet.required && (!value || value === "")) {
            return Response.json({ error: `Campo ${key} es requerido` }, { status: 400 })
          }

          if (value && ruleSet.type === "email" && !SecurityUtils.validateEmail(value)) {
            return Response.json({ error: `Campo ${key} debe ser un email válido` }, { status: 400 })
          }

          if (value && ruleSet.type === "phone" && !SecurityUtils.validatePhone(value)) {
            return Response.json({ error: `Campo ${key} debe ser un teléfono válido` }, { status: 400 })
          }

          if (value && ruleSet.maxLength && value.length > ruleSet.maxLength) {
            return Response.json({ error: `Campo ${key} excede la longitud máxima` }, { status: 400 })
          }
        }

        return handler(request, context)
      } catch (error) {
        return Response.json({ error: "Datos inválidos" }, { status: 400 })
      }
    }
  }
}

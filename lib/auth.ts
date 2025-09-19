import bcrypt from "bcryptjs"
import jwt, { SignOptions } from "jsonwebtoken"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development"

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Generate JWT token
export function generateToken(payload: any, expiresIn: jwt.SignOptions["expiresIn"] = "2h"): string {
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, JWT_SECRET, options)
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error("Invalid token")
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}

// Verify API Key for integrations
export async function verifyApiKey(apiKey: string, integrationName: string): Promise<boolean> {
  const { query } = await import("./database")

  try {
    const result = await query("SELECT api_key_hash FROM integrations WHERE name = $1 AND revoked_at IS NULL", [
      integrationName,
    ])

    if (result.rows.length === 0) {
      return false
    }

    return bcrypt.compare(apiKey, result.rows[0].api_key_hash)
  } catch (error) {
    console.error("API Key verification error:", error)
    return false
  }
}

// Verify JWT token with detailed logging for Node.js runtime
export function verifyJWT(token: string): any {
  console.log("[v0] JWT verification debug:")
  console.log("[v0] - Token received:", token ? "present" : "missing")
  console.log("[v0] - Token length:", token?.length || 0)
  console.log("[v0] - JWT_SECRET present:", JWT_SECRET ? "yes" : "no")

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log("[v0] - JWT verification successful:", decoded)
    return decoded
  } catch (error) {
    if (error instanceof Error) {
      console.log("[v0] - JWT verification failed:", error.message)
    } else {
      console.log("[v0] - JWT verification failed:", error)
    }
    throw new Error("Invalid token")
  }
}

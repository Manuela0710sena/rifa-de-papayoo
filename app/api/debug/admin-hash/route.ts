import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Generate a fresh hash for 'admin123' to compare
    const password = "admin123"
    const newHash = await bcrypt.hash(password, 12)

    // Test the existing hash from seed data
    const existingHash = "$2b$12$LQv3c1yX8LjjW0/c2RuWUOahJ5YjgpXkBrUiGdHJ4O0qGIC2lo/C."
    const isValidExisting = await bcrypt.compare(password, existingHash)

    // Test the new hash
    const isValidNew = await bcrypt.compare(password, newHash)

    return NextResponse.json({
      password: password,
      existingHash: existingHash,
      newHash: newHash,
      existingHashValid: isValidExisting,
      newHashValid: isValidNew,
      bcryptVersion: "bcryptjs",
      environment: process.env.NODE_ENV,
      jwtSecret: process.env.JWT_SECRET ? "SET" : "NOT SET",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Hash generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

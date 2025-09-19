//integration/save-code/route.ts
import { type NextRequest, NextResponse } from "next/server" 
import { epicoCodeSchema } from "@/lib/validation"
import { verifyApiKey } from "@/lib/auth"
import { epicoRateLimiter, getClientIP } from "@/lib/rate-limiter"
import { logIntegrationCall, logError, logInfo } from "@/lib/logger"
import { query } from "@/lib/database"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  const traceId = uuidv4()
  const clientIP = getClientIP(request)
  const endpoint = "/api/integration/save-code"

  try {
    // Rate limiting check
    try {
      await epicoRateLimiter.consume(clientIP)
    } catch (rateLimitError) {
      await logIntegrationCall({
        traceId,
        endpoint,
        method: "POST",
        integrationName: "EPICO",
        statusCode: 429,
        errorMessage: "Rate limit exceeded",
        metadata: { clientIP },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          trace_id: traceId,
        },
        { status: 429 },
      )
    }

    // ✅ Extraer y verificar API key desde el header correcto
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey) {
      await logIntegrationCall({
        traceId,
        endpoint,
        method: "POST",
        integrationName: "EPICO",
        statusCode: 401,
        errorMessage: "Missing API key",
        metadata: { clientIP },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Missing API key",
          trace_id: traceId,
        },
        { status: 401 },
      )
    }

    // Verify API key
    const isValidApiKey = await verifyApiKey(apiKey, "EPICO")
    if (!isValidApiKey) {
      await logIntegrationCall({
        traceId,
        endpoint,
        method: "POST",
        integrationName: "EPICO",
        statusCode: 401,
        errorMessage: "Invalid API key",
        metadata: { clientIP },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key",
          trace_id: traceId,
        },
        { status: 401 },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = epicoCodeSchema.safeParse(body)

    if (!validationResult.success) {
      await logIntegrationCall({
        traceId,
        endpoint,
        method: "POST",
        integrationName: "EPICO",
        statusCode: 400,
        errorMessage: "Validation failed",
        metadata: {
          clientIP,
          validationErrors: validationResult.error.errors,
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.errors,
          trace_id: traceId,
        },
        { status: 400 },
      )
    }

    const { codigo, meta } = validationResult.data

    // Check if code already exists
    const existingCode = await query("SELECT id FROM codigos WHERE codigo = $1", [codigo])

    if (existingCode.rows.length > 0) {
      await logIntegrationCall({
        traceId,
        endpoint,
        method: "POST",
        integrationName: "EPICO",
        statusCode: 409,
        errorMessage: "Code already exists",
        metadata: { clientIP, codigo },
      })

      return NextResponse.json(
        {
          success: false,
          error: "Code already exists",
          codigo,
          trace_id: traceId,
        },
        { status: 409 },
      )
    }

    // Insert new code
    const result = await query(
      `INSERT INTO codigos (codigo, estado, generado_por, meta, fecha_generacion)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, codigo, fecha_generacion`,
      [codigo, "activo", "EPICO", meta ? JSON.stringify(meta) : null],
    )

    const newCode = result.rows[0]

    // Log successful operation
    await logIntegrationCall({
      traceId,
      endpoint,
      method: "POST",
      integrationName: "EPICO",
      statusCode: 201,
      metadata: {
        clientIP,
        codigo,
        codeId: newCode.id,
      },
    })

    logInfo("New code saved successfully", {
      traceId,
      codigo,
      integrationName: "EPICO",
    })

    return NextResponse.json(
      {
        success: true,
        codigo: newCode.codigo,
        fecha_generacion: newCode.fecha_generacion,
        trace_id: traceId,
      },
      { status: 201 },
    )
  } catch (error) {
    logError("Error saving code from EPICO", error, {
      traceId,
      endpoint,
      clientIP,
    })

    await logIntegrationCall({
      traceId,
      endpoint,
      method: "POST",
      integrationName: "EPICO",
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      metadata: { clientIP },
    })

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        trace_id: traceId,
      },
      { status: 500 },
    )
  }
}

// Health check endpoint for EPICO integration
export async function GET(request: NextRequest) {
  const traceId = uuidv4()

  try {
    // Simple database connectivity check
    await query("SELECT 1")

    return NextResponse.json({
      status: "healthy",
      service: "EPICO Integration",
      timestamp: new Date().toISOString(),
      trace_id: traceId,
    })
  } catch (error) {
    logError("Health check failed", error, { traceId })

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "EPICO Integration",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
        trace_id: traceId,
      },
      { status: 503 },
    )
  }
}

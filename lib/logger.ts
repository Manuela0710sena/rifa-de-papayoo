import { v4 as uuidv4 } from "uuid"
import { query } from "./database"

export interface LogEntry {
  traceId?: string
  endpoint: string
  method: string
  integrationName?: string
  statusCode: number
  errorMessage?: string
  metadata?: any
}

// Log integration API calls
export async function logIntegrationCall(logEntry: LogEntry): Promise<void> {
  try {
    const traceId = logEntry.traceId || uuidv4()

    await query(
      `INSERT INTO integration_logs 
       (trace_id, endpoint, method, integration_name, status_code, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        traceId,
        logEntry.endpoint,
        logEntry.method,
        logEntry.integrationName,
        logEntry.statusCode,
        logEntry.errorMessage,
        logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
      ],
    )
  } catch (error) {
    console.error("Failed to log integration call:", error)
    // Don't throw - logging failures shouldn't break the main flow
  }
}

// Structured console logging
export function logInfo(message: string, metadata?: any): void {
  console.log(
    JSON.stringify({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }),
  )
}

export function logError(message: string, error?: any, metadata?: any): void {
  console.error(
    JSON.stringify({
      level: "error",
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...metadata,
    }),
  )
}

export function logWarn(message: string, metadata?: any): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }),
  )
}

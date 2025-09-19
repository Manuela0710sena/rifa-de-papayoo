import { RateLimiterMemory } from "rate-limiter-flexible"

export const epicoRateLimiter = new RateLimiterMemory({
  keyPrefix: "epico_api",
  points: 1000,
  duration: 60,
  blockDuration: 60,
})

export const adminRateLimiter = new RateLimiterMemory({
  keyPrefix: "admin_api",
  points: 100,
  duration: 60,
  blockDuration: 300,
})

export const authRateLimiter = new RateLimiterMemory({
  keyPrefix: "auth_api",
  points: 10,
  duration: 60,
  blockDuration: 900,
})

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) return forwarded.split(",")[0].trim()
  if (realIP) return realIP

  return "unknown"
}

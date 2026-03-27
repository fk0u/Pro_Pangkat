import { redis } from './redis'

export type ThrottleResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterMs: number
  resetAt: number
}

// Prefix to separate from other domains
const THROTTLE_PREFIX = 'propangkat:throttle:'

export async function consumeThrottle(key: string, limit: number, windowMs: number): Promise<ThrottleResult> {
  const fullKey = `${THROTTLE_PREFIX}${key}`
  const now = Date.now()

  // 1. Get raw string value from Redis (it stores everything as strings over Upstash REST)
  const existingCountStr = await redis.get<string | number>(fullKey)
  
  // Try to parse it to a number, defaulting to 0 if not exists
  let currentCount = 0
  if (existingCountStr !== null && existingCountStr !== undefined) {
      currentCount = typeof existingCountStr === 'number' ? existingCountStr : parseInt(existingCountStr as string, 10)
  }

  // Calculate resetting logic if it doesn't exist
  if (currentCount === 0 || isNaN(currentCount)) {
    const expireInSeconds = Math.ceil(windowMs / 1000)
    await redis.set(fullKey, 1, { ex: expireInSeconds })
    
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterMs: 0,
      resetAt: now + windowMs, // Approx
    }
  }

  if (currentCount >= limit) {
    // Already exhausted
    // We cannot accurately get `retryAfterMs` dynamically without the PTTL command in generic mock redis,
    // so we approximate it via standard window. Usually Upstash provides TTL but to keep fallback simple:
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterMs: windowMs, 
      resetAt: now + windowMs,
    }
  }

  // Still within limit, safely increment
  await redis.incr(fullKey)

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - (currentCount + 1)),
    retryAfterMs: 0,
    resetAt: now + windowMs,
  }
}

export function getClientIpFromRequestHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return headers.get("x-real-ip") || "unknown"
}

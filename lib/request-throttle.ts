type ThrottleState = {
  count: number
  resetAt: number
}

type ThrottleResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterMs: number
  resetAt: number
}

const throttleStore = new Map<string, ThrottleState>()

function cleanup(now: number) {
  for (const [key, state] of throttleStore.entries()) {
    if (state.resetAt <= now) {
      throttleStore.delete(key)
    }
  }
}

export function consumeThrottle(key: string, limit: number, windowMs: number): ThrottleResult {
  const now = Date.now()
  cleanup(now)

  const existing = throttleStore.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    throttleStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterMs: 0,
      resetAt,
    }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now),
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1
  throttleStore.set(key, existing)

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterMs: 0,
    resetAt: existing.resetAt,
  }
}

export function getClientIpFromRequestHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return headers.get("x-real-ip") || "unknown"
}

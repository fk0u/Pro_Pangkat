import { redis } from "./redis"

type LoginAttemptState = {
  failedAttempts: number
  firstFailureAt: number
  blockedUntil?: number
}

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const BLOCK_DURATION_MS = 10 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5

export function getRateLimitKey(ip: string, nip: string) {
  return `login:rate:${ip}::${nip}`
}

export async function canAttemptLogin(rateKey: string) {
  const state = await redis.get<LoginAttemptState>(rateKey)
  const now = Date.now()

  if (!state) {
    return { allowed: true, retryAfterMs: 0 }
  }

  // If the record exists but is outside the attempt window and not blocked, it's virtually empty
  if (state.blockedUntil && state.blockedUntil > now) {
    return { allowed: false, retryAfterMs: state.blockedUntil - now }
  }

  return { allowed: true, retryAfterMs: 0 }
}

export async function registerFailedLogin(rateKey: string) {
  const now = Date.now()
  let current = await redis.get<LoginAttemptState>(rateKey)

  if (!current || now - current.firstFailureAt > ATTEMPT_WINDOW_MS) {
    await redis.set(rateKey, {
      failedAttempts: 1,
      firstFailureAt: now,
    }, { ex: Math.ceil(ATTEMPT_WINDOW_MS / 1000) })
    return
  }

  const failedAttempts = current.failedAttempts + 1
  const nextState: LoginAttemptState = {
    ...current,
    failedAttempts,
  }

  let expirySeconds = Math.ceil(ATTEMPT_WINDOW_MS / 1000)

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    nextState.blockedUntil = now + BLOCK_DURATION_MS
    expirySeconds = Math.ceil((nextState.blockedUntil - now) / 1000)
  }

  await redis.set(rateKey, nextState, { ex: expirySeconds })
}

export async function resetLoginRateLimit(rateKey: string) {
  await redis.del(rateKey)
}

type LoginAttemptState = {
  failedAttempts: number
  firstFailureAt: number
  blockedUntil?: number
}

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000
const BLOCK_DURATION_MS = 10 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5

const loginAttempts = new Map<string, LoginAttemptState>()

function cleanup() {
  const now = Date.now()

  for (const [key, value] of loginAttempts.entries()) {
    const isExpired = now - value.firstFailureAt > ATTEMPT_WINDOW_MS && !value.blockedUntil
    const blockExpired = value.blockedUntil && value.blockedUntil <= now

    if (isExpired || blockExpired) {
      loginAttempts.delete(key)
    }
  }
}

export function getRateLimitKey(ip: string, nip: string) {
  return `${ip}::${nip}`
}

export function canAttemptLogin(rateKey: string) {
  cleanup()

  const state = loginAttempts.get(rateKey)
  const now = Date.now()

  if (!state) {
    return { allowed: true, retryAfterMs: 0 }
  }

  if (state.blockedUntil && state.blockedUntil > now) {
    return { allowed: false, retryAfterMs: state.blockedUntil - now }
  }

  return { allowed: true, retryAfterMs: 0 }
}

export function registerFailedLogin(rateKey: string) {
  cleanup()

  const now = Date.now()
  const current = loginAttempts.get(rateKey)

  if (!current || now - current.firstFailureAt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(rateKey, {
      failedAttempts: 1,
      firstFailureAt: now,
    })
    return
  }

  const failedAttempts = current.failedAttempts + 1
  const nextState: LoginAttemptState = {
    ...current,
    failedAttempts,
  }

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    nextState.blockedUntil = now + BLOCK_DURATION_MS
  }

  loginAttempts.set(rateKey, nextState)
}

export function resetLoginRateLimit(rateKey: string) {
  loginAttempts.delete(rateKey)
}

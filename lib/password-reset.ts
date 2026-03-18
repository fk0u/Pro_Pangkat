import crypto from "crypto"

type PasswordResetRecord = {
  tokenHash: string
  expiresAt: number
}

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000
const resetStore = new Map<string, PasswordResetRecord>()

function cleanupResetStore(now: number) {
  for (const [key, value] of resetStore.entries()) {
    if (value.expiresAt <= now) {
      resetStore.delete(key)
    }
  }
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function issuePasswordResetToken(nip: string) {
  const now = Date.now()
  cleanupResetStore(now)

  const token = String(Math.floor(100000 + Math.random() * 900000))
  resetStore.set(nip, {
    tokenHash: hashToken(token),
    expiresAt: now + RESET_TOKEN_TTL_MS,
  })

  return token
}

export function consumePasswordResetToken(nip: string, token: string) {
  const now = Date.now()
  cleanupResetStore(now)

  const record = resetStore.get(nip)
  if (!record) {
    return { valid: false, reason: "token-not-found" as const }
  }

  if (record.expiresAt <= now) {
    resetStore.delete(nip)
    return { valid: false, reason: "token-expired" as const }
  }

  const providedHash = hashToken(token)
  if (!crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(record.tokenHash))) {
    return { valid: false, reason: "token-invalid" as const }
  }

  resetStore.delete(nip)
  return { valid: true, reason: "ok" as const }
}

import crypto from "crypto"
import { redis } from "./redis"

const RESET_TOKEN_TTL_SEC = 10 * 60 // 10 minutes
const RESET_STORE_PREFIX = "propangkat:pwd_reset:"

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function issuePasswordResetToken(nip: string) {
  const token = String(Math.floor(100000 + Math.random() * 900000))
  const tokenHash = hashToken(token)

  // Use Redis to store the hashed token with a TTL of 10 minutes
  await redis.set(`${RESET_STORE_PREFIX}${nip}`, tokenHash, { ex: RESET_TOKEN_TTL_SEC })

  return token
}

export async function consumePasswordResetToken(nip: string, token: string) {
  const fullKey = `${RESET_STORE_PREFIX}${nip}`

  // Fetch from redis
  const storedHash = await redis.get<string>(fullKey)
  
  if (!storedHash) {
    return { valid: false, reason: "token-not-found-or-expired" as const }
  }

  // Verify the cryptographically signed hash preventing timing attacks
  const providedHash = hashToken(token)
  try {
    if (!crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash))) {
      return { valid: false, reason: "token-invalid" as const }
    }
  } catch (e) {
    // Failsafe if lengths differ
    if (providedHash !== storedHash) {
      return { valid: false, reason: "token-invalid" as const }
    }
  }

  // Consume: Delete token exactly after usage
  await redis.del(fullKey)
  return { valid: true, reason: "ok" as const }
}

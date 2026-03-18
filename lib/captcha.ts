import crypto from "crypto"

const CAPTCHA_SECRET = process.env.SECRET_COOKIE_PASSWORD || "propangkat-fallback-captcha-secret"
const CAPTCHA_TTL_MS = 5 * 60 * 1000

const usedCaptchaNonce = new Map<string, number>()

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signCaptcha(answer: string, nonce: string, expiresAt: number) {
  return crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(`${answer.toUpperCase()}.${nonce}.${expiresAt}`)
    .digest("base64url")
}

function cleanupUsedNonce() {
  const now = Date.now()
  for (const [nonce, exp] of usedCaptchaNonce.entries()) {
    if (exp <= now) {
      usedCaptchaNonce.delete(nonce)
    }
  }
}

export function issueCaptchaToken(answer: string) {
  cleanupUsedNonce()

  const nonce = crypto.randomBytes(12).toString("hex")
  const expiresAt = Date.now() + CAPTCHA_TTL_MS
  const payloadRaw = JSON.stringify({ nonce, expiresAt })
  const payload = base64UrlEncode(payloadRaw)
  const signature = signCaptcha(answer, nonce, expiresAt)

  return `${payload}.${signature}`
}

function constantTimeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

export function verifyCaptchaToken(input: string, token: string, options?: { consume?: boolean }) {
  cleanupUsedNonce()
  const shouldConsume = options?.consume ?? true

  if (!input || !token || !token.includes(".")) {
    return { valid: false, reason: "missing-input-or-token" as const }
  }

  const [payload, signature] = token.split(".")

  if (!payload || !signature) {
    return { valid: false, reason: "invalid-token-format" as const }
  }

  let nonce = ""
  let expiresAt = 0

  try {
    const parsed = JSON.parse(base64UrlDecode(payload))
    nonce = parsed.nonce
    expiresAt = Number(parsed.expiresAt)
  } catch {
    return { valid: false, reason: "invalid-token-payload" as const }
  }

  if (!nonce || !Number.isFinite(expiresAt)) {
    return { valid: false, reason: "invalid-token-content" as const }
  }

  if (expiresAt <= Date.now()) {
    return { valid: false, reason: "token-expired" as const }
  }

  if (usedCaptchaNonce.has(nonce)) {
    return { valid: false, reason: "token-already-used" as const }
  }

  const expected = signCaptcha(input, nonce, expiresAt)
  const isValid = constantTimeEqual(signature, expected)

  if (!isValid) {
    return { valid: false, reason: "captcha-mismatch" as const }
  }

  if (shouldConsume) {
    usedCaptchaNonce.set(nonce, expiresAt)
  }

  return { valid: true, reason: "ok" as const }
}

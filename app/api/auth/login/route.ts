import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePasswords } from "@/lib/password"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { logLogin } from "@/lib/activity-logger"
import { verifyCaptchaToken } from "@/lib/captcha"
import { canAttemptLogin, getRateLimitKey, registerFailedLogin, resetLoginRateLimit } from "@/lib/auth-rate-limit"
import { consumeThrottle, getClientIpFromRequestHeaders } from "@/lib/request-throttle"

const loginSchema = z.object({
  nip: z.string().min(1, "NIP is required"),
  password: z.string().min(1, "Password is required"),
  captchaValue: z.string().min(1, "Captcha is required"),
  captchaHash: z.string().optional(),
  captchaToken: z.string().optional(),
  userType: z.enum(["pegawai", "operator", "admin", "operator-sekolah"]).optional(),
})

const userTypeToRole: Record<string, string> = {
  pegawai: "PEGAWAI",
  operator: "OPERATOR",
  admin: "ADMIN",
  "operator-sekolah": "OPERATOR_SEKOLAH",
}

function getClientIp(req: NextRequest) {
  return getClientIpFromRequestHeaders(req.headers)
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const requestThrottle = consumeThrottle(`login:request:${ip}`, 20, 60_000)
    if (!requestThrottle.allowed) {
      const retryAfterSeconds = Math.ceil(requestThrottle.retryAfterMs / 1000)
      return NextResponse.json({
        message: `Terlalu banyak request login. Coba lagi dalam ${retryAfterSeconds} detik.`,
      }, {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      })
    }

    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ 
        message: "Invalid input", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const { nip, password, captchaValue, captchaHash, captchaToken, userType } = parsed.data

    const token = captchaToken || captchaHash
    if (!token) {
      return NextResponse.json({ message: "CAPTCHA token wajib diisi" }, { status: 400 })
    }

    const captchaResult = verifyCaptchaToken(captchaValue, token, { consume: true })
    if (!captchaResult.valid) {
      return NextResponse.json({ message: "CAPTCHA tidak valid atau kedaluwarsa" }, { status: 400 })
    }
    
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const rateKey = getRateLimitKey(ip, nip)

    const rateLimitState = canAttemptLogin(rateKey)
    if (!rateLimitState.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimitState.retryAfterMs / 1000)
      return NextResponse.json({
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${retryAfterSeconds} detik.`,
      }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { nip },
    })

    if (!user) {
      registerFailedLogin(rateKey)
      await logLogin('unknown', false, { 
        nip, 
        reason: 'User not found',
        ip,
        userAgent,
      })
      
      return NextResponse.json({ message: "NIP atau password salah" }, { status: 401 })
    }

    const isPasswordValid = await comparePasswords(password, user.password)

    if (!isPasswordValid) {
      registerFailedLogin(rateKey)
      await logLogin(user.id, false, { 
        nip: user.nip, 
        reason: 'Invalid password',
        ip,
        userAgent,
      })
      
      return NextResponse.json({ message: "NIP atau password salah" }, { status: 401 })
    }

    if (userType) {
      const expectedRole = userTypeToRole[userType]
      if (expectedRole && user.role !== expectedRole) {
        registerFailedLogin(rateKey)
        await logLogin(user.id, false, {
          nip: user.nip,
          reason: 'Role mismatch',
          expectedRole,
          actualRole: user.role,
          ip,
          userAgent,
        })

        return NextResponse.json({ message: "Akun tidak sesuai dengan jenis login yang dipilih" }, { status: 403 })
      }
    }

    resetLoginRateLimit(rateKey)

    try {
      await logLogin(user.id, true, {
        nip: user.nip,
        role: user.role,
        ip,
        userAgent,
        browser: getBrowserInfo(userAgent),
        device: getDeviceInfo(userAgent)
      })
    } catch (logError) {
      console.error("Error logging login (non-fatal):", logError)
      // Continue even if logging fails
    }

    const session = await getSession()
    session.user = {
      id: user.id,
      nip: user.nip,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    }
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ user: session.user }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get browser info from user agent
function getBrowserInfo(userAgent: string): string {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
    { name: 'Safari', regex: /Safari\/([0-9.]+)/ },
    { name: 'Edge', regex: /Edg(e)?\/([0-9.]+)/ },
    { name: 'Opera', regex: /OPR\/([0-9.]+)/ },
    { name: 'IE', regex: /Trident\/([0-9.]+)/ },
  ]
  
  for (const browser of browsers) {
    const match = userAgent.match(browser.regex)
    if (match) {
      return `${browser.name} ${match[1] || match[2] || ''}`
    }
  }
  
  return 'Unknown Browser'
}

// Helper function to get device info from user agent
function getDeviceInfo(userAgent: string): string {
  if (/Android/i.test(userAgent)) {
    return 'Android Device'
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS Device'
  } else if (/Windows Phone/i.test(userAgent)) {
    return 'Windows Phone'
  } else if (/Windows/i.test(userAgent)) {
    return 'Windows PC'
  } else if (/Macintosh/i.test(userAgent)) {
    return 'Mac'
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux'
  }
  
  return 'Unknown Device'
}

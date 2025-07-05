import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePasswords } from "@/lib/password"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { logLogin } from "@/lib/activity-logger"

const loginSchema = z.object({
  nip: z.string().min(1, "NIP is required"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 })
    }

    const { nip, password } = parsed.data
    
    // Get IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const user = await prisma.user.findUnique({
      where: { nip },
    })

    if (!user) {
      // Log failed login attempt
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
      // Log failed login attempt
      await logLogin(user.id, false, { 
        nip: user.nip, 
        reason: 'Invalid password',
        ip,
        userAgent,
      })
      
      return NextResponse.json({ message: "NIP atau password salah" }, { status: 401 })
    }

    // Log successful login
    await logLogin(user.id, true, {
      nip: user.nip,
      role: user.role,
      ip,
      userAgent,
      browser: getBrowserInfo(userAgent),
      device: getDeviceInfo(userAgent)
    })

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

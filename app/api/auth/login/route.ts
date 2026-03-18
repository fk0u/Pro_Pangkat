import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePasswords } from "@/lib/password"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import { logLogin } from "@/lib/activity-logger"

const loginSchema = z.object({
  nip: z.string().min(1, "NIP is required"),
  password: z.string().min(1, "Password is required"),
  captchaValue: z.string().optional().default(""), // Membuat captchaValue menjadi opsional
  captchaHash: z.string().optional(),
  userType: z.enum(["pegawai", "operator", "admin", "operator-sekolah"]).optional(),
})

export async function POST(req: NextRequest) {
  try {
    console.log("Starting login process...")
    const body = await req.json()
    console.log("Request body:", JSON.stringify(body, null, 2))
    
    // Log detail validasi
    console.log("Validation check - NIP:", !!body.nip)
    console.log("Validation check - Password:", !!body.password)
    console.log("Validation check - captchaValue:", body.captchaValue)
    console.log("Validation check - captchaHash:", body.captchaHash)
    console.log("Validation check - userType:", body.userType)
    
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Invalid login input:", parsed.error.format())
      return NextResponse.json({ 
        message: "Invalid input", 
        details: parsed.error.format() 
      }, { status: 400 })
    }

    const { nip, password, captchaValue, captchaHash } = parsed.data
    
    // Verify captcha if hash is provided
    if (captchaHash) {
      try {
        const captchaResponse = await fetch(new URL("/api/captcha/verify", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: captchaValue, hash: captchaHash }),
        });
        
        if (!captchaResponse.ok) {
          return NextResponse.json({ message: "CAPTCHA verification failed" }, { status: 400 })
        }
        
        const captchaResult = await captchaResponse.json();
        if (!captchaResult.valid) {
          return NextResponse.json({ message: "CAPTCHA tidak valid" }, { status: 400 })
        }
      } catch (error) {
        console.error("Captcha verification error:", error);
        // Continue with login if captcha verification fails due to server error
        // This is a fallback in case the captcha service is down
        console.log("Continuing login process despite captcha error");
      }
    }
    console.log("Login attempt for NIP:", nip)
    
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

    // Log successful login (disabled temporarily)
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

    // Skip session handling to test if that's causing the issue
    try {
      console.log("Creating session...")
      const session = await getSession()
      console.log("Session created successfully")
      
      session.user = {
        id: user.id,
        nip: user.nip,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      }
      session.isLoggedIn = true
      
      console.log("Session data set, attempting to save...")
      await session.save()
      console.log("Session saved successfully")
      
      return NextResponse.json({ user: session.user }, { status: 200 })
    } catch (sessionError) {
      console.error("Session error:", sessionError)
      
      // Return success without session to test if session is causing the error
      console.log("Returning user data without session due to session error")
      const userData = {
        id: user.id,
        nip: user.nip,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
      
      return NextResponse.json({ 
        user: userData, 
        warning: "Session handling failed, using temporary login" 
      }, { status: 200 })
    }
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

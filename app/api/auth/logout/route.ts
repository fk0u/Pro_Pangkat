import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { logLogout } from "@/lib/activity-logger"

export async function POST(req: NextRequest) {
  const session = await getSession()
  
  // Log logout event if user is logged in
  if (session.isLoggedIn && session.user?.id) {
    // Get IP and user agent for logging
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    await logLogout(session.user.id, {
      nip: session.user.nip,
      role: session.user.role,
      ip,
      userAgent
    })
  }
  
  // Destroy the session
  session.destroy()
  
  return NextResponse.json({ message: "Logged out" }, { status: 200 })
}

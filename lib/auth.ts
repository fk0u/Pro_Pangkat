import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import type { User } from "@prisma/client"

// Make sure we have a valid session password
const getSessionPassword = () => {
  const password = process.env.SECRET_COOKIE_PASSWORD;
  if (!password || password.length < 32) {
    console.warn("WARNING: SECRET_COOKIE_PASSWORD is missing or too short. Using fallback password for development only.");
    return "at-least-32-characters-long-iron-session-secret-password-for-propangkat-application-must-be-secure";
  }
  return password;
};

export const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "propangkat-session",
  ttl: ABSOLUTE_TIMEOUT_MS / 1000, 
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
}

// This is the shape of the session data that will be stored in the cookie.
export interface SessionData {
  user?: Pick<User, "id" | "nip" | "name" | "role" | "mustChangePassword">
  isLoggedIn: boolean
  loginTime?: number
  lastActivity?: number
  pending2Fa?: boolean
}

export async function getSession() {
  const cookieStore = await cookies()

  try {
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    // Check timeouts
    if (session.isLoggedIn && session.loginTime && session.lastActivity) {
      const now = Date.now();
      const isIdleExpired = now - session.lastActivity > IDLE_TIMEOUT_MS;
      const isAbsoluteExpired = now - session.loginTime > ABSOLUTE_TIMEOUT_MS;
      
      if (isIdleExpired || isAbsoluteExpired) {
        session.isLoggedIn = false;
        session.user = undefined;
        session.loginTime = undefined;
        session.lastActivity = undefined;
        session.pending2Fa = undefined;
        // In Server Components we can't save/set cookies, so we just return the destroyed session
        try {
          cookieStore.delete(sessionOptions.cookieName);
        } catch (e) {
          // ignore if called from Read-only scope
        }
        return session;
      }
    }
    
    return session;
  } catch (error) {
    console.error("Error creating session, attempting cookie reset:", error);

    try {
      cookieStore.delete(sessionOptions.cookieName)
    } catch (deleteError) {
      console.error("Failed deleting invalid session cookie:", deleteError)
    }

    const recoveredSession = await getIronSession<SessionData>(cookieStore, sessionOptions)
    recoveredSession.isLoggedIn = false
    recoveredSession.user = undefined
    return recoveredSession
  }
}

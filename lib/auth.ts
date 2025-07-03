import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"
import type { User } from "@prisma/client"

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "propangkat-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
}

// This is the shape of the session data that will be stored in the cookie.
export interface SessionData {
  user?: Pick<User, "id" | "nip" | "name" | "role" | "mustChangePassword">
  isLoggedIn: boolean
}

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  return session
}

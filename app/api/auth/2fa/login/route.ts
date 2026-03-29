import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { authenticator } from "otplib"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session.pending2Fa || !session.user) {
    return NextResponse.json({ message: "Not in 2FA pending state" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ message: "2FA not enabled for this user" }, { status: 400 })
  }

  const { token } = await req.json()
  const isValid = authenticator.verify({ token, secret: user.twoFactorSecret })

  if (isValid) {
    session.pending2Fa = false
    session.isLoggedIn = true
    await session.save()
    return NextResponse.json({ message: "Login successful" })
  } else {
    return NextResponse.json({ message: "Invalid 2FA token" }, { status: 400 })
  }
}

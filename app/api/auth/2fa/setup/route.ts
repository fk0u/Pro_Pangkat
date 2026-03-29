import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { authenticator } from "otplib"
import qrcode from "qrcode"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  const secret = authenticator.generateSecret()
  const otpauth = authenticator.keyuri(user.nip, "ProPangkat", secret)

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  })

  const qrCodeUrl = await qrcode.toDataURL(otpauth)

  return NextResponse.json({ secret, qrCodeUrl })
}

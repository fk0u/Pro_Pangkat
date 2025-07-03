import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePasswords } from "@/lib/password"
import { getSession } from "@/lib/auth"
import { z } from "zod"

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

    const user = await prisma.user.findUnique({
      where: { nip },
    })

    if (!user) {
      return NextResponse.json({ message: "NIP atau password salah" }, { status: 401 })
    }

    const isPasswordValid = await comparePasswords(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "NIP atau password salah" }, { status: 401 })
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

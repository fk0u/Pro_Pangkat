import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  nip: z.string().min(18, "NIP harus 18 digit").max(18, "NIP harus 18 digit"),
  email: z.string().email("Format email tidak valid"),
  token: z.string().optional(),
  newPassword: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { step } = body

    if (step === "request") {
      // Step 1: Request token
      const parsed = forgotPasswordSchema.pick({ nip: true, email: true }).safeParse(body)
      
      if (!parsed.success) {
        return NextResponse.json({ message: "Data tidak valid" }, { status: 400 })
      }

      const { nip, email } = parsed.data

      // Check if user exists
      const user = await prisma.user.findFirst({
        where: {
          nip: nip,
          email: email,
        },
      })

      if (!user) {
        return NextResponse.json({ message: "NIP atau email tidak ditemukan" }, { status: 404 })
      }

      // In real app, send email with token here
      // For demo, we'll just return success
      
      return NextResponse.json({ 
        message: "Token berhasil dikirim ke email Anda",
        // In demo, we tell the token for testing
        demoToken: "123456" 
      }, { status: 200 })

    } else if (step === "reset") {
      // Step 2: Reset password with token
      const parsed = forgotPasswordSchema.pick({ 
        nip: true, 
        token: true, 
        newPassword: true 
      }).safeParse(body)
      
      if (!parsed.success) {
        return NextResponse.json({ message: "Data tidak valid" }, { status: 400 })
      }

      const { nip, token, newPassword } = parsed.data

      // In demo, accept token "123456"
      if (token !== "123456") {
        return NextResponse.json({ message: "Token tidak valid" }, { status: 400 })
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ message: "Password minimal 6 karakter" }, { status: 400 })
      }

      // Find user by NIP
      const user = await prisma.user.findUnique({
        where: { nip },
      })

      if (!user) {
        return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword)

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        },
      })

      return NextResponse.json({ message: "Password berhasil direset" }, { status: 200 })
    }

    return NextResponse.json({ message: "Step tidak valid" }, { status: 400 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}

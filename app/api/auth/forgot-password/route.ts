import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { z } from "zod"
import { consumeThrottle, getClientIpFromRequestHeaders } from "@/lib/request-throttle"
import { issuePasswordResetToken, consumePasswordResetToken } from "@/lib/password-reset"
import { validatePasswordPolicy } from "@/lib/password-policy"
import { isDevelopmentRuntime } from "@/lib/runtime-guards"

const forgotPasswordSchema = z.object({
  nip: z.string().min(18, "NIP harus 18 digit").max(18, "NIP harus 18 digit"),
  email: z.string().email("Format email tidak valid"),
  token: z.string().optional(),
  newPassword: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const requestLike = req as Request
    const ip = getClientIpFromRequestHeaders(requestLike.headers)
    const body = await req.json()
    const { step } = body

    if (step === "request") {
      const targetNip = body.nip || 'anonymous'
      const throttle = await consumeThrottle(`forgot:request:${ip}:${targetNip}`, 8, 10 * 60_000)
      if (!throttle.allowed) {
        const retryAfterSeconds = Math.ceil(throttle.retryAfterMs / 1000)
        return NextResponse.json({ message: `Terlalu banyak request. Coba lagi dalam ${retryAfterSeconds} detik.` }, { status: 429 })
      }

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

      // Always return the same message to avoid account enumeration.
      const genericResponse: Record<string, unknown> = {
        message: "Jika data valid, token reset telah dikirim.",
      }

      if (!user) {
        return NextResponse.json(genericResponse, { status: 200 })
      }

      const resetToken = await issuePasswordResetToken(nip)

      // In development only, expose token for local testing.
      if (isDevelopmentRuntime()) {
        genericResponse.demoToken = resetToken
      }

      return NextResponse.json(genericResponse, { status: 200 })

    } else if (step === "reset") {
      const targetNip = body.nip || 'anonymous'
      const throttle = await consumeThrottle(`forgot:reset:${ip}:${targetNip}`, 10, 10 * 60_000)
      if (!throttle.allowed) {
        const retryAfterSeconds = Math.ceil(throttle.retryAfterMs / 1000)
        return NextResponse.json({ message: `Terlalu banyak percobaan reset. Coba lagi dalam ${retryAfterSeconds} detik.` }, { status: 429 })
      }

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

      const tokenResult = await consumePasswordResetToken(nip, token || "")
      if (!tokenResult.valid) {
        return NextResponse.json({ message: "Token tidak valid" }, { status: 400 })
      }

      if (!newPassword) {
        return NextResponse.json({ message: "Password baru wajib diisi" }, { status: 400 })
      }

      // Find user by NIP
      const user = await prisma.user.findUnique({
        where: { nip },
      })

      if (!user) {
        return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
      }

      const policy = validatePasswordPolicy(newPassword, {
        disallowValues: [user.nip, user.name],
      })

      if (!policy.valid) {
        return NextResponse.json({ message: policy.errors.join('. ') }, { status: 400 })
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

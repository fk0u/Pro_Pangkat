import { NextResponse } from "next/server"
import { issueCaptchaToken } from "@/lib/captcha"
import { sixDigitCode } from "@/lib/utils"

export async function GET() {
  const answer = sixDigitCode()
  const captcha = issueCaptchaToken(answer)
  return NextResponse.json(captcha)
}

import { NextRequest, NextResponse } from "next/server";
import { verifyCaptchaToken } from "@/lib/captcha";
import { consumeThrottle, getClientIpFromRequestHeaders } from "@/lib/request-throttle";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequestHeaders(req.headers)
    const throttle = await consumeThrottle(`captcha:verify:${ip}`, 60, 60_000)

    if (!throttle.allowed) {
      const retryAfterSeconds = Math.ceil(throttle.retryAfterMs / 1000)
      return NextResponse.json(
        { valid: false, message: `Too many verification attempts. Retry in ${retryAfterSeconds}s.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      )
    }

    const body = await req.json();

    // Support both legacy (hash) and new (challengeToken) payload names.
    const input = String(body?.input || "").trim();
    const token = String(body?.challengeToken || body?.hash || "").trim();

    if (!input || !token) {
      return NextResponse.json(
        { valid: false, message: "Missing input or challenge token" },
        { status: 400 }
      );
    }

    const result = await verifyCaptchaToken(input, token, { consume: false });

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        message: "CAPTCHA valid"
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: "CAPTCHA invalid",
        reason: result.reason,
      });
    }
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify captcha" },
      { status: 500 }
    );
  }
}

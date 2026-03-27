import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verify as verifyToken } from "otplib";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    // Support two scenarios: 
    // 1. Logged in user enabling 2FA for the first time
    // 2. User confirming 2FA step during login (pending2Fa)
    const isEnabling = session.isLoggedIn && session.user;
    const isLoggingIn = session.pending2Fa && session.user && !session.isLoggedIn;
    
    if (!isEnabling && !isLoggingIn) {
      return NextResponse.json({ message: "Unauthorized status" }, { status: 401 });
    }

    const { id } = session.user!;
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.length !== 6) {
      return NextResponse.json({ message: "Token (OTP) is required and must be 6 digits" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { totpSecret: true, isTwoFactorEnabled: true }
    });

    if (!user || !user.totpSecret) {
      return NextResponse.json({ message: "2FA setup is incomplete or invalid" }, { status: 400 });
    }

    // Verify token
    const isValid = await verifyToken({
      token,
      secret: user.totpSecret
    });

    if (!isValid) {
      return NextResponse.json({ message: "Invalid OTP Token. Please try again." }, { status: 401 });
    }

    // If valid, fully log them in or enable 2FA
    if (isEnabling && !user.isTwoFactorEnabled) {
      // Enable 2FA for account
      await prisma.user.update({
        where: { id },
        data: { isTwoFactorEnabled: true }
      });
      return NextResponse.json({ message: "2FA enabled successfully", success: true }, { status: 200 });
    }

    if (isLoggingIn) {
      // Complete login
      session.isLoggedIn = true;
      session.pending2Fa = undefined;
      session.loginTime = Date.now();
      session.lastActivity = Date.now();
      
      await session.save();
      return NextResponse.json({ message: "Login successful", success: true, user: session.user }, { status: 200 });
    }

    // If it was already enabled and they were just re-verifying
    return NextResponse.json({ message: "Verified", success: true }, { status: 200 });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, nip, name } = session.user;

    // Fetch user to confirm latest state
    const user = await prisma.user.findUnique({
      where: { id },
      select: { isTwoFactorEnabled: true, totpSecret: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a new TOTP secret if they don't have one, or retrieve existing
    const secret = user.totpSecret || generateSecret({ length: 20 });
    
    // Save generated secret to database but don't enable 2FA yet!
    if (!user.totpSecret) {
      await prisma.user.update({
        where: { id },
        data: { totpSecret: secret }
      });
    }

    // Generate otpauth uri
    const serviceName = "ProPangkat";
    const otpauth = generateURI({
      strategy: "totp",
      label: encodeURIComponent(nip),
      issuer: encodeURIComponent(serviceName),
      secret: secret
    });
    
    // Create QR Code image URL
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
      secret,
      qrCodeUrl,
      isTwoFactorEnabled: user.isTwoFactorEnabled
    }, { status: 200 });
  } catch (error) {
    console.error("Generate 2FA error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

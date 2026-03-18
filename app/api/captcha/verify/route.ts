import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get user input and expected hash from request
    const { input, hash } = body;

    console.log("Captcha verify received:", { input, hash });

    if (!input || !hash) {
      console.log("Missing input or hash");
      return NextResponse.json(
        { valid: false, message: "Missing input or hash" },
        { status: 400 }
      );
    }

    // Verify the input against the hash
    const crypto = require('crypto');
    const inputHash = crypto.createHash("sha256").update(input.toUpperCase()).digest("hex");

    const isValid = inputHash === hash;

    console.log("CAPTCHA verification:");
    console.log("- Input:", input);
    console.log("- Input Hash:", inputHash);
    console.log("- Expected Hash:", hash);
    console.log("- Valid?", isValid);

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: "CAPTCHA valid"
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: "CAPTCHA invalid"
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

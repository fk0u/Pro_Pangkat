import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { issueCaptchaToken } from "@/lib/captcha";
import { consumeThrottle, getClientIpFromRequestHeaders } from "@/lib/request-throttle";

// Function to generate a random string
function generateRandomString(length = 5) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters like I, O, 1, 0
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to generate a captcha image as a data URL
function generateCaptchaImage(text: string) {
  const width = 150;
  const height = 50;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Add noise lines
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // Draw text
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = 30 + i * 25;
    const y = 25 + Math.random() * 10 - 5;
    const rotation = (Math.random() - 0.5) * 0.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  // Add noise dots
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Return as data URL
  return canvas.toDataURL();
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequestHeaders(req.headers)
    const throttle = consumeThrottle(`captcha:generate:${ip}`, 30, 60_000)

    if (!throttle.allowed) {
      const retryAfterSeconds = Math.ceil(throttle.retryAfterMs / 1000)
      return NextResponse.json(
        { error: `Too many captcha requests. Retry in ${retryAfterSeconds}s.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      )
    }

    // Generate a random captcha text
    const captchaText = generateRandomString(5);

    // Generate a captcha image
    const captchaImage = generateCaptchaImage(captchaText);

    // Create signed one-time challenge token (not reversible like plain hash)
    const challengeToken = issueCaptchaToken(captchaText);

    // Return challenge token for backward compatibility on existing client state naming
    return NextResponse.json({
      image: captchaImage,
      hash: challengeToken,
      challengeToken,
    });
  } catch (error) {
    console.error("Error generating captcha:", error);
    return NextResponse.json(
      { error: "Failed to generate captcha" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"

export function isDevelopmentRuntime() {
  const appEnv = (process.env.APP_ENV || "development").toLowerCase()
  const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase()
  return appEnv === "development" || nodeEnv === "development"
}

export function debugEndpointBlockedResponse() {
  return NextResponse.json({ message: "Not Found" }, { status: 404 })
}

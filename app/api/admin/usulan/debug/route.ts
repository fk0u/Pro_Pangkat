import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    const isAdmin = session.isLoggedIn && session.user?.role === "ADMIN"

    // Get URL parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const wilayah = searchParams.get("wilayah")
    const periode = searchParams.get("periode")

    // Return diagnostic information
    return NextResponse.json({
      status: "success",
      diagnosticInfo: {
        authentication: {
          isLoggedIn: session.isLoggedIn,
          userRole: session.user?.role || "none",
          isAdmin,
          hasAccess: isAdmin
        },
        requestParams: {
          status,
          page,
          limit,
          search,
          wilayah,
          periode
        },
        prismaTest: {
          connectionOk: await testPrismaConnection()
        },
        serverInfo: {
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error("Diagnostic error:", error)
    return NextResponse.json({ 
      status: "error",
      message: "Diagnostic error", 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Test if Prisma can connect to the database
async function testPrismaConnection() {
  try {
    // Just try to count users - simple query to test connection
    await prisma.user.count()
    return true
  } catch (error) {
    console.error("Prisma connection test failed:", error)
    return false
  }
}

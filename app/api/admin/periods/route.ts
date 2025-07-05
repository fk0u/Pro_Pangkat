import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Get all periods
    const periods = await prisma.timeline.findMany({
      orderBy: {
        startDate: "desc"
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        isActive: true
      }
    })

    return createSuccessResponse(periods)
  } catch (error: any) {
    console.error("Error fetching periods:", error)
    return createErrorResponse(error.message || "Failed to fetch periods")
  }
})

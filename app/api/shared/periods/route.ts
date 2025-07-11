import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

interface User {
  id: string;
  role: string;
  wilayah?: string;
}

export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Both admin and operator can access this endpoint
    if (user.role !== "ADMIN" && user.role !== "OPERATOR") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Get all active periods
    const periods = await prisma.timeline.findMany({
      where: {
        isActive: true,
        ...(user.role === "OPERATOR" && user.wilayah ? {
          OR: [
            { wilayah: null }, // Global timelines
            { wilayah: user.wilayah }, // Timelines for this operator's region
          ]
        } : {})
      },
      orderBy: [
        { priority: "desc" },
        { startDate: "desc" }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        isActive: true,
        priority: true
      }
    })

    return createSuccessResponse(periods)
  } catch (error: unknown) {
    console.error("Error fetching periods:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch periods"
    return createErrorResponse(errorMessage)
  }
})

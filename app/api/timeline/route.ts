import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const active = url.searchParams.get("active")

    const whereClause: any = {}
    if (active === "true") {
      whereClause.isActive = true
    }

    const timelines = await prisma.timeline.findMany({
      where: whereClause,
      orderBy: { startDate: "desc" },
    })

    return createSuccessResponse(timelines)
  } catch (error: any) {
    console.error("Error fetching timelines:", error)
    return createErrorResponse(error.message || "Failed to fetch timelines")
  }
})

export const POST = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const body = await req.json()
      const { title, description, startDate, endDate, isActive } = body

      if (!title || !startDate || !endDate) {
        return createErrorResponse("Title, start date, and end date are required")
      }

      const timeline = await prisma.timeline.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive || false,
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATE_TIMELINE",
          details: `Created timeline: ${title}`,
        },
      })

      return createSuccessResponse(timeline)
    } catch (error: any) {
      console.error("Error creating timeline:", error)
      return createErrorResponse(error.message || "Failed to create timeline")
    }
  },
  ["ADMIN"],
)

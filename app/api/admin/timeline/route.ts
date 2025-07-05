import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { logTimelineActivity } from "@/lib/activity-logger"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    // Get all timelines
    const timelines = await prisma.timeline.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return createSuccessResponse(timelines)
  } catch (error: any) {
    console.error("Error fetching timelines:", error)
    return createErrorResponse(error.message || "Failed to fetch timelines")
  }
})

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const body = await req.json()
    const { title, description, jabatanType, startDate, endDate, isActive, priority, wilayahId } = body

    // Validate required fields
    if (!title || !jabatanType || !startDate || !endDate) {
      return createErrorResponse("Missing required fields", 400)
    }

    // Create timeline
    const timeline = await prisma.timeline.create({
      data: {
        title,
        description,
        jabatanType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : true,
        priority: priority || 1,
        wilayahId
      }
    })

    // Log activity using our new activity logger
    await logTimelineActivity('CREATE', timeline.id, { user }, {
      title: timeline.title,
      period: `${new Date(timeline.startDate).toISOString().split('T')[0]} to ${new Date(timeline.endDate).toISOString().split('T')[0]}`,
      jabatanType: timeline.jabatanType,
      isActive: timeline.isActive
    })

    return createSuccessResponse(timeline, "Timeline created successfully", 201)
  } catch (error: any) {
    console.error("Error creating timeline:", error)
    return createErrorResponse(error.message || "Failed to create timeline")
  }
})

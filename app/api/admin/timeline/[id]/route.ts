import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"
import { logTimelineActivity } from "@/lib/activity-logger"

export const GET = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const timelineId = params.id

    // Get timeline
    const timeline = await prisma.timeline.findUnique({
      where: { id: timelineId }
    })

    if (!timeline) {
      return createErrorResponse("Timeline not found", 404)
    }

    return createSuccessResponse(timeline)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch timeline"
    console.error("Error fetching timeline:", error)
    return createErrorResponse(errorMessage)
  }
})

export const PUT = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const timelineId = params.id
    const body = await req.json()
    const { title, description, jabatanType, startDate, endDate, isActive, priority, wilayahId } = body

    // Validate required fields
    if (!title || !jabatanType || !startDate || !endDate) {
      return createErrorResponse("Missing required fields", 400)
    }

    // Check if timeline exists
    const existingTimeline = await prisma.timeline.findUnique({
      where: { id: timelineId }
    })

    if (!existingTimeline) {
      return createErrorResponse("Timeline not found", 404)
    }

    // Update timeline
    const updatedTimeline = await prisma.timeline.update({
      where: { id: timelineId },
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

    // Log activity using our activity logger
    await logTimelineActivity('UPDATE', timelineId, { user }, {
      title: updatedTimeline.title,
      period: `${new Date(updatedTimeline.startDate).toISOString().split('T')[0]} to ${new Date(updatedTimeline.endDate).toISOString().split('T')[0]}`,
      jabatanType: updatedTimeline.jabatanType,
      isActive: updatedTimeline.isActive,
      changes: {
        from: {
          title: existingTimeline.title,
          period: `${new Date(existingTimeline.startDate).toISOString().split('T')[0]} to ${new Date(existingTimeline.endDate).toISOString().split('T')[0]}`,
          isActive: existingTimeline.isActive
        },
        to: {
          title: updatedTimeline.title,
          period: `${new Date(updatedTimeline.startDate).toISOString().split('T')[0]} to ${new Date(updatedTimeline.endDate).toISOString().split('T')[0]}`,
          isActive: updatedTimeline.isActive
        }
      }
    })

    return createSuccessResponse(updatedTimeline, "Timeline updated successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update timeline"
    console.error("Error updating timeline:", error)
    return createErrorResponse(errorMessage)
  }
})

export const DELETE = withAuth(async (req: NextRequest, user: User, { params }: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const timelineId = params.id

    // Check if timeline exists
    const existingTimeline = await prisma.timeline.findUnique({
      where: { id: timelineId }
    })

    if (!existingTimeline) {
      return createErrorResponse("Timeline not found", 404)
    }

    // Store timeline details before deletion for logging
    const timelineDetails = {
      title: existingTimeline.title,
      period: `${new Date(existingTimeline.startDate).toISOString().split('T')[0]} to ${new Date(existingTimeline.endDate).toISOString().split('T')[0]}`,
      jabatanType: existingTimeline.jabatanType
    }

    // Delete timeline
    await prisma.timeline.delete({
      where: { id: timelineId }
    })

    // Log activity using our activity logger
    await logTimelineActivity('DELETE', timelineId, { user }, timelineDetails)

    return createSuccessResponse(null, "Timeline deleted successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete timeline"
    console.error("Error deleting timeline:", error)
    return createErrorResponse(errorMessage)
  }
})

import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { createErrorResponse, createSuccessResponse, withAuth } from "@/lib/api-utils"
import { Role, User } from "@prisma/client"

// GET: Get user details by ID
export const GET = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    
    // Get user details
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Only include non-sensitive fields
      }
    })

    if (!targetUser) {
      return createErrorResponse("User not found", 404)
    }

    return createSuccessResponse(targetUser)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch user details"
    console.error("Error fetching user details:", error)
    return createErrorResponse(errorMessage)
  }
})

// DELETE: Delete a user role (revert to default)
export const DELETE = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return createErrorResponse("User not found", 404)
    }

    if (id === user.id) {
      return createErrorResponse("Anda tidak dapat mereset role Admin Anda sendiri", 400)
    }

    // Reset user role to default (USER)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "RESET_USER_ROLE",
        details: { 
          userId: updatedUser.id, 
          userName: updatedUser.name,
          oldRole: targetUser.role,
          newRole: updatedUser.role
        },
      },
    })

    return createSuccessResponse(
      updatedUser, 
      "Role berhasil direset ke USER"
    )
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to reset user role"
    console.error("Error resetting user role:", error)
    return createErrorResponse(errorMessage)
  }
})

// PATCH: Update user role
export const PATCH = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    const data = await req.json()
    
    // Validate input
    if (!data.role) {
      return createErrorResponse("Role is required")
    }

    // Check if role is valid
    if (!Object.values(Role).includes(data.role)) {
      return createErrorResponse("Invalid role")
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return createErrorResponse("User not found", 404)
    }

    if (id === user.id && data.role !== "ADMIN") {
      return createErrorResponse("Anda tidak dapat menurunkan role Admin Anda sendiri", 400)
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_USER_ROLE",
        details: { 
          userId: updatedUser.id, 
          userName: updatedUser.name,
          oldRole: targetUser.role,
          newRole: updatedUser.role
        },
      },
    })

    return createSuccessResponse(
      updatedUser, 
      "Role berhasil diperbarui"
    )
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update role"
    console.error("Error updating role:", error)
    return createErrorResponse(errorMessage)
  }
})

import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// DELETE: Remove a role from a user
export const DELETE = withAuth(async (req: NextRequest, user: User, context: { params: { userId: string, roleId: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const { userId, roleId } = context.params
    
    // Check if assignment exists
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        }
      },
      include: {
        role: true,
        user: {
          select: {
            name: true,
          }
        }
      }
    })

    if (!userRole) {
      return createErrorResponse("User role assignment not found", 404)
    }

    // Delete the assignment
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        }
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "REMOVE_ROLE",
        details: { 
          roleId, 
          roleName: userRole.role.name,
          targetUserId: userId,
          targetUserName: userRole.user.name,
        },
      },
    })

    return createSuccessResponse(null, "Role removed from user successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to remove role from user"
    console.error("Error removing role from user:", error)
    return createErrorResponse(errorMessage)
  }
})

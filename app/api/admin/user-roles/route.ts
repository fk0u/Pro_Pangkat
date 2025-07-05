import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// GET: Get all users with their assigned roles
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userRoles: {
          include: {
            role: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.role,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        color: ur.role.color,
        isSystem: ur.role.isSystem,
      })),
    }))

    return createSuccessResponse(formattedUsers)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users with roles"
    console.error("Error fetching users with roles:", error)
    return createErrorResponse(errorMessage)
  }
})

// POST: Assign a role to a user
export const POST = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const data = await req.json()
    
    // Validate input
    if (!data.userId || !data.roleId) {
      return createErrorResponse("User ID and Role ID are required")
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: data.userId },
    })

    if (!userExists) {
      return createErrorResponse("User not found", 404)
    }

    // Check if role exists
    const roleExists = await prisma.roleDefinition.findUnique({
      where: { id: data.roleId },
    })

    if (!roleExists) {
      return createErrorResponse("Role not found", 404)
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: data.userId,
          roleId: data.roleId,
        }
      },
    })

    if (existingAssignment) {
      return createErrorResponse("User already has this role assigned")
    }

    // Create new user role assignment
    const userRole = await prisma.userRole.create({
      data: {
        userId: data.userId,
        roleId: data.roleId,
      },
      include: {
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ASSIGN_ROLE",
        details: { 
          roleId: data.roleId, 
          roleName: roleExists.name,
          targetUserId: data.userId,
          targetUserName: userExists.name,
        },
      },
    })

    return createSuccessResponse(userRole, "Role assigned to user successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to assign role to user"
    console.error("Error assigning role to user:", error)
    return createErrorResponse(errorMessage)
  }
})

import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// GET: Fetch a specific permission with all roles that have it
export const GET = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          }
        }
      }
    })

    if (!permission) {
      return createErrorResponse("Permission not found", 404)
    }

    // Format roles data
    const roles = permission.roles.map(rp => ({
      id: rp.role.id,
      name: rp.role.name,
      description: rp.role.description,
      color: rp.role.color,
      isSystem: rp.role.isSystem,
    }))

    return createSuccessResponse({
      ...permission,
      roles,
    })
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch permission details"
    console.error("Error fetching permission details:", error)
    return createErrorResponse(errorMessage)
  }
})

// PATCH: Update a permission
export const PATCH = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    const data = await req.json()
    
    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: { id },
    })

    if (!permission) {
      return createErrorResponse("Permission not found", 404)
    }

    // Check for duplicate key if changing
    if (data.key && data.key !== permission.key) {
      const existingPermission = await prisma.permission.findFirst({
        where: { 
          key: data.key,
          id: { not: id }
        },
      })

      if (existingPermission) {
        return createErrorResponse("Permission with this key already exists")
      }
    }

    // Update permission
    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: {
        name: data.name ?? permission.name,
        key: data.key ?? permission.key,
        description: data.description ?? permission.description,
        module: data.module ?? permission.module,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_PERMISSION",
        details: { permissionId: permission.id, permissionName: permission.name },
      },
    })

    return createSuccessResponse(updatedPermission, "Permission updated successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update permission"
    console.error("Error updating permission:", error)
    return createErrorResponse(errorMessage)
  }
})

// DELETE: Delete a permission
export const DELETE = withAuth(async (req: NextRequest, user: User, context: { params: { id: string } }) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const id = context.params.id
    
    // Find the permission
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: true,
      }
    })

    if (!permission) {
      return createErrorResponse("Permission not found", 404)
    }

    // Check if permission is assigned to roles
    if (permission.roles.length > 0) {
      return createErrorResponse("Cannot delete a permission that is assigned to roles", 400)
    }

    // Delete the permission
    await prisma.permission.delete({
      where: { id },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE_PERMISSION",
        details: { permissionId: permission.id, permissionName: permission.name },
      },
    })

    return createSuccessResponse(null, "Permission deleted successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete permission"
    console.error("Error deleting permission:", error)
    return createErrorResponse(errorMessage)
  }
})

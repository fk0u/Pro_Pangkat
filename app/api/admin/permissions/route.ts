import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// GET: Fetch all permissions
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ],
    })

    return createSuccessResponse(permissions)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch permissions"
    console.error("Error fetching permissions:", error)
    return createErrorResponse(errorMessage)
  }
})

// POST: Create a new permission
export const POST = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const data = await req.json()
    
    // Validate input
    if (!data.name || !data.key || !data.module) {
      return createErrorResponse("Name, key, and module are required fields")
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findFirst({
      where: { 
        OR: [
          { name: data.name },
          { key: data.key }
        ]
      },
    })

    if (existingPermission) {
      return createErrorResponse("Permission with this name or key already exists")
    }

    // Create new permission
    const newPermission = await prisma.permission.create({
      data: {
        name: data.name,
        key: data.key,
        description: data.description || '',
        module: data.module,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CREATE_PERMISSION",
        details: { permissionId: newPermission.id, permissionName: newPermission.name },
      },
    })

    return createSuccessResponse(newPermission, "Permission created successfully")
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create permission"
    console.error("Error creating permission:", error)
    return createErrorResponse(errorMessage)
  }
})

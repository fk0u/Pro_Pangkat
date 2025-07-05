import { NextResponse } from "next/server"
import { getSession } from "./auth"
import { prisma } from "./prisma"
import type { Role } from "@prisma/client"
import type { ApiResponse, User } from "./types" // Assuming ApiResponse is declared in a separate file

export const createSuccessResponse = (data: any, message?: string): NextResponse<ApiResponse> => {
  return NextResponse.json({
    success: true,
    message,
    data,
  })
}

export const createErrorResponse = (error: string, status = 400): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status },
  )
}

export const checkAuth = async (allowedRoles?: Role[]) => {
  const session = await getSession()

  if (!session.isLoggedIn) {
    throw new Error("Unauthorized")
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    throw new Error("Forbidden")
  }

  return session.user
}

/**
 * Check if a user has a specific permission
 */
export async function checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
  try {
    // Get the permission by its key
    const permission = await prisma.permission.findUnique({
      where: { key: permissionKey },
    })
    
    if (!permission) {
      console.warn(`Permission with key ${permissionKey} not found`)
      return false
    }
    
    // Check if the user has the permission through any assigned role
    const userRoleWithPermission = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          permissions: {
            some: {
              permissionId: permission.id,
            },
          },
        },
      },
    })
    
    return !!userRoleWithPermission
  } catch (error) {
    console.error('Error checking user permission:', error)
    return false
  }
}

// Type for permission check options
export interface PermissionCheckOptions {
  requiredPermission?: string
  allowedRoles?: Role[]
}

export const withAuth = (handler: Function, options?: PermissionCheckOptions | Role[]) => {
  return async (req: Request, ...args: any[]) => {
    try {
      // Handle backward compatibility with old withAuth signature
      let allowedRoles: Role[] | undefined;
      let requiredPermission: string | undefined;
      
      if (Array.isArray(options)) {
        // Old style: withAuth(handler, [Role.ADMIN, Role.OPERATOR])
        allowedRoles = options;
      } else if (options) {
        // New style: withAuth(handler, { allowedRoles: [Role.ADMIN], requiredPermission: 'MANAGE_USERS' })
        allowedRoles = options.allowedRoles;
        requiredPermission = options.requiredPermission;
      }
      
      const user = await checkAuth(allowedRoles)
      
      // Check permission if specified
      if (requiredPermission) {
        const hasPermission = await checkUserPermission(user.id, requiredPermission)
        if (!hasPermission) {
          throw new Error("Forbidden")
        }
      }
      
      return await handler(req, user, ...args)
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return createErrorResponse("Unauthorized", 401)
      } else if (error.message === "Forbidden") {
        return createErrorResponse("Forbidden", 403)
      }
      return createErrorResponse(error.message || "Internal server error", 500)
    }
  }
}

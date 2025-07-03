import { NextResponse } from "next/server"
import { getSession } from "./auth"
import type { Role } from "@prisma/client"
import type { ApiResponse } from "./types" // Assuming ApiResponse is declared in a separate file

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

export const withAuth = (handler: Function, allowedRoles?: Role[]) => {
  return async (req: Request, ...args: any[]) => {
    try {
      const user = await checkAuth(allowedRoles)
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

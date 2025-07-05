import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const unitKerjaList = await prisma.unitKerja.findMany({
      select: {
        id: true,
        nama: true
      },
      orderBy: {
        nama: "asc"
      }
    })

    return createSuccessResponse(unitKerjaList)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch unit kerja"
    console.error("Error fetching unit kerja:", error)
    return createErrorResponse(errorMessage)
  }
})

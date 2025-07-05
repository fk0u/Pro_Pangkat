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

    const wilayahList = await prisma.wilayahMaster.findMany({
      select: {
        id: true,
        kode: true,
        nama: true,
        namaLengkap: true,
        isActive: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        nama: "asc"
      }
    })

    return createSuccessResponse(wilayahList)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch wilayah"
    console.error("Error fetching wilayah:", error)
    return createErrorResponse(errorMessage)
  }
})

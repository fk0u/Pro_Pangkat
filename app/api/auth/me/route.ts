import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Get complete user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        unitKerja: true,
        wilayah: true,
        phone: true,
        address: true,
        profilePictureUrl: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!userData) {
      return createErrorResponse("User not found", 404)
    }

    return createSuccessResponse({
      user: userData,
    })
  } catch (error: any) {
    console.error("Error fetching user data:", error)
    return createErrorResponse(error.message || "Failed to fetch user data")
  }
})

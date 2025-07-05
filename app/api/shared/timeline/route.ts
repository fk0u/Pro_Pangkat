import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import type { User } from "@/lib/types"

// This endpoint is accessible by all authenticated users
export const GET = withAuth(async (req: NextRequest, user: User) => {
  try {
    // Build where condition based on user role and wilayah
    let whereCondition: any = {
      isActive: true
    };

    // Filter by role if not admin
    if (user.role !== "ADMIN") {
      // For PEGAWAI, filter by jabatanType matching their position
      if (user.role === "PEGAWAI" && user.jenisJabatan) {
        whereCondition.OR = [
          { jabatanType: user.jenisJabatan.toLowerCase() },
          { jabatanType: "all" }
        ];
      }

      // Filter by wilayah if user has one
      if (user.wilayahId) {
        whereCondition.OR = [
          ...(whereCondition.OR || []),
          { wilayahId: user.wilayahId },
          { wilayahId: null }
        ];
      }
    }

    const timelines = await prisma.timeline.findMany({
      where: whereCondition,
      orderBy: [
        { priority: "desc" },
        { startDate: "asc" }
      ],
      include: {
        wilayahRelasi: {
          select: {
            nama: true,
            namaLengkap: true
          }
        }
      }
    });

    return createSuccessResponse(timelines)
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch timelines"
    console.error("Error fetching timelines:", error)
    return createErrorResponse(errorMessage)
  }
})

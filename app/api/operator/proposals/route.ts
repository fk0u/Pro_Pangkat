import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal } from "@prisma/client"

// GET: Fetch all proposals for operators
export const GET = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      // Check if user is operator or admin
      if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Parse query parameters
      const url = new URL(req.url)
      const status = url.searchParams.get("status")
      const periode = url.searchParams.get("periode")
      const unitKerja = url.searchParams.get("unitKerja")

      // Build where clause
      const where: any = {}

      // Filter by status
      if (status) {
        where.status = status
      } else {
        // By default, exclude completed proposals
        where.status = {
          not: StatusProposal.SELESAI,
        }
      }

      // Filter by periode
      if (periode) {
        where.periode = periode
      }

      // For operators, filter by their wilayah
      if (user.role === "OPERATOR" && user.wilayah) {
        where.pegawai = {
          wilayah: user.wilayah,
        }
      }

      // Filter by unit kerja
      if (unitKerja) {
        where.pegawai = {
          ...where.pegawai,
          unitKerja: {
            contains: unitKerja,
            mode: "insensitive",
          },
        }
      }

      // Fetch proposals
      const proposals = await prisma.promotionProposal.findMany({
        where,
        include: {
          pegawai: {
            select: {
              id: true,
              nip: true,
              name: true,
              unitKerja: true,
              golongan: true,
              jabatan: true,
              jenisJabatan: true,
            },
          },
          documents: {
            include: {
              documentRequirement: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })

      return createSuccessResponse(proposals)
    } catch (error: any) {
      console.error("Error fetching proposals:", error)
      return createErrorResponse(error.message || "Failed to fetch proposals")
    }
  },
  ["OPERATOR", "ADMIN"],
)

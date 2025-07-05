import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      console.log("Unauthorized access attempt - wrong role:", user.role);
      return createErrorResponse("Unauthorized", 403)
    }

    const url = new URL(req.url)
    console.log("Admin reports API called with URL:", req.url);
    const periodId = url.searchParams.get("periodId")
    const status = url.searchParams.get("status")
    const wilayahId = url.searchParams.get("wilayahId")
    const unitKerjaId = url.searchParams.get("unitKerjaId")
    const jenjang = url.searchParams.get("jenjang") 
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const search = url.searchParams.get("search")
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "100") // Default to higher limit for reports

    // Build the where clause
    const where: any = {}

    // Add period filter if provided
    if (periodId) {
      where.periode = periodId
    }

    // Add status filter if provided
    if (status && status !== "all") {
      where.status = status
    }
    
    // Filter by date range
    if (startDate) {
      try {
        where.createdAt = {
          ...(where.createdAt || {}),
          gte: new Date(startDate)
        }
      } catch (error) {
        console.error("Invalid startDate format:", startDate)
      }
    }
    
    if (endDate) {
      try {
        where.createdAt = {
          ...(where.createdAt || {}),
          lte: new Date(endDate)
        }
      } catch (error) {
        console.error("Invalid endDate format:", endDate)
      }
    }
    
    // Search functionality
    if (search) {
      where.OR = [
        {
          pegawai: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          pegawai: {
            nip: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }
    
    // Advanced filters for pegawai and unit kerja
    if (wilayahId || unitKerjaId || jenjang) {
      where.pegawai = {
        ...(where.pegawai || {}),
        ...(wilayahId ? { wilayahId } : {}),
        ...(unitKerjaId ? { unitKerjaId } : {}),
        ...(jenjang ? { 
          unitKerja: {
            jenjang
          } 
        } : {})
      }
    }

    // Get proposals with pagination
    const [proposals, total] = await Promise.all([
      prisma.promotionProposal.findMany({
        where,
        include: {
          pegawai: {
            select: {
              id: true,
              name: true,
              nip: true,
              jabatan: true,
              golongan: true,
              tmtGolongan: true,
              jenisJabatan: true,
              unitKerja: true,
              wilayah: true,
              wilayahRelasi: true
            }
          },
          documents: {
            include: {
              documentRequirement: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.promotionProposal.count({ where })
    ])

    // Make sure proposals is always an array
    const safeProposals = Array.isArray(proposals) ? proposals : [];
    
    console.log("Admin Reports API Response:", {
      totalCount: total,
      returnedCount: safeProposals.length,
      isArray: Array.isArray(safeProposals)
    });

    return createSuccessResponse({
      data: safeProposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Error fetching reports:", error)
    // Log the full error for debugging
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return createErrorResponse(error.message || "Failed to fetch reports")
  }
})

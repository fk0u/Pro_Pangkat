import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only pegawai can access this endpoint
    if (user.role !== "PEGAWAI") {
      return createErrorResponse("Access denied", 403)
    }

    // Get URL parameters for filtering and pagination
    const url = new URL(req.url)
    const statusFilter = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const periodeFilter = url.searchParams.get("periode")
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      pegawaiId: user.id
    }

    // Add status filter
    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter as StatusProposal
    }

    // Add search filter (search in periode)
    if (search) {
      whereClause.periode = {
        contains: search,
        mode: "insensitive"
      }
    }
    
    // Add periode filter
    if (periodeFilter && periodeFilter !== "all") {
      whereClause.periode = periodeFilter
    }

    // Get total count for pagination
    const totalCount = await prisma.promotionProposal.count({
      where: whereClause
    })

    // Get document requirements for missing documents calculation
    const documentRequirements = await prisma.documentRequirement.findMany({
      where: {
        isRequired: true
      },
      select: {
        id: true,
        code: true
      }
    })

    // Get paginated proposals with complete details
    const proposals = await prisma.promotionProposal.findMany({
      where: whereClause,
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            unitKerja: true,
            jabatan: true,
            golongan: true,
          },
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                isRequired: true,
              }
            }
          }
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    })

    // Process proposals for frontend
    const processedProposals = proposals.map(proposal => {
      // Calculate document stats
      const totalDocuments = proposal.documents.length
      const approvedDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.DISETUJUI
      ).length
      const pendingDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
      ).length
      const needsRevisionDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.PERLU_PERBAIKAN
      ).length
      const rejectedDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.DITOLAK
      ).length

      // Check for missing required documents
      const uploadedDocCodes = proposal.documents.map(doc => 
        doc.documentRequirement.code
      )
      const missingDocuments = documentRequirements.filter(
        req => !uploadedDocCodes.includes(req.code)
      ).length

      // Determine if proposal needs attention
      const needsAttention = missingDocuments > 0 && 
        ['DRAFT', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'PERLU_PERBAIKAN_DARI_DINAS', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(proposal.status)

      // Handle unitKerja if it's an object
      let unitKerja = proposal.pegawai.unitKerja
      if (unitKerja && typeof unitKerja === 'object' && unitKerja !== null) {
        // @ts-ignore - unitKerja might be an object with name property
        unitKerja = unitKerja.nama || unitKerja.name || "Unit Kerja Tidak Tersedia"
      }

      return {
        id: proposal.id,
        periode: proposal.periode,
        status: proposal.status,
        notes: proposal.notes,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        pegawai: {
          ...proposal.pegawai,
          unitKerja
        },
        documentStats: {
          total: totalDocuments,
          approved: approvedDocuments,
          pending: pendingDocuments,
          needsRevision: needsRevisionDocuments,
          rejected: rejectedDocuments,
          missingRequired: missingDocuments
        },
        needsAttention,
        canUploadDocuments: ['DRAFT', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(proposal.status)
      }
    })

    return createSuccessResponse({
      proposals: processedProposals,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit
      }
    })
  } catch (error: any) {
    console.error("Error fetching proposals data:", error)
    return createErrorResponse(error.message || "Failed to fetch proposals data", 500)
  }
})

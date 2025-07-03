import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Hanya operator yang bisa mengakses endpoint ini
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's wilayah
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { wilayah: true },
    })

    if (!operatorData?.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    // Get URL parameters for filtering and pagination
    const url = new URL(req.url)
    const statusFilter = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const unitKerjaFilter = url.searchParams.get("unitKerja")
    const periodeFilter = url.searchParams.get("periode")
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      pegawai: {
        wilayah: operatorData.wilayah,
      }
    }

    // Add status filter
    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter as StatusProposal
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          pegawai: {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        },
        {
          pegawai: {
            nip: {
              contains: search
            }
          }
        }
      ]
    }

    // Add unit kerja filter
    if (unitKerjaFilter && unitKerjaFilter !== "all") {
      whereClause.pegawai.unitKerja = unitKerjaFilter
    }
    
    // Add periode filter
    if (periodeFilter && periodeFilter !== "all") {
      whereClause.periode = periodeFilter
    }

    // Get total count for pagination
    const totalCount = await prisma.promotionProposal.count({
      where: whereClause
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
            wilayah: true,
          },
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                id: true,
                name: true,
                description: true,
                isRequired: true,
                category: true,
                format: true,
                maxSize: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    // If no proposals found, return an empty success response instead of an error
    if (proposals.length === 0 && totalCount === 0) {
      return createSuccessResponse({
        proposals: [],
        stats: {
          total: 0,
          menunggu: 0,
          diproses: 0,
          disetujui: 0,
          dikembalikan: 0,
        },
        filterOptions: {
          unitKerja: [],
          status: [
            { value: StatusProposal.DIAJUKAN, label: "Menunggu Verifikasi" },
            { value: StatusProposal.DIPROSES_OPERATOR, label: "Sedang Diproses" },
            { value: StatusProposal.DISETUJUI_OPERATOR, label: "Disetujui" },
            { value: StatusProposal.DIKEMBALIKAN_OPERATOR, label: "Dikembalikan" },
          ]
        },
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          perPage: limit
        }
      })
    }

    // Process proposals for frontend
    const processedProposals = proposals.map(proposal => {
      const totalDocuments = proposal.documents.length
      const completedDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.DISETUJUI
      ).length
      const pendingDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
      ).length
      const rejectedDocuments = proposal.documents.filter(
        doc => doc.status === StatusDokumen.DITOLAK
      ).length

      return {
        id: proposal.id,
        periode: proposal.periode,
        status: proposal.status,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        pegawai: proposal.pegawai,
        documents: proposal.documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          originalName: doc.originalName,
          status: doc.status,
          catatan: doc.catatan,
          uploadedAt: doc.uploadedAt,
          verifiedAt: doc.verifiedAt,
          requirement: doc.documentRequirement,
        })),
        documentProgress: {
          total: totalDocuments,
          completed: completedDocuments,
          pending: pendingDocuments,
          rejected: rejectedDocuments,
          percentage: totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0,
        }
      }
    })

    // Get unique unit kerja for filter options
    const unitKerjaOptions = await prisma.user.findMany({
      where: {
        role: "PEGAWAI",
        wilayah: operatorData.wilayah,
      },
      select: { unitKerja: true },
      distinct: ["unitKerja"],
    })

    // Get total count for all status types
    const [totalAllCount, menungguCount, diprosesCount, disetujuiCount, dikembalikanCount] = await Promise.all([
      prisma.promotionProposal.count({
        where: {
          pegawai: {
            wilayah: operatorData.wilayah,
          }
        }
      }),
      prisma.promotionProposal.count({
        where: {
          status: StatusProposal.DIAJUKAN,
          pegawai: {
            wilayah: operatorData.wilayah,
          }
        }
      }),
      prisma.promotionProposal.count({
        where: {
          status: StatusProposal.DIPROSES_OPERATOR,
          pegawai: {
            wilayah: operatorData.wilayah,
          }
        }
      }),
      prisma.promotionProposal.count({
        where: {
          status: StatusProposal.DISETUJUI_OPERATOR,
          pegawai: {
            wilayah: operatorData.wilayah,
          }
        }
      }),
      prisma.promotionProposal.count({
        where: {
          status: StatusProposal.DIKEMBALIKAN_OPERATOR,
          pegawai: {
            wilayah: operatorData.wilayah,
          }
        }
      }),
    ])

    // Get statistics
    const stats = {
      total: totalAllCount,
      menunggu: menungguCount,
      diproses: diprosesCount,
      disetujui: disetujuiCount,
      dikembalikan: dikembalikanCount,
    }

    return createSuccessResponse({
      proposals: processedProposals,
      stats,
      filterOptions: {
        unitKerja: unitKerjaOptions.map(u => u.unitKerja).filter(Boolean),
        status: [
          { value: StatusProposal.DIAJUKAN, label: "Menunggu Verifikasi" },
          { value: StatusProposal.DIPROSES_OPERATOR, label: "Sedang Diproses" },
          { value: StatusProposal.DISETUJUI_OPERATOR, label: "Disetujui" },
          { value: StatusProposal.DIKEMBALIKAN_OPERATOR, label: "Dikembalikan" },
        ]
      },
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit
      }
    })
  } catch (error: any) {
    console.error("Error fetching inbox data:", error)
    
    // Instead of returning an error, return an empty success response
    return createSuccessResponse({
      proposals: [],
      stats: {
        total: 0,
        menunggu: 0,
        diproses: 0,
        disetujui: 0,
        dikembalikan: 0,
      },
      filterOptions: {
        unitKerja: [],
        status: [
          { value: StatusProposal.DIAJUKAN, label: "Menunggu Verifikasi" },
          { value: StatusProposal.DIPROSES_OPERATOR, label: "Sedang Diproses" },
          { value: StatusProposal.DISETUJUI_OPERATOR, label: "Disetujui" },
          { value: StatusProposal.DIKEMBALIKAN_OPERATOR, label: "Dikembalikan" },
        ]
      },
      pagination: {
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        perPage: 10
      }
    })
  }
})

// API untuk approve/reject proposal
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    const body = await req.json()
    const { proposalId, action, catatan } = body

    if (!proposalId || !action) {
      return createErrorResponse("Missing required fields", 400)
    }

    const proposal = await prisma.promotionProposal.findUnique({
      where: { id: proposalId },
      include: { pegawai: true }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    let newStatus: StatusProposal
    switch (action) {
      case "approve":
        newStatus = StatusProposal.DISETUJUI_OPERATOR
        break
      case "reject":
        newStatus = StatusProposal.DIKEMBALIKAN_OPERATOR
        break
      case "process":
        newStatus = StatusProposal.DIPROSES_OPERATOR
        break
      default:
        return createErrorResponse("Invalid action", 400)
    }

    // Update proposal status
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: proposalId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `${action.toUpperCase()}_PROPOSAL`,
        details: `${action === "approve" ? "Menyetujui" : action === "reject" ? "Mengembalikan" : "Memproses"} usulan ${proposal.pegawai.name}${catatan ? ` dengan catatan: ${catatan}` : ""}`,
        metadata: {
          proposalId,
          action,
          catatan,
        }
      }
    })

    return createSuccessResponse({
      message: `Proposal berhasil ${action === "approve" ? "disetujui" : action === "reject" ? "dikembalikan" : "diproses"}`,
      proposal: updatedProposal
    })
  } catch (error: any) {
    console.error("Error updating proposal:", error)
    return createErrorResponse(error.message || "Failed to update proposal")
  }
})

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

    // Get URL parameters for filtering
    const url = new URL(req.url)
    const statusFilter = url.searchParams.get("status")
    const search = url.searchParams.get("search")
    const unitKerjaFilter = url.searchParams.get("unitKerja")

    // Build where clause
    const whereClause: any = {
      pegawai: {
        unitKerja: {
          wilayah: operatorData.wilayah
        }
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
            },
            unitKerja: {
              wilayah: operatorData.wilayah
            }
          }
        },
        {
          pegawai: {
            nip: {
              contains: search
            },
            unitKerja: {
              wilayah: operatorData.wilayah
            }
          }
        }
      ]
      // Remove the pegawai constraint from the main where clause since we're using OR
      delete whereClause.pegawai
    }

    // Add unit kerja filter
    if (unitKerjaFilter && unitKerjaFilter !== "all") {
      if (search) {
        // If search is active, modify the OR conditions
        whereClause.OR.forEach((condition: any) => {
          condition.pegawai.unitKerjaId = unitKerjaFilter
        })
      } else {
        // If no search, add unit kerja filter to main pegawai clause
        whereClause.pegawai.unitKerjaId = unitKerjaFilter
      }
    }

    // Get proposals with complete details
    const proposals = await prisma.promotionProposal.findMany({
      where: whereClause,
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            unitKerja: {
              select: {
                id: true,
                nama: true,
                wilayah: true
              }
            },
            jabatan: true,
            golongan: true,
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
    })

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

    // Get statistics
    const stats = {
      total: proposals.length,
      menunggu: proposals.filter(p => p.status === StatusProposal.DIAJUKAN).length,
      diproses: proposals.filter(p => p.status === StatusProposal.DIPROSES_OPERATOR).length,
      disetujui: proposals.filter(p => p.status === StatusProposal.DISETUJUI_OPERATOR).length,
      dikembalikan: proposals.filter(p => p.status === StatusProposal.DIKEMBALIKAN_OPERATOR).length,
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
      }
    })
  } catch (error: any) {
    console.error("Error fetching inbox data:", error)
    return createErrorResponse(error.message || "Failed to fetch inbox data")
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

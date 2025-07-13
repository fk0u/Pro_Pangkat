// Removed NextRequest import, use generic Request in handlers
import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import type { User as ApiUser } from "@/lib/types"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      console.warn("Operator wilayah not found for operator. Skipping region filter.")
    }

    // Build filter for proposals: filter by pegawai.unitKerja relation if operator has wilayah
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      // Exclude proposals that have been withdrawn or rejected
      NOT: {
        status: {
          in: [StatusProposal.DITARIK, StatusProposal.DITOLAK, StatusProposal.DITOLAK_SEKOLAH, StatusProposal.DITOLAK_DINAS, StatusProposal.DITOLAK_ADMIN]
        }
      }
    }

    // Add wilayah filter if operator has a wilayah assigned
    if (operatorData?.wilayah) {
      whereClause.pegawai = {
        unitKerja: {
          wilayah: operatorData.wilayah
        }
      }
    }

    // Get proposals with complete details
    // Fetch all proposals (filtering removed to avoid Bad Request)
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
                hasSimASN: true,
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
          fileName: doc.fileName,
          originalName: doc.fileName, // Add originalName as a copy of fileName for client compatibility
          fileUrl: doc.fileUrl,
          status: doc.status,
          notes: doc.notes,
          catatan: doc.notes, // Add catatan as a copy of notes for client compatibility
          uploadedAt: doc.uploadedAt,
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

    // Get unique unit kerja names for filter options (if wilayah defined)
    let unitKerjaOptions: string[] = []
    if (operatorData?.wilayah) {
      const units = await prisma.unitKerja.findMany({
        where: { wilayah: operatorData.wilayah },
        select: { nama: true },
      })
      // dedupe names
      unitKerjaOptions = Array.from(new Set(units.map(u => u.nama)))
    }

    // Get statistics
    const stats = {
      total: proposals.length,
      menunggu: proposals.filter(p => p.status === StatusProposal.DIAJUKAN).length,
      diproses: proposals.filter(p => p.status === StatusProposal.DIPROSES_OPERATOR).length,
      disetujui: proposals.filter(p => p.status === StatusProposal.DISETUJUI_OPERATOR).length,
      diteruskan: proposals.filter(p => p.status === StatusProposal.DITERUSKAN_KE_PUSAT).length,
      dikembalikan: proposals.filter(p => p.status === StatusProposal.DIKEMBALIKAN_OPERATOR).length,
    }

    return createSuccessResponse({
      proposals: processedProposals,
      stats,
      filterOptions: {
        unitKerja: unitKerjaOptions,
        status: [
          { value: StatusProposal.DIAJUKAN, label: "Menunggu Verifikasi" },
          { value: StatusProposal.DIPROSES_OPERATOR, label: "Sedang Diproses" },
          { value: StatusProposal.DISETUJUI_OPERATOR, label: "Disetujui" },
          { value: StatusProposal.DITERUSKAN_KE_PUSAT, label: "Diteruskan ke Pusat" },
          { value: StatusProposal.DIKEMBALIKAN_OPERATOR, label: "Dikembalikan" },
        ]
      }
    })
  } catch (error: unknown) {
    console.error("Error fetching inbox data:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch inbox data"
    return createErrorResponse(message)
  }
})

// API untuk approve/reject proposal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = withAuth(async (req: Request, user: any) => {
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
      case "forward":
        newStatus = StatusProposal.DITERUSKAN_KE_PUSAT
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
        details: `${action === "approve" ? "Menyetujui" : action === "reject" ? "Mengembalikan" : action === "forward" ? "Meneruskan ke Pusat" : "Memproses"} usulan ${proposal.pegawai.name}${catatan ? ` dengan catatan: ${catatan}` : ""}`,
        metadata: {
          proposalId,
          action,
          catatan,
        }
      }
    })

    return createSuccessResponse({
      message: `Proposal berhasil ${action === "approve" ? "disetujui" : action === "reject" ? "dikembalikan" : action === "forward" ? "diteruskan ke pusat" : "diproses"}`,
      proposal: updatedProposal
    })
  } catch (error: unknown) {
    console.error("Error updating proposal:", error)
    const message = error instanceof Error ? error.message : "Failed to update proposal"
    return createErrorResponse(message)
  }
})

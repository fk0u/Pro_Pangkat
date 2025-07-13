import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusDokumen } from "@prisma/client"

// Endpoint to get a specific proposal with details
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Only operators and admins can access this
    if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
      return createErrorResponse("Access denied", 403)
    }

    const proposalId = params.id
    if (!proposalId) {
      return createErrorResponse("Missing proposal ID", 400)
    }

    // Get the proposal with complete details
    const proposal = await prisma.promotionProposal.findUnique({
      where: { id: proposalId },
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
                hasSimASN: true,
              }
            }
          }
        },
      },
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // Process proposal for frontend
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

    const processedProposal = {
      id: proposal.id,
      periode: proposal.periode,
      status: proposal.status,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      pegawai: proposal.pegawai,
      documents: proposal.documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        originalName: doc.fileName, // Use fileName as originalName for compatibility
        fileUrl: doc.fileUrl, // Add fileUrl for previewing documents
        status: doc.status,
        catatan: doc.notes, // Use notes as catatan for compatibility
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

    return createSuccessResponse(processedProposal)
  } catch (error: unknown) {
    console.error("Error fetching proposal:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch proposal"
    return createErrorResponse(message)
  }
})

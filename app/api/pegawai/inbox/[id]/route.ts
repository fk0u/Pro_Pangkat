import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

// Handle GET request for a specific proposal
export const GET = withAuth(async (req: NextRequest, user: { id: string, role: string }) => {
  try {
    // Only pegawai can access this endpoint
    if (user.role !== "PEGAWAI") {
      return createErrorResponse("Access denied", 403)
    }

    // Extract proposal ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const proposalId = pathParts[pathParts.length - 1]

    if (!proposalId) {
      return createErrorResponse("Proposal ID is required", 400)
    }

    // Fetch the proposal with detailed information
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: proposalId,
        pegawaiId: user.id // Ensure pegawai can only access their own proposals
      },
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
                name: true,
                description: true,
                isRequired: true,
              }
            }
          },
          orderBy: {
            documentRequirement: {
              name: 'asc'
            }
          }
        },
      }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // Get document requirements to calculate missing docs
    const documentRequirements = await prisma.documentRequirement.findMany({
      where: {
        isRequired: true
      }
    })

    // Calculate document stats
    const totalDocuments = proposal.documents.length
    const approvedDocuments = proposal.documents.filter(
      doc => doc.status === "DISETUJUI"
    ).length
    const pendingDocuments = proposal.documents.filter(
      doc => doc.status === "MENUNGGU_VERIFIKASI"
    ).length
    const needsRevisionDocuments = proposal.documents.filter(
      doc => doc.status === "PERLU_PERBAIKAN"
    ).length
    const rejectedDocuments = proposal.documents.filter(
      doc => doc.status === "DITOLAK"
    ).length

    // Check for missing required documents
    const uploadedDocCodes = proposal.documents.map(doc => 
      // @ts-expect-error - We know documentRequirement has code property
      doc.documentRequirement.code
    )
    const missingDocuments = documentRequirements.filter(
      req => !uploadedDocCodes.includes(req.code)
    ).length
    
    // Handle unitKerja if it's an object
    let unitKerja = proposal.pegawai.unitKerja
    if (unitKerja && typeof unitKerja === 'object' && unitKerja !== null) {
      // @ts-expect-error - unitKerja might be an object with name property
      unitKerja = unitKerja.nama || unitKerja.name || "Unit Kerja Tidak Tersedia"
    }

    // Determine if proposal needs attention
    const needsAttention = missingDocuments > 0 && 
      ['DRAFT', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'PERLU_PERBAIKAN_DARI_DINAS', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(proposal.status)

    // Transform response
    const result = {
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
      documents: proposal.documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        status: doc.status,
        notes: doc.notes,
        uploadedAt: doc.uploadedAt,
        documentRequirement: doc.documentRequirement
      })),
      documentStats: {
        total: totalDocuments,
        approved: approvedDocuments,
        pending: pendingDocuments,
        needsRevision: needsRevisionDocuments,
        rejected: rejectedDocuments,
        required: documentRequirements.length,
        missing: missingDocuments
      },
      canUploadDocuments: ['DRAFT', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(proposal.status),
      needsAttention
    }

    return createSuccessResponse(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error fetching proposal detail:", errorMessage)
    return createErrorResponse("Failed to fetch proposal detail", 500)
  }
})

// Handle PATCH request to update a proposal status
export const PATCH = withAuth(async (req: NextRequest, user: { id: string, role: string }) => {
  try {
    // Only pegawai can access this endpoint
    if (user.role !== "PEGAWAI") {
      return createErrorResponse("Access denied", 403)
    }

    // Extract proposal ID from URL and body data
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const proposalId = pathParts[pathParts.length - 1]
    const body = await req.json()
    const { status, notes } = body

    if (!proposalId) {
      return createErrorResponse("Proposal ID is required", 400)
    }

    if (!status) {
      return createErrorResponse("Status is required", 400)
    }

    // Fetch the proposal to verify ownership
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: proposalId,
        pegawaiId: user.id // Ensure pegawai can only update their own proposals
      }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // Only allow certain status transitions
    const allowedTransitions: Record<string, string[]> = {
      "DRAFT": ["DIAJUKAN"],
      "PERLU_PERBAIKAN_DARI_DINAS": ["DIAJUKAN"],
      "PERLU_PERBAIKAN_DARI_SEKOLAH": ["DIAJUKAN"],
      "DIKEMBALIKAN_OPERATOR": ["DIAJUKAN"],
      "DIKEMBALIKAN_ADMIN": ["DIAJUKAN"],
      "DIAJUKAN": ["DITARIK"]
    }

    if (!allowedTransitions[proposal.status]?.includes(status)) {
      return createErrorResponse(`Cannot change status from ${proposal.status} to ${status}`, 400)
    }

    // Update the proposal
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: proposalId },
      data: {
        status: status as any, // TypeScript will complain but Prisma handles it correctly
        notes: notes || proposal.notes,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `UPDATE_PROPOSAL_STATUS`,
        details: {
          proposalId,
          oldStatus: proposal.status,
          newStatus: status,
          notes
        }
      }
    })

    // Create notification for relevant users
    if (status === "DIAJUKAN") {
      // Find operator for this pegawai's wilayah
      const pegawai = await prisma.user.findUnique({
        where: { id: user.id },
        select: { wilayah: true, wilayahId: true }
      })

      if (pegawai?.wilayah || pegawai?.wilayahId) {
        // Find operators in this wilayah
        const operators = await prisma.user.findMany({
          where: {
            role: "OPERATOR",
            OR: [
              { wilayah: pegawai.wilayah },
              { wilayahId: pegawai.wilayahId }
            ]
          },
          select: { id: true }
        })

        // Create notifications for operators
        if (operators.length > 0) {
          await prisma.notification.createMany({
            data: operators.map(op => ({
              title: "Usulan Baru",
              message: `Ada usulan baru yang perlu diverifikasi dari periode ${proposal.periode}`,
              type: "info",
              userId: op.id,
              actionUrl: `/operator/inbox`,
              actionLabel: "Lihat Usulan"
            }))
          })
        }
      }
    }

    return createSuccessResponse({
      message: `Proposal status updated to ${status}`,
      proposal: updatedProposal
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error updating proposal:", errorMessage)
    return createErrorResponse("Failed to update proposal", 500)
  }
})

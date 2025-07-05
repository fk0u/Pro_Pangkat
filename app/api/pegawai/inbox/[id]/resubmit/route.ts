import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export const POST = withAuth(async (req: NextRequest, user: { id: string, role: string }) => {
  try {
    // Only pegawai can access this endpoint
    if (user.role !== "PEGAWAI") {
      return createErrorResponse("Access denied", 403)
    }

    // Extract proposal ID from URL and notes from body
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const proposalId = pathParts[pathParts.length - 2] // -2 because the last part is "resubmit"
    const body = await req.json()
    const { notes } = body

    if (!proposalId) {
      return createErrorResponse("Proposal ID is required", 400)
    }

    // Fetch the proposal to verify ownership and eligible status
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: proposalId,
        pegawaiId: user.id // Ensure pegawai can only resubmit their own proposals
      },
      include: {
        pegawai: {
          select: {
            wilayah: true,
            wilayahId: true
          }
        }
      }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // Check if proposal can be resubmitted (only in certain statuses)
    const resubmittableStatuses = [
      "PERLU_PERBAIKAN_DARI_DINAS", 
      "PERLU_PERBAIKAN_DARI_SEKOLAH", 
      "DIKEMBALIKAN_OPERATOR", 
      "DIKEMBALIKAN_ADMIN",
      "DITOLAK_OPERATOR",
      "DITOLAK_ADMIN"
    ]
    
    if (!resubmittableStatuses.includes(proposal.status)) {
      return createErrorResponse(`Cannot resubmit proposal in status ${proposal.status}`, 400)
    }

    // Update the proposal status to DIAJUKAN and add the notes
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: proposalId },
      data: {
        status: "DIAJUKAN",
        notes: notes ? 
          `${proposal.notes ? proposal.notes + "\n\n" : ""}Diajukan ulang dengan catatan: ${notes}` : 
          proposal.notes,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "RESUBMIT_PROPOSAL",
        details: {
          proposalId,
          previousStatus: proposal.status,
          notes: notes || ""
        }
      }
    })

    // Create notification for operators in the pegawai's wilayah
    const wilayah = proposal.pegawai.wilayah
    const wilayahId = proposal.pegawai.wilayahId
    
    if (wilayah || wilayahId) {
      // Find operators in this wilayah
      const operators = await prisma.user.findMany({
        where: {
          role: "OPERATOR",
          OR: [
            { wilayah: wilayah },
            { wilayahId: wilayahId }
          ]
        },
        select: { id: true }
      })

      // Create notifications for operators
      if (operators.length > 0) {
        await prisma.notification.createMany({
          data: operators.map(op => ({
            title: "Usulan Diajukan Ulang",
            message: `Usulan dengan ID ${proposalId} telah diajukan ulang dan memerlukan verifikasi`,
            type: "info",
            userId: op.id,
            actionUrl: `/operator/inbox`,
            actionLabel: "Lihat Usulan"
          }))
        })
      }
    }

    return createSuccessResponse({
      message: "Proposal successfully resubmitted",
      proposal: {
        id: updatedProposal.id,
        status: updatedProposal.status
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Error resubmitting proposal:", errorMessage)
    return createErrorResponse("Failed to resubmit proposal", 500)
  }
})

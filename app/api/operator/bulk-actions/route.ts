import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen, Wilayah } from "@prisma/client"

interface AuthenticatedUser {
  id: string
  role: string
  wilayah?: Wilayah
}

interface BulkActionRequest {
  action: "approve_all" | "reject_all" | "mark_processing" | "export_data" | "send_reminder"
  proposalIds: string[]
  note?: string
  reason?: string
  emailTemplate?: string
}

interface BulkActionResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{
    proposalId: string
    error: string
  }>
  summary: {
    approved: number
    rejected: number
    processing: number
    notifications_sent: number
  }
}

export const POST = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Hanya operator yang bisa mengakses endpoint ini
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's wilayah
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { wilayah: true, name: true },
    })

    if (!operatorData?.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    const body: BulkActionRequest = await req.json()
    const { action, proposalIds, note, reason, emailTemplate } = body

    if (!proposalIds || proposalIds.length === 0) {
      return createErrorResponse("No proposal IDs provided", 400)
    }

    // Verify all proposals belong to operator's wilayah
    const proposals = await prisma.promotionProposal.findMany({
      where: {
        id: { in: proposalIds },
        pegawai: { wilayah: operatorData.wilayah }
      },
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            unitKerja: true
          }
        },
        documents: true
      }
    })

    if (proposals.length !== proposalIds.length) {
      return createErrorResponse("Some proposals not found or access denied", 400)
    }

    const result: BulkActionResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
      summary: {
        approved: 0,
        rejected: 0,
        processing: 0,
        notifications_sent: 0
      }
    }

    // Process each proposal based on action
    switch (action) {
      case "approve_all":
        await processBulkApproval(proposals, user.id, note || "", result)
        break
      
      case "reject_all":
        await processBulkRejection(proposals, user.id, reason || "", result)
        break
      
      case "mark_processing":
        await processBulkMarkProcessing(proposals, user.id, note || "", result)
        break
      
      case "export_data":
        return await exportProposalData(proposals, operatorData.wilayah)
      
      case "send_reminder":
        await processBulkReminder(proposals, emailTemplate || "", result)
        break
      
      default:
        return createErrorResponse("Invalid action", 400)
    }

    // Log bulk action activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: `BULK_${action.toUpperCase()}`,
        details: {
          proposalCount: proposalIds.length,
          processed: result.processed,
          failed: result.failed,
          wilayah: operatorData.wilayah
        }
      }
    })

    return createSuccessResponse({
      message: `Bulk action ${action} completed`,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error("Error processing bulk action:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process bulk action"
    return createErrorResponse(errorMessage)
  }
})

// Helper function to process bulk approval
async function processBulkApproval(
  proposals: Array<any>,
  operatorId: string,
  note: string,
  result: BulkActionResult
) {
  for (const proposal of proposals) {
    try {
      // Check if proposal can be approved (all documents verified)
      const pendingDocs = proposal.documents.filter(
        (doc: any) => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
      )

      if (pendingDocs.length > 0) {
        result.errors.push({
          proposalId: proposal.id,
          error: `${pendingDocs.length} dokumen masih menunggu verifikasi`
        })
        result.failed++
        continue
      }

      // Update proposal status
      await prisma.promotionProposal.update({
        where: { id: proposal.id },
        data: {
          status: StatusProposal.DISETUJUI_OPERATOR,
          operatorId,
          operatorNote: note,
          updatedAt: new Date()
        }
      })

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: operatorId,
          action: "PROPOSAL_APPROVED",
          details: {
            proposalId: proposal.id,
            pegawaiName: proposal.pegawai.name,
            note
          }
        }
      })

      result.processed++
      result.summary.approved++

    } catch (error) {
      result.errors.push({
        proposalId: proposal.id,
        error: error instanceof Error ? error.message : "Unknown error"
      })
      result.failed++
    }
  }
}

// Helper function to process bulk rejection
async function processBulkRejection(
  proposals: Array<any>,
  operatorId: string,
  reason: string,
  result: BulkActionResult
) {
  for (const proposal of proposals) {
    try {
      // Update proposal status
      await prisma.promotionProposal.update({
        where: { id: proposal.id },
        data: {
          status: StatusProposal.DIKEMBALIKAN_OPERATOR,
          operatorId,
          operatorNote: reason,
          updatedAt: new Date()
        }
      })

      // Update all documents to need revision
      await prisma.proposalDocument.updateMany({
        where: {
          proposalId: proposal.id,
          status: StatusDokumen.MENUNGGU_VERIFIKASI
        },
        data: {
          status: StatusDokumen.PERLU_PERBAIKAN,
          catatan: reason
        }
      })

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: operatorId,
          action: "PROPOSAL_REJECTED",
          details: {
            proposalId: proposal.id,
            pegawaiName: proposal.pegawai.name,
            reason
          }
        }
      })

      result.processed++
      result.summary.rejected++

    } catch (error) {
      result.errors.push({
        proposalId: proposal.id,
        error: error instanceof Error ? error.message : "Unknown error"
      })
      result.failed++
    }
  }
}

// Helper function to mark proposals as processing
async function processBulkMarkProcessing(
  proposals: Array<any>,
  operatorId: string,
  note: string,
  result: BulkActionResult
) {
  for (const proposal of proposals) {
    try {
      if (proposal.status !== StatusProposal.DIAJUKAN) {
        result.errors.push({
          proposalId: proposal.id,
          error: "Proposal tidak dalam status yang dapat diproses"
        })
        result.failed++
        continue
      }

      // Update proposal status
      await prisma.promotionProposal.update({
        where: { id: proposal.id },
        data: {
          status: StatusProposal.DIPROSES_OPERATOR,
          operatorId,
          operatorNote: note,
          updatedAt: new Date()
        }
      })

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: operatorId,
          action: "PROPOSAL_PROCESSING",
          details: {
            proposalId: proposal.id,
            pegawaiName: proposal.pegawai.name,
            note
          }
        }
      })

      result.processed++
      result.summary.processing++

    } catch (error) {
      result.errors.push({
        proposalId: proposal.id,
        error: error instanceof Error ? error.message : "Unknown error"
      })
      result.failed++
    }
  }
}

// Helper function to send bulk reminders
async function processBulkReminder(
  proposals: Array<any>,
  emailTemplate: string,
  result: BulkActionResult
) {
  for (const proposal of proposals) {
    try {
      // In a real implementation, this would send email
      // For now, we'll just log the reminder
      await prisma.activityLog.create({
        data: {
          userId: proposal.pegawai.id,
          action: "REMINDER_SENT",
          details: {
            proposalId: proposal.id,
            message: emailTemplate || "Reminder tentang status usulan kenaikan pangkat",
            recipient: proposal.pegawai.email
          }
        }
      })

      result.processed++
      result.summary.notifications_sent++

    } catch (error) {
      result.errors.push({
        proposalId: proposal.id,
        error: error instanceof Error ? error.message : "Unknown error"
      })
      result.failed++
    }
  }
}

// Helper function to export proposal data
async function exportProposalData(proposals: Array<any>, wilayah: string) {
  const exportData = proposals.map(proposal => ({
    id: proposal.id,
    periode: proposal.periode,
    status: proposal.status,
    pegawai: {
      nama: proposal.pegawai.name,
      nip: proposal.pegawai.nip,
      unitKerja: proposal.pegawai.unitKerja,
      email: proposal.pegawai.email
    },
    documents: proposal.documents.length,
    verifiedDocuments: proposal.documents.filter(
      (doc: any) => doc.status === StatusDokumen.DISETUJUI
    ).length,
    pendingDocuments: proposal.documents.filter(
      (doc: any) => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
    ).length,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt
  }))

  const exportSummary = {
    wilayah,
    totalProposals: proposals.length,
    exportedAt: new Date().toISOString(),
    byStatus: proposals.reduce((acc: Record<string, number>, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1
      return acc
    }, {}),
    documentStats: {
      totalDocuments: proposals.reduce((sum, p) => sum + p.documents.length, 0),
      verifiedDocuments: proposals.reduce(
        (sum, p) => sum + p.documents.filter((d: any) => d.status === StatusDokumen.DISETUJUI).length,
        0
      ),
      pendingDocuments: proposals.reduce(
        (sum, p) => sum + p.documents.filter((d: any) => d.status === StatusDokumen.MENUNGGU_VERIFIKASI).length,
        0
      )
    }
  }

  return createSuccessResponse({
    message: "Data exported successfully",
    exportData,
    summary: exportSummary,
    filename: `proposals_export_${wilayah}_${new Date().toISOString().split('T')[0]}.json`
  })
}

// Get bulk action history
export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const page = parseInt(url.searchParams.get("page") || "1")
    const offset = (page - 1) * limit

    const bulkActions = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        action: {
          startsWith: "BULK_"
        }
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    const totalCount = await prisma.activityLog.count({
      where: {
        userId: user.id,
        action: {
          startsWith: "BULK_"
        }
      }
    })

    return createSuccessResponse({
      bulkActions: bulkActions.map(action => ({
        id: action.id,
        action: action.action,
        details: action.details,
        createdAt: action.createdAt,
        operator: action.user.name
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error: unknown) {
    console.error("Error fetching bulk action history:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch bulk action history"
    return createErrorResponse(errorMessage)
  }
})

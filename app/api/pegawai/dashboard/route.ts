import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Hanya pegawai yang bisa mengakses endpoint ini
    if (user.role !== "PEGAWAI") {
      return createErrorResponse("Access denied", 403)
    }

    // Get user's proposals
    const proposals = await prisma.promotionProposal.findMany({
      where: { pegawaiId: user.id },
      include: {
        documents: {
          include: {
            documentRequirement: true,
          },
        },
        operator: {
          select: { name: true, wilayah: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Count documents by status
    const documentStats = await prisma.proposalDocument.groupBy({
      by: ["status"],
      where: {
        proposal: {
          pegawaiId: user.id,
        },
      },
      _count: true,
    })

    // Get recent activities for this user
    const recentActivities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Calculate statistics
    const totalProposals = proposals.length
    const activeProposal = proposals.find(p => 
      [StatusProposal.DRAFT, StatusProposal.DIAJUKAN, StatusProposal.DIPROSES_OPERATOR, StatusProposal.DIPROSES_ADMIN].includes(p.status)
    )

    const docStats = {
      menungguVerifikasi: documentStats.find(d => d.status === StatusDokumen.MENUNGGU_VERIFIKASI)?._count || 0,
      perluPerbaikan: documentStats.find(d => d.status === StatusDokumen.PERLU_PERBAIKAN)?._count || 0,
      disetujui: documentStats.find(d => d.status === StatusDokumen.DISETUJUI)?._count || 0,
      ditolak: documentStats.find(d => d.status === StatusDokumen.DITOLAK)?._count || 0,
    }

    // Calculate deadline (assuming deadline is 30 days from proposal creation)
    const deadlineDate = activeProposal ? new Date(activeProposal.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null
    const daysRemaining = deadlineDate ? Math.max(0, Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))) : 0

    // Process proposals for display
    const processedProposals = proposals.map(proposal => {
      const totalDocs = proposal.documents.length
      const approvedDocs = proposal.documents.filter(d => d.status === StatusDokumen.DISETUJUI).length
      const pendingDocs = proposal.documents.filter(d => d.status === StatusDokumen.MENUNGGU_VERIFIKASI).length
      const needsFixDocs = proposal.documents.filter(d => d.status === StatusDokumen.PERLU_PERBAIKAN).length

      return {
        id: proposal.id,
        periode: proposal.periode,
        status: proposal.status,
        notes: proposal.notes,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        operator: proposal.operator,
        documentSummary: {
          total: totalDocs,
          approved: approvedDocs,
          pending: pendingDocs,
          needsFix: needsFixDocs,
          progress: totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0,
        },
      }
    })

    return createSuccessResponse({
      overview: {
        totalProposals,
        activeProposal: activeProposal ? {
          id: activeProposal.id,
          periode: activeProposal.periode,
          status: activeProposal.status,
          daysRemaining,
        } : null,
        documentStats: docStats,
        daysRemaining,
      },
      proposals: processedProposals,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("Error fetching pegawai dashboard data:", error)
    return createErrorResponse(error.message || "Failed to fetch dashboard data")
  }
})

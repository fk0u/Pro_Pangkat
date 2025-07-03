import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen, Wilayah } from "@prisma/client"

interface AuthenticatedUser {
  id: string
  role: string
  wilayah?: Wilayah
}

interface DashboardStats {
  totalProposals: number
  perluVerifikasi: number
  sedangDiproses: number
  dikirimBKN: number
  selesai: number
  ditolak: number
  dikembalikan: number
  documents: {
    total: number
    menungguVerifikasi: number
    disetujui: number
    dikembalikan: number
    ditolak: number
  }
  avgProcessingTime: number
  completionRate: number
}

interface UrgentProposal {
  id: string
  periode: string
  pegawai: {
    name: string
    nip: string
    unitKerja: string
    jabatan: string
    golongan: string
  }
  status: string
  documentProgress: string
  pendingDocuments: number
  daysRemaining: number
  urgencyLevel: "critical" | "urgent" | "warning" | "normal"
  createdAt: string
  lastActivity: string
}

export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    // Hanya operator yang bisa mengakses endpoint ini
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's complete data including wilayah
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { wilayah: true, name: true },
    })

    if (!operatorData || !operatorData.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    // Parallel queries for better performance
    const [proposals, statusCounts, documentStats, activeTimelines, recentActivities] = await Promise.all([
      // Get proposals in operator's region with detailed information
      prisma.promotionProposal.findMany({
        where: {
          pegawai: {
            wilayah: operatorData.wilayah,
          },
        },
        include: {
          pegawai: {
            select: {
              name: true,
              nip: true,
              unitKerja: true,
              jabatan: true,
              golongan: true,
              email: true,
            },
          },
          documents: {
            include: {
              documentRequirement: true,
            },
          },
          operator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Count proposals by status
      prisma.promotionProposal.groupBy({
        by: ["status"],
        where: {
          pegawai: {
            wilayah: operatorData.wilayah,
          },
        },
        _count: true,
      }),

      // Get document verification statistics
      prisma.proposalDocument.groupBy({
        by: ["status"],
        where: {
          proposal: {
            pegawai: {
              wilayah: operatorData.wilayah,
            },
          },
        },
        _count: true,
      }),

      // Get active timelines for this region
      prisma.timeline.findMany({
        where: {
          isActive: true,
          OR: [
            { wilayah: null }, // Timeline untuk semua wilayah
            { wilayah: operatorData.wilayah }, // Timeline khusus wilayah operator
          ],
        },
        orderBy: [
          { priority: "desc" },
          { startDate: "asc" },
        ],
      }),

      // Get recent activities by operator
      prisma.activityLog.findMany({
        where: { 
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          user: {
            select: { name: true },
          },
        },
      })
    ])

    // Current active timeline (yang sedang berjalan)
    const currentTimeline = activeTimelines.find(t => 
      new Date() >= new Date(t.startDate) && new Date() <= new Date(t.endDate)
    ) || activeTimelines[0]

    // Helper function to safely find status count
    const getStatusCount = (status: StatusProposal): number => {
      return statusCounts.find(s => s.status === status)?._count || 0
    }

    // Helper function to safely find document status count
    const getDocumentStatusCount = (status: StatusDokumen): number => {
      return documentStats.find(s => s.status === status)?._count || 0
    }

    // Get urgent proposals (need verification soon)
    const urgentProposals = proposals.filter(proposal => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )
      const hasUnverifiedDocs = proposal.documents.some(
        doc => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
      )
      
      // Proposal urgent jika:
      // 1. Sudah diajukan lebih dari 3 hari dan belum diproses
      // 2. Ada dokumen yang menunggu verifikasi lebih dari 5 hari
      // 3. Mendekati deadline timeline
      const isUrgent = (daysSinceCreated > 3 && proposal.status === StatusProposal.DIAJUKAN) ||
                      (daysSinceCreated > 5 && hasUnverifiedDocs) ||
                      (currentTimeline && new Date() > new Date(currentTimeline.endDate.getTime() - 7 * 24 * 60 * 60 * 1000))

      return isUrgent && [StatusProposal.DIAJUKAN, StatusProposal.DIPROSES_OPERATOR].includes(proposal.status)
    })

    // Calculate comprehensive statistics
    const stats: DashboardStats = {
      totalProposals: proposals.length,
      perluVerifikasi: getStatusCount(StatusProposal.DIAJUKAN),
      sedangDiproses: getStatusCount(StatusProposal.DIPROSES_OPERATOR),
      dikirimBKN: getStatusCount(StatusProposal.DISETUJUI_OPERATOR),
      selesai: getStatusCount(StatusProposal.SELESAI),
      ditolak: getStatusCount(StatusProposal.DITOLAK),
      dikembalikan: getStatusCount(StatusProposal.DIKEMBALIKAN_OPERATOR),
      
      // Document statistics
      documents: {
        total: documentStats.reduce((sum, item) => sum + item._count, 0),
        menungguVerifikasi: getDocumentStatusCount(StatusDokumen.MENUNGGU_VERIFIKASI),
        disetujui: getDocumentStatusCount(StatusDokumen.DISETUJUI),
        dikembalikan: getDocumentStatusCount(StatusDokumen.PERLU_PERBAIKAN), // Updated to use PERLU_PERBAIKAN
        ditolak: getDocumentStatusCount(StatusDokumen.DITOLAK),
      },
      
      // Performance metrics
      avgProcessingTime: calculateAverageProcessingTime(proposals),
      completionRate: proposals.length > 0 ? 
        Math.round((getStatusCount(StatusProposal.SELESAI) / proposals.length) * 100) : 0,
    }

    // Process urgent proposals for display
    const processedUrgentProposals: UrgentProposal[] = urgentProposals.slice(0, 10).map(proposal => {
      const totalDocs = proposal.documents.length
      const verifiedDocs = proposal.documents.filter(d => d.status === StatusDokumen.DISETUJUI).length
      const pendingDocs = proposal.documents.filter(d => d.status === StatusDokumen.MENUNGGU_VERIFIKASI).length
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )
      
      // Calculate deadline based on current timeline
      let deadline = 30 - daysSinceCreated // Default 30 days
      if (currentTimeline) {
        const timelineDeadline = Math.ceil((new Date(currentTimeline.endDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
        deadline = Math.min(deadline, timelineDeadline)
      }

      return {
        id: proposal.id,
        periode: proposal.periode,
        pegawai: proposal.pegawai,
        status: proposal.status,
        documentProgress: `${verifiedDocs}/${totalDocs}`,
        pendingDocuments: pendingDocs,
        daysRemaining: Math.max(0, deadline),
        urgencyLevel: deadline <= 2 ? "critical" : deadline <= 5 ? "urgent" : deadline <= 10 ? "warning" : "normal" as const,
        createdAt: proposal.createdAt.toISOString(),
        lastActivity: proposal.updatedAt.toISOString(),
      }
    })

    // Status distribution for charts
    const statusDistribution = statusCounts.map(item => ({
      status: getStatusLabel(item.status),
      statusKey: item.status,
      count: item._count,
      percentage: proposals.length > 0 ? Math.round((item._count / proposals.length) * 100) : 0,
      color: getStatusColor(item.status),
    }))

    // Jabatan distribution
    const jabatanDistribution = proposals.reduce((acc: Record<string, number>, proposal) => {
      const jabatanType = getJabatanType(proposal.pegawai.jabatan)
      acc[jabatanType] = (acc[jabatanType] || 0) + 1
      return acc
    }, {})

    // Monthly trend (last 6 months)
    const monthlyTrend = await getMonthlyTrend(operatorData.wilayah)

    // Timeline information
    const timelineInfo = {
      current: currentTimeline ? {
        title: currentTimeline.title,
        endDate: currentTimeline.endDate,
        daysRemaining: Math.ceil((new Date(currentTimeline.endDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)),
        priority: currentTimeline.priority,
        jabatanType: currentTimeline.jabatanType,
      } : null,
      upcoming: activeTimelines.filter(t => new Date(t.startDate) > new Date()).slice(0, 3).map(t => ({
        title: t.title,
        startDate: t.startDate,
        jabatanType: t.jabatanType,
        priority: t.priority,
      })),
    }

    return createSuccessResponse({
      overview: stats,
      urgentProposals: processedUrgentProposals,
      statusDistribution,
      jabatanDistribution,
      monthlyTrend,
      timelineInfo,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        user: activity.user.name,
        createdAt: activity.createdAt,
      })),
      region: operatorData.wilayah,
      metadata: {
        lastUpdated: new Date(),
        totalActiveTimelines: activeTimelines.length,
        operatorName: operatorData.name,
      }
    })
  } catch (error: unknown) {
    console.error("Error fetching operator dashboard data:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard data"
    return createErrorResponse(errorMessage)
  }
})

// Helper function to calculate average processing time
function calculateAverageProcessingTime(proposals: Array<{ status: StatusProposal; createdAt: Date; updatedAt: Date }>): number {
  const processedProposals = proposals.filter(p => 
    [StatusProposal.DISETUJUI_OPERATOR, StatusProposal.SELESAI, StatusProposal.DITOLAK].includes(p.status)
  )
  
  if (processedProposals.length === 0) return 0
  
  const totalDays = processedProposals.reduce((sum, proposal) => {
    const days = Math.floor((proposal.updatedAt.getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    return sum + days
  }, 0)
  
  return Math.round(totalDays / processedProposals.length)
}

// Helper function to get monthly trend
async function getMonthlyTrend(wilayah: Wilayah) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const monthlyData = await prisma.promotionProposal.groupBy({
    by: ["status"],
    where: {
      pegawai: { wilayah },
      createdAt: { gte: sixMonthsAgo }
    },
    _count: true,
  })
  
  // Process monthly data for chart
  return monthlyData.map(item => ({
    status: getStatusLabel(item.status),
    count: item._count,
  }))
}

// Helper function to determine jabatan type
function getJabatanType(jabatan: string | null): string {
  if (!jabatan) return "pelaksana"
  const jabatanLower = jabatan.toLowerCase()
  
  if (jabatanLower.includes("struktural") || jabatanLower.includes("kepala") || jabatanLower.includes("direktur") || jabatanLower.includes("manager")) {
    return "struktural"
  } else if (jabatanLower.includes("fungsional") || jabatanLower.includes("ahli") || jabatanLower.includes("terampil")) {
    return "fungsional"
  } else {
    return "pelaksana"
  }
}

function getStatusLabel(status: StatusProposal): string {
  const labels: Record<StatusProposal, string> = {
    [StatusProposal.DRAFT]: "Draft",
    [StatusProposal.DIAJUKAN]: "Perlu Verifikasi",
    [StatusProposal.DIPROSES_OPERATOR]: "Proses Verifikasi",
    [StatusProposal.DIKEMBALIKAN_OPERATOR]: "Dikembalikan",
    [StatusProposal.DISETUJUI_OPERATOR]: "Dikirim ke BKN",
    [StatusProposal.DIPROSES_ADMIN]: "Proses Admin",
    [StatusProposal.DIKEMBALIKAN_ADMIN]: "Dikembalikan Admin",
    [StatusProposal.SELESAI]: "Selesai",
    [StatusProposal.DITOLAK]: "Ditolak",
    [StatusProposal.DITARIK]: "Ditarik",
    [StatusProposal.MENUNGGU_VERIFIKASI_DINAS]: "Menunggu Verifikasi Dinas",
    [StatusProposal.MENUNGGU_VERIFIKASI_SEKOLAH]: "Menunggu Verifikasi Sekolah",
    [StatusProposal.PERLU_PERBAIKAN_DARI_DINAS]: "Perlu Perbaikan dari Dinas",
    [StatusProposal.PERLU_PERBAIKAN_DARI_SEKOLAH]: "Perlu Perbaikan dari Sekolah",
    [StatusProposal.DITOLAK_SEKOLAH]: "Ditolak Sekolah",
    [StatusProposal.DITOLAK_DINAS]: "Ditolak Dinas",
    [StatusProposal.DITOLAK_ADMIN]: "Ditolak Admin",
  }
  return labels[status] || status
}

function getStatusColor(status: StatusProposal): string {
  const colors: Record<StatusProposal, string> = {
    [StatusProposal.DRAFT]: "bg-gray-500",
    [StatusProposal.DIAJUKAN]: "bg-orange-500",
    [StatusProposal.DIPROSES_OPERATOR]: "bg-blue-500",
    [StatusProposal.DIKEMBALIKAN_OPERATOR]: "bg-red-500",
    [StatusProposal.DISETUJUI_OPERATOR]: "bg-purple-500",
    [StatusProposal.DIPROSES_ADMIN]: "bg-indigo-500",
    [StatusProposal.DIKEMBALIKAN_ADMIN]: "bg-red-500",
    [StatusProposal.SELESAI]: "bg-green-500",
    [StatusProposal.DITOLAK]: "bg-red-600",
    [StatusProposal.DITARIK]: "bg-gray-600",
    [StatusProposal.MENUNGGU_VERIFIKASI_DINAS]: "bg-yellow-500",
    [StatusProposal.MENUNGGU_VERIFIKASI_SEKOLAH]: "bg-yellow-400",
    [StatusProposal.PERLU_PERBAIKAN_DARI_DINAS]: "bg-orange-600",
    [StatusProposal.PERLU_PERBAIKAN_DARI_SEKOLAH]: "bg-orange-400",
    [StatusProposal.DITOLAK_SEKOLAH]: "bg-red-500",
    [StatusProposal.DITOLAK_DINAS]: "bg-red-500",
    [StatusProposal.DITOLAK_ADMIN]: "bg-red-700",
  }
  return colors[status] || "bg-gray-500"
}

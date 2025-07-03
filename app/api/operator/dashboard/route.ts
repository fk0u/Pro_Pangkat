import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen, User, PromotionProposal, ProposalDocument, Prisma } from "@prisma/client"

interface ProposalWithDetails extends PromotionProposal {
  pegawai: Pick<User, 'name' | 'nip' | 'unitKerja' | 'jabatan' | 'golongan' | 'email'>
  documents: ProposalDocument[]
  operator?: Pick<User, 'name'> | null
}

interface DocumentWithRequirement extends ProposalDocument {
  documentRequirement: {
    id: string
    name: string
    description: string | null
    isRequired: boolean
    category: string | null
    format: string | null
    maxSize: number | null
  }
}

interface StatusCount {
  status: StatusProposal
  _count: number
}

interface DocumentStatusCount {
  status: StatusDokumen
  _count: number
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Hanya operator dan operator unit kerja yang bisa mengakses endpoint ini
    if (!["OPERATOR", "OPERATOR_UNIT_KERJA"].includes(user.role)) {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's complete data including wilayah and unitKerjaId
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        wilayah: true, 
        name: true, 
        role: true,
        unitKerjaId: true,
        unitKerja: {
          select: {
            id: true,
            nama: true,
            wilayah: true
          }
        }
      },
    })

    if (!operatorData) {
      return createErrorResponse("Operator data not found", 400)
    }

    // Determine filtering based on role
    let whereCondition: any = {}
    
    if (operatorData.role === "OPERATOR") {
      // Operator dapat melihat semua proposal di wilayahnya
      if (!operatorData.wilayah) {
        return createErrorResponse("Operator wilayah not found", 400)
      }
      whereCondition = {
        pegawai: {
          wilayah: operatorData.wilayah,
        },
      }
    } else if (operatorData.role === "OPERATOR_UNIT_KERJA") {
      // Operator Unit Kerja hanya dapat melihat proposal dari unit kerjanya
      if (!operatorData.unitKerjaId) {
        return createErrorResponse("Operator unit kerja not found", 400)
      }
      whereCondition = {
        pegawai: {
          unitKerjaId: operatorData.unitKerjaId,
        },
      }
    }

    console.log("Operator data:", {
      role: operatorData.role,
      wilayah: operatorData.wilayah,
      unitKerja: operatorData.unitKerja?.nama
    })

    // Cache configuration for better performance
    const cacheTime = 5 * 60 * 1000 // 5 minutes cache

    // Get proposals based on operator role with detailed information
    const proposals = await prisma.promotionProposal.findMany({
      where: whereCondition,
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
    })

    // Get active timelines for this region/unit
    let timelineWhere: any = {
      isActive: true,
      OR: [
        { wilayah: null }, // Timeline untuk semua wilayah
      ],
    }
    
    if (operatorData.role === "OPERATOR" && operatorData.wilayah) {
      timelineWhere.OR.push({ wilayah: operatorData.wilayah })
    } else if (operatorData.role === "OPERATOR_UNIT_KERJA" && operatorData.unitKerja?.wilayah) {
      timelineWhere.OR.push({ wilayah: operatorData.unitKerja.wilayah })
    }

    const activeTimelines = await prisma.timeline.findMany({
      where: timelineWhere,
      orderBy: [
        { priority: "desc" },
        { startDate: "asc" },
      ],
    })

    // Current active timeline (yang sedang berjalan)
    const currentTimeline = activeTimelines.find(t => 
      new Date() >= new Date(t.startDate) && new Date() <= new Date(t.endDate)
    ) || activeTimelines[0]

    // Count proposals by status
    const statusCounts = await prisma.promotionProposal.groupBy({
      by: ["status"],
      where: whereCondition,
      _count: true,
    })

    // Get document verification statistics
    const documentStats = await prisma.proposalDocument.groupBy({
      by: ["status"],
      where: {
        proposal: whereCondition,
      },
      _count: true,
    })

    // Get urgent proposals (need verification soon)
    const urgentProposals = proposals.filter((proposal: any) => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      )
      const hasUnverifiedDocs = proposal.documents.some(
        (doc: any) => doc.status === StatusDokumen.MENUNGGU_VERIFIKASI
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

    // Get recent activities by operator
    const recentActivities = await prisma.activityLog.findMany({
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

    // Calculate comprehensive statistics
    const stats = {
      totalProposals: proposals.length,
      perluVerifikasi: statusCounts.find((s: any) => s.status === StatusProposal.DIAJUKAN)?._count || 0,
      sedangDiproses: statusCounts.find((s: any) => s.status === StatusProposal.DIPROSES_OPERATOR)?._count || 0,
      dikirimBKN: statusCounts.find((s: any) => s.status === StatusProposal.DISETUJUI_OPERATOR)?._count || 0,
      selesai: statusCounts.find((s: any) => s.status === StatusProposal.SELESAI)?._count || 0,
      ditolak: statusCounts.find((s: any) => s.status === StatusProposal.DITOLAK)?._count || 0,
      dikembalikan: statusCounts.find((s: any) => s.status === StatusProposal.DIKEMBALIKAN_OPERATOR)?._count || 0,
      
      // Document statistics
      documents: {
        total: documentStats.reduce((sum, item) => sum + item._count, 0),
        menungguVerifikasi: documentStats.find((s: any) => s.status === StatusDokumen.MENUNGGU_VERIFIKASI)?._count || 0,
        disetujui: documentStats.find((s: any) => s.status === StatusDokumen.DISETUJUI)?._count || 0,
        dikembalikan: documentStats.find((s: any) => s.status === StatusDokumen.DIKEMBALIKAN)?._count || 0,
        ditolak: documentStats.find((s: any) => s.status === StatusDokumen.DITOLAK)?._count || 0,
      },
      
      // Performance metrics
      avgProcessingTime: calculateAverageProcessingTime(proposals),
      completionRate: proposals.length > 0 ? 
        Math.round(((statusCounts.find((s: any) => s.status === StatusProposal.SELESAI)?._count || 0) / proposals.length) * 100) : 0,
    }

    // Process urgent proposals for display
    const processedUrgentProposals = urgentProposals.slice(0, 10).map((proposal: any) => {
      const totalDocs = proposal.documents.length
      const verifiedDocs = proposal.documents.filter((d: any) => d.status === StatusDokumen.DISETUJUI).length
      const pendingDocs = proposal.documents.filter((d: any) => d.status === StatusDokumen.MENUNGGU_VERIFIKASI).length
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
        urgencyLevel: deadline <= 2 ? "critical" : deadline <= 5 ? "urgent" : deadline <= 10 ? "warning" : "normal",
        createdAt: proposal.createdAt,
        lastActivity: proposal.updatedAt,
      }
    })

    // Status distribution for charts
    const statusDistribution = statusCounts.map((item: any) => ({
      status: getStatusLabel(item.status),
      statusKey: item.status,
      count: item._count,
      percentage: proposals.length > 0 ? Math.round((item._count / proposals.length) * 100) : 0,
      color: getStatusColor(item.status),
    }))

    // Jabatan distribution
    const jabatanDistribution = proposals.reduce((acc: any, proposal: any) => {
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
      recentActivities: recentActivities.map((activity: any) => ({
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
  } catch (error: any) {
    console.error("Error fetching operator dashboard data:", error)
    return createErrorResponse(error.message || "Failed to fetch dashboard data")
  }
})

// Helper function to calculate average processing time
function calculateAverageProcessingTime(proposals: any[]): number {
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
async function getMonthlyTrend(wilayah: string) {
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

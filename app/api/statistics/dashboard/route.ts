import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal } from "@prisma/client"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url)
    const periode = url.searchParams.get("periode")
    const wilayah = url.searchParams.get("wilayah")

    // Build where clause based on user role and filters
    const whereClause: any = {}

    if (periode) {
      whereClause.periode = periode
    }

    // Role-based filtering
    if (user.role === "OPERATOR" && user.wilayah) {
      whereClause.pegawai = {
        wilayah: user.wilayah,
      }
    } else if (wilayah && user.role === "ADMIN") {
      whereClause.pegawai = {
        wilayah: wilayah,
      }
    }

    // Get proposal statistics
    const [
      totalProposals,
      draftProposals,
      submittedProposals,
      processingProposals,
      approvedProposals,
      completedProposals,
      rejectedProposals,
      totalUsers,
      recentActivities,
    ] = await Promise.all([
      // Total proposals
      prisma.promotionProposal.count({ where: whereClause }),

      // Draft proposals
      prisma.promotionProposal.count({
        where: { ...whereClause, status: StatusProposal.DRAFT },
      }),

      // Submitted proposals
      prisma.promotionProposal.count({
        where: { ...whereClause, status: StatusProposal.DIAJUKAN },
      }),

      // Processing proposals (operator + admin processing)
      prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: [StatusProposal.DIPROSES_OPERATOR, StatusProposal.DIPROSES_ADMIN],
          },
        },
      }),

      // Approved proposals
      prisma.promotionProposal.count({
        where: { ...whereClause, status: StatusProposal.DISETUJUI_OPERATOR },
      }),

      // Completed proposals
      prisma.promotionProposal.count({
        where: { ...whereClause, status: StatusProposal.SELESAI },
      }),

      // Rejected proposals
      prisma.promotionProposal.count({
        where: { ...whereClause, status: StatusProposal.DITOLAK },
      }),

      // Total users
      prisma.user.count({
        where: user.role === "OPERATOR" && user.wilayah ? { wilayah: user.wilayah } : {},
      }),

      // Recent activities
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, role: true },
          },
        },
      }),
    ])

    // Get monthly statistics for the current year
    const currentYear = new Date().getFullYear()
    const monthlyStats = await prisma.promotionProposal.groupBy({
      by: ["createdAt"],
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
      _count: true,
    })

    // Process monthly stats
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthData = monthlyStats.filter((stat) => stat.createdAt.getMonth() + 1 === month)
      return {
        month: month,
        monthName: new Date(currentYear, i, 1).toLocaleString("id-ID", { month: "long" }),
        count: monthData.reduce((sum, item) => sum + item._count, 0),
      }
    })

    // Get status distribution
    const statusDistribution = await prisma.promotionProposal.groupBy({
      by: ["status"],
      where: whereClause,
      _count: true,
    })

    const statistics = {
      overview: {
        totalProposals,
        draftProposals,
        submittedProposals,
        processingProposals,
        approvedProposals,
        completedProposals,
        rejectedProposals,
        totalUsers,
      },
      monthlyData,
      statusDistribution: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count,
        percentage: totalProposals > 0 ? Math.round((item._count / totalProposals) * 100) : 0,
      })),
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        userName: activity.user.name,
        userRole: activity.user.role,
        createdAt: activity.createdAt,
      })),
    }

    return createSuccessResponse(statistics)
  } catch (error: any) {
    console.error("Error fetching dashboard statistics:", error)
    return createErrorResponse(error.message || "Failed to fetch statistics")
  }
})

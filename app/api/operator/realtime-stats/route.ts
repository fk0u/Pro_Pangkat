import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen, Wilayah } from "@prisma/client"

interface AuthenticatedUser {
  id: string
  role: string
  wilayah?: Wilayah
}

interface RealtimeStats {
  timestamp: string
  proposals: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    byStatus: Record<string, number>
    urgent: number
    processing: number
  }
  documents: {
    total: number
    pending: number
    approved: number
    rejected: number
    needRevision: number
    verificationRate: number
  }
  performance: {
    avgProcessingDays: number
    completionRate: number
    operatorEfficiency: number
    dailyProcessed: number
  }
  timeline: {
    activeCount: number
    upcomingDeadlines: number
    criticalDeadlines: number
  }
  regional: {
    wilayah: string
    unitKerjaCount: number
    pegawaiCount: number
    activeOperators: number
  }
}

export const GET = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
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

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Execute parallel queries for better performance
    const [
      allProposals,
      todayProposals,
      weekProposals,
      monthProposals,
      statusCounts,
      documentStats,
      activeTimelines,
      unitKerjaStats,
      pegawaiCount,
      operatorCount
    ] = await Promise.all([
      // All proposals in region
      prisma.promotionProposal.count({
        where: {
          pegawai: { wilayah: operatorData.wilayah }
        }
      }),

      // Today's proposals
      prisma.promotionProposal.count({
        where: {
          pegawai: { wilayah: operatorData.wilayah },
          createdAt: { gte: today }
        }
      }),

      // This week's proposals
      prisma.promotionProposal.count({
        where: {
          pegawai: { wilayah: operatorData.wilayah },
          createdAt: { gte: thisWeek }
        }
      }),

      // This month's proposals
      prisma.promotionProposal.count({
        where: {
          pegawai: { wilayah: operatorData.wilayah },
          createdAt: { gte: thisMonth }
        }
      }),

      // Status distribution
      prisma.promotionProposal.groupBy({
        by: ["status"],
        where: {
          pegawai: { wilayah: operatorData.wilayah }
        },
        _count: true
      }),

      // Document statistics
      prisma.proposalDocument.groupBy({
        by: ["status"],
        where: {
          proposal: {
            pegawai: { wilayah: operatorData.wilayah }
          }
        },
        _count: true
      }),

      // Active timelines
      prisma.timeline.findMany({
        where: {
          isActive: true,
          OR: [
            { wilayah: null },
            { wilayah: operatorData.wilayah }
          ]
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          priority: true
        }
      }),

      // Unit kerja statistics
      prisma.user.groupBy({
        by: ["unitKerja"],
        where: {
          role: "PEGAWAI",
          wilayah: operatorData.wilayah,
          unitKerja: { not: null }
        },
        _count: true
      }),

      // Total pegawai count
      prisma.user.count({
        where: {
          role: "PEGAWAI",
          wilayah: operatorData.wilayah
        }
      }),

      // Active operators count
      prisma.user.count({
        where: {
          role: "OPERATOR",
          wilayah: operatorData.wilayah
        }
      })
    ])

    // Calculate urgent proposals
    const urgentProposals = await prisma.promotionProposal.count({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        status: {
          in: [StatusProposal.DIAJUKAN, StatusProposal.DIPROSES_OPERATOR]
        },
        createdAt: {
          lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // Older than 3 days
        }
      }
    })

    // Calculate processing proposals
    const processingProposals = await prisma.promotionProposal.count({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        status: StatusProposal.DIPROSES_OPERATOR
      }
    })

    // Calculate processed proposals today
    const dailyProcessed = await prisma.promotionProposal.count({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        updatedAt: { gte: today },
        status: {
          in: [
            StatusProposal.DISETUJUI_OPERATOR,
            StatusProposal.DIKEMBALIKAN_OPERATOR,
            StatusProposal.DITOLAK
          ]
        }
      }
    })

    // Calculate average processing time
    const completedProposals = await prisma.promotionProposal.findMany({
      where: {
        pegawai: { wilayah: operatorData.wilayah },
        status: {
          in: [StatusProposal.DISETUJUI_OPERATOR, StatusProposal.SELESAI, StatusProposal.DITOLAK]
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      },
      take: 100 // Sample for performance
    })

    const avgProcessingDays = completedProposals.length > 0
      ? completedProposals.reduce((sum, proposal) => {
          const days = Math.floor(
            (proposal.updatedAt.getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
          )
          return sum + days
        }, 0) / completedProposals.length
      : 0

    // Calculate completion rate
    const completionRate = allProposals > 0
      ? Math.round(((statusCounts.find(s => s.status === StatusProposal.SELESAI)?._count || 0) / allProposals) * 100)
      : 0

    // Calculate operator efficiency (proposals processed per day)
    const operatorEfficiency = dailyProcessed

    // Calculate document verification rate
    const totalDocuments = documentStats.reduce((sum, item) => sum + item._count, 0)
    const verifiedDocuments = documentStats.find(s => s.status === StatusDokumen.DISETUJUI)?._count || 0
    const verificationRate = totalDocuments > 0 ? Math.round((verifiedDocuments / totalDocuments) * 100) : 0

    // Calculate timeline deadlines
    const upcomingDeadlines = activeTimelines.filter(timeline => {
      const daysUntilDeadline = Math.ceil(
        (new Date(timeline.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      return daysUntilDeadline <= 14 && daysUntilDeadline > 0
    }).length

    const criticalDeadlines = activeTimelines.filter(timeline => {
      const daysUntilDeadline = Math.ceil(
        (new Date(timeline.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )
      return daysUntilDeadline <= 3 && daysUntilDeadline > 0
    }).length

    // Build status counts object
    const statusCountsObj = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    // Build document stats
    const documentStatsObj = {
      total: totalDocuments,
      pending: documentStats.find(s => s.status === StatusDokumen.MENUNGGU_VERIFIKASI)?._count || 0,
      approved: documentStats.find(s => s.status === StatusDokumen.DISETUJUI)?._count || 0,
      rejected: documentStats.find(s => s.status === StatusDokumen.DITOLAK)?._count || 0,
      needRevision: documentStats.find(s => s.status === StatusDokumen.PERLU_PERBAIKAN)?._count || 0,
      verificationRate
    }

    const realtimeStats: RealtimeStats = {
      timestamp: now.toISOString(),
      proposals: {
        total: allProposals,
        today: todayProposals,
        thisWeek: weekProposals,
        thisMonth: monthProposals,
        byStatus: statusCountsObj,
        urgent: urgentProposals,
        processing: processingProposals
      },
      documents: documentStatsObj,
      performance: {
        avgProcessingDays: Math.round(avgProcessingDays),
        completionRate,
        operatorEfficiency,
        dailyProcessed
      },
      timeline: {
        activeCount: activeTimelines.length,
        upcomingDeadlines,
        criticalDeadlines
      },
      regional: {
        wilayah: operatorData.wilayah,
        unitKerjaCount: unitKerjaStats.length,
        pegawaiCount,
        activeOperators: operatorCount
      }
    }

    // Set cache headers for real-time data (very short cache)
    const response = createSuccessResponse({
      stats: realtimeStats,
      lastUpdate: now.toISOString(),
      updateInterval: 30000, // 30 seconds
      region: operatorData.wilayah
    })

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error: unknown) {
    console.error("Error fetching realtime stats:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch realtime stats"
    return createErrorResponse(errorMessage)
  }
})

// WebSocket-like endpoint for continuous updates (using Server-Sent Events)
export const POST = withAuth(async (req: NextRequest, user: AuthenticatedUser) => {
  try {
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // This would be used to establish SSE connection for real-time updates
    // For now, return configuration for client-side polling
    return createSuccessResponse({
      message: "Realtime stats configuration",
      config: {
        pollingInterval: 30000, // 30 seconds
        endpoint: "/api/operator/realtime-stats",
        enableNotifications: true,
        enableAutoRefresh: true
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error("Error configuring realtime stats:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to configure realtime stats"
    return createErrorResponse(errorMessage)
  }
})
